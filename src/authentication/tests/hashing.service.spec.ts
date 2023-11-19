import { HashingService } from '../hashing.service';

describe('hashing service', () => {
  let hashingService: HashingService;

  beforeEach(() => {
    hashingService = new HashingService();
  });

  it('should hash password', async () => {
    // arrange
    const password = 'hello rabiaa';

    // act
    const hash = await hashingService.hashpassword(password);
    const clearText = await hashingService.verifyPassword(password, hash);

    // assert
    expect(hash).toBeDefined();
    expect(clearText).toBeDefined();
    expect(clearText).toBe(true);
  });
});
