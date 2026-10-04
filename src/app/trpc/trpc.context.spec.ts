import { createContextFactory } from './trpc.context';

const user = { id: 'user-1', email: 'me@example.com', name: '나' };
const headers = { authorization: 'Bearer token-1' };

describe('createContextFactory', () => {
  it('세션 리더가 찾은 사용자를 ctx.user 로 넣는다', async () => {
    const findUser = jest.fn().mockResolvedValue(user);
    const createContext = createContextFactory({ findUser });

    await expect(createContext({ req: { headers } })).resolves.toEqual({ user });
    expect(findUser).toHaveBeenCalledWith(headers);
  });

  it('세션이 없으면 ctx.user 는 null', async () => {
    const createContext = createContextFactory({ findUser: jest.fn().mockResolvedValue(null) });
    await expect(createContext({ req: { headers: {} } })).resolves.toEqual({ user: null });
  });

  it('세션 조회가 실패하면 null 로 삼키지 않고 예외를 전파한다', async () => {
    const createContext = createContextFactory({ findUser: jest.fn().mockRejectedValue(new Error('db down')) });
    await expect(createContext({ req: { headers } })).rejects.toThrow('db down');
  });
});
