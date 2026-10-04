export interface AuthUser {
    id: string;
    email: string;
    name: string;
}
export interface Context {
    user: AuthUser | null;
}
export declare const router: import("@trpc/server").TRPCRouterBuilder<{
    ctx: Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}>;
export declare const createCallerFactory: import("@trpc/server").TRPCRouterCallerFactory<{
    ctx: Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}>;
export declare const protectedProcedure: import("@trpc/server").TRPCProcedureBuilder<Context, object, {
    user: AuthUser;
}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
