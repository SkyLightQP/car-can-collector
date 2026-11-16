import { createHash, randomBytes } from 'node:crypto';

const KEY_PREFIX = 'cck_';
const DISPLAY_PREFIX_LENGTH = 12;

export interface ApiKeyInput {
  id: string;
  name: string;
  prefix: string;
  createdAt: Date;
}

export class ApiKey {
  readonly #id: string;
  readonly #name: string;
  readonly #prefix: string;
  readonly #createdAt: Date;

  private constructor(input: ApiKeyInput) {
    this.#id = input.id;
    this.#name = input.name;
    this.#prefix = input.prefix;
    this.#createdAt = input.createdAt;
  }

  get id(): string {
    return this.#id;
  }

  get name(): string {
    return this.#name;
  }

  get prefix(): string {
    return this.#prefix;
  }

  get createdAt(): Date {
    return this.#createdAt;
  }

  static from(input: ApiKeyInput): ApiKey {
    return new ApiKey(input);
  }
}

export interface GeneratedApiKeySecret {
  key: string;
  hash: string;
  prefix: string;
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex');
}

export function generateApiKeySecret(): GeneratedApiKeySecret {
  const key = `${KEY_PREFIX}${randomBytes(32).toString('base64url')}`;
  return { key, hash: hashApiKey(key), prefix: key.slice(0, DISPLAY_PREFIX_LENGTH) };
}
