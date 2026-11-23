import { type OAuthConnectionView, type RevokeOAuthConnectionInput } from '../schemas/oauth-connection.schema';
export interface OAuthConnectionOperations {
    listOAuthConnections(userId: string): Promise<OAuthConnectionView[]>;
    revokeOAuthConnection(userId: string, input: RevokeOAuthConnectionInput): Promise<RevokeOAuthConnectionInput | null>;
}
export declare function createOAuthConnectionRouter(operations: OAuthConnectionOperations): import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../trpc").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            id: string;
            clientId: string;
            clientName: string | null;
            scopes: string[];
            connectedAt: string;
            lastTokenIssuedAt: string | null;
        }[];
        meta: object;
    }>;
    revoke: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
        };
        meta: object;
    }>;
}>>;
