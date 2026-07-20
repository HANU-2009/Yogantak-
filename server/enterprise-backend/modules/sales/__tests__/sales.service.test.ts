import { prisma } from '../../../config/database';

jest.mock('../../../config/database', () => ({
  prisma: {
    $transaction: jest.fn((cb) => cb(prisma)),
  },
}));

describe('SalesService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have basic tests initialized', () => {
    expect(true).toBe(true);
  });
});
