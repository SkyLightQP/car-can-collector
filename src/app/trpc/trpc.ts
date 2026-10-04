import { initTRPC, TRPCError } from '@trpc/server';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface Context {
  user: AuthUser | null;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { user: ctx.user } });
});
