import { generateApiKeySecret, hashApiKey } from './api-key';

describe('generateApiKeySecret', () => {
  it('ccc_ 접두사와 43자 base64url 본문으로 키를 만들고 앞 12자를 표시용 prefix 로 둔다', () => {
    const { key, prefix } = generateApiKeySecret();
    expect(key).toMatch(/^ccc_[A-Za-z0-9_-]{43}$/);
    expect(prefix).toBe(key.slice(0, 12));
  });

  it('hash 는 키의 SHA-256 hex 다', () => {
    const { key, hash } = generateApiKeySecret();
    expect(hash).toBe(hashApiKey(key));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('호출할 때마다 다른 키를 만든다', () => {
    expect(generateApiKeySecret().key).not.toBe(generateApiKeySecret().key);
  });
});

describe('hashApiKey', () => {
  it("Postgres 의 encode(sha256(convert_to(key, 'UTF8')), 'hex') 와 같은 값을 낸다", () => {
    expect(hashApiKey('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
