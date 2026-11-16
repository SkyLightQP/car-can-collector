import { type ApiKeyView, type CreateApiKeyInput, type CreatedApiKey, type DeleteApiKeyInput } from '../schemas/api-key.schema';
export interface ApiKeyOperations {
    listApiKeys(): Promise<ApiKeyView[]>;
    createApiKey(input: CreateApiKeyInput): Promise<CreatedApiKey>;
    deleteApiKey(input: DeleteApiKeyInput): Promise<DeleteApiKeyInput | null>;
}
export declare function createApiKeyRouter(operations: ApiKeyOperations): import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../trpc").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            id: string;
            name: string;
            prefix: string;
            createdAt: string;
        }[];
        meta: object;
    }>;
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
        };
        output: {
            id: string;
            name: string;
            prefix: string;
            createdAt: string;
            key: string;
        };
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
        };
        meta: object;
    }>;
}>>;
