import { z } from 'zod';
export declare const oauthConnectionSchema: z.ZodObject<{
    id: z.ZodString;
    clientId: z.ZodString;
    clientName: z.ZodNullable<z.ZodString>;
    scopes: z.ZodArray<z.ZodString>;
    connectedAt: z.ZodISODateTime;
    lastTokenIssuedAt: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strip>;
export type OAuthConnectionView = z.infer<typeof oauthConnectionSchema>;
export declare const oauthConnectionsSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    clientId: z.ZodString;
    clientName: z.ZodNullable<z.ZodString>;
    scopes: z.ZodArray<z.ZodString>;
    connectedAt: z.ZodISODateTime;
    lastTokenIssuedAt: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strip>>;
export declare const revokeOAuthConnectionInputSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export type RevokeOAuthConnectionInput = z.infer<typeof revokeOAuthConnectionInputSchema>;
