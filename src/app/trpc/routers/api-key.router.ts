import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc';
import {
  apiKeysSchema,
  type ApiKeyView,
  type CreateApiKeyInput,
  createApiKeyInputSchema,
  type CreatedApiKey,
  createdApiKeySchema,
  type DeleteApiKeyInput,
  deleteApiKeyInputSchema,
} from '../schemas/api-key.schema';

export interface ApiKeyOperations {
  listApiKeys(): Promise<ApiKeyView[]>;
  createApiKey(input: CreateApiKeyInput): Promise<CreatedApiKey>;
  deleteApiKey(input: DeleteApiKeyInput): Promise<DeleteApiKeyInput | null>;
}

export function createApiKeyRouter(operations: ApiKeyOperations) {
  return router({
    list: protectedProcedure.output(apiKeysSchema).query(() => operations.listApiKeys()),
    create: protectedProcedure
      .input(createApiKeyInputSchema)
      .output(createdApiKeySchema)
      .mutation(({ input }) => operations.createApiKey(input)),
    delete: protectedProcedure
      .input(deleteApiKeyInputSchema)
      .output(deleteApiKeyInputSchema)
      .mutation(async ({ input }) => {
        const deleted = await operations.deleteApiKey(input);
        if (deleted === null) throw new TRPCError({ code: 'NOT_FOUND', message: 'API 키가 없다' });
        return deleted;
      }),
  });
}
