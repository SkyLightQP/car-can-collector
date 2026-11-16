import { z } from 'zod';
export declare const createApiKeyInputSchema: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
export type CreateApiKeyInput = z.infer<typeof createApiKeyInputSchema>;
export declare const deleteApiKeyInputSchema: z.ZodObject<{
    id: z.ZodUUID;
}, z.core.$strip>;
export type DeleteApiKeyInput = z.infer<typeof deleteApiKeyInputSchema>;
export declare const apiKeySchema: z.ZodObject<{
    id: z.ZodUUID;
    name: z.ZodString;
    prefix: z.ZodString;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type ApiKeyView = z.infer<typeof apiKeySchema>;
export declare const apiKeysSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodUUID;
    name: z.ZodString;
    prefix: z.ZodString;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>>;
export declare const createdApiKeySchema: z.ZodObject<{
    id: z.ZodUUID;
    name: z.ZodString;
    prefix: z.ZodString;
    createdAt: z.ZodISODateTime;
    key: z.ZodString;
}, z.core.$strip>;
export type CreatedApiKey = z.infer<typeof createdApiKeySchema>;
