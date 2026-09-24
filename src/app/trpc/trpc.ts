import { initTRPC } from '@trpc/server';

/**
 * 요청별 tRPC 컨텍스트.
 *
 * 지금은 인증이 없어 비어 있다. 로그인이 붙으면 createContext(trpc.context.ts)에서
 * 사용자 정보를 채우고 이 타입에 필드를 추가한다.
 */
export type Context = Record<string, never>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
