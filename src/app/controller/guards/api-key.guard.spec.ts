import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { ApiKeyService } from '@app/service/api-key.service';
import { ApiKeyGuard } from './api-key.guard';

function contextWithHeader(value: string | undefined): ExecutionContext {
  const request = { header: (name: string) => (name.toLowerCase() === 'x-api-key' ? value : undefined) };
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

function setup(valid: boolean) {
  const isValid = jest.fn().mockResolvedValue(valid);
  const guard = new ApiKeyGuard({ isValid } as unknown as ApiKeyService);
  return { guard, isValid };
}

describe('ApiKeyGuard', () => {
  it('등록된 키면 통과시킨다', async () => {
    const { guard, isValid } = setup(true);
    await expect(guard.canActivate(contextWithHeader('cck_device'))).resolves.toBe(true);
    expect(isValid).toHaveBeenCalledWith('cck_device');
  });

  it('등록되지 않았거나 헤더가 없으면 401 이다', async () => {
    const { guard } = setup(false);
    await expect(guard.canActivate(contextWithHeader('cck_unknown'))).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(guard.canActivate(contextWithHeader(undefined))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
