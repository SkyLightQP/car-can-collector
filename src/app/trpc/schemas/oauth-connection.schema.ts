import { z } from 'zod';

export const oauthConnectionSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  clientName: z.string().nullable(),
  scopes: z.array(z.string()),
  connectedAt: z.iso.datetime(),
  lastTokenIssuedAt: z.iso.datetime().nullable(),
});
export type OAuthConnectionView = z.infer<typeof oauthConnectionSchema>;

export const oauthConnectionsSchema = z.array(oauthConnectionSchema);

export const revokeOAuthConnectionInputSchema = z.object({ id: z.string().min(1) });
export type RevokeOAuthConnectionInput = z.infer<typeof revokeOAuthConnectionInputSchema>;
