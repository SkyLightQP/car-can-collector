import { Injectable } from '@nestjs/common';
import { type ApiKey, generateApiKeySecret, hashApiKey } from '@app/domain/api-key/api-key';
import type { ApiKeyOperations } from '@app/trpc/routers/api-key.router';
import type { ApiKeyView, CreateApiKeyInput, CreatedApiKey, DeleteApiKeyInput } from '@app/trpc/schemas/api-key.schema';
import { ApiKeyRepository } from '@infrastructure/repository/api-key.repository';

@Injectable()
export class ApiKeyService implements ApiKeyOperations {
  constructor(private readonly apiKeyRepository: ApiKeyRepository) {}

  async listApiKeys(): Promise<ApiKeyView[]> {
    const apiKeys = await this.apiKeyRepository.findAll();
    return apiKeys.map(toView);
  }

  async createApiKey({ name }: CreateApiKeyInput): Promise<CreatedApiKey> {
    const { key, hash, prefix } = generateApiKeySecret();
    const apiKey = await this.apiKeyRepository.create({ name, keyHash: hash, keyPrefix: prefix });
    return { ...toView(apiKey), key };
  }

  async deleteApiKey({ id }: DeleteApiKeyInput): Promise<DeleteApiKeyInput | null> {
    const deleted = await this.apiKeyRepository.delete(id);
    return deleted ? { id } : null;
  }

  isValid(key: string | undefined): Promise<boolean> {
    if (!key) return Promise.resolve(false);
    return this.apiKeyRepository.existsByHash(hashApiKey(key));
  }
}

function toView(apiKey: ApiKey): ApiKeyView {
  return {
    id: apiKey.id,
    name: apiKey.name,
    prefix: apiKey.prefix,
    createdAt: apiKey.createdAt.toISOString(),
  };
}
