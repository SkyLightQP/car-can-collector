import { z } from 'zod';

export const createApiKeyInputSchema = z.object({ name: z.string().trim().min(1).max(50) });
export type CreateApiKeyInput = z.infer<typeof createApiKeyInputSchema>;

export const deleteApiKeyInputSchema = z.object({ id: z.uuid() });
export type DeleteApiKeyInput = z.infer<typeof deleteApiKeyInputSchema>;

export const apiKeySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  prefix: z.string(),
  createdAt: z.iso.datetime(),
});
export type ApiKeyView = z.infer<typeof apiKeySchema>;

export const apiKeysSchema = z.array(apiKeySchema);

export const createdApiKeySchema = apiKeySchema.extend({ key: z.string() });
export type CreatedApiKey = z.infer<typeof createdApiKeySchema>;
