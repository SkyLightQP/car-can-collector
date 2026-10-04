import { createCallerFactory, protectedProcedure, router } from './trpc';

const user = { id: 'user-1', email: 'me@example.com', name: '나' };
const whoAmIRouter = router({ me: protectedProcedure.query(({ ctx }) => ctx.user.email) });

describe('protectedProcedure', () => {
  it('로그인 사용자가 없으면 UNAUTHORIZED', async () => {
    const caller = createCallerFactory(whoAmIRouter)({ user: null });
    await expect(caller.me()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('로그인 사용자가 있으면 ctx.user 를 그대로 넘긴다', async () => {
    const caller = createCallerFactory(whoAmIRouter)({ user });
    await expect(caller.me()).resolves.toBe('me@example.com');
  });
});
