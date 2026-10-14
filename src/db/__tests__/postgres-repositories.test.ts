import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';
import { 
  BusinessOwnerRepository,
  ShopRepository,
  SettingRepository,
  KnowledgeSourceRepository
} from '../postgres/repositories';

// Mock the entire @prisma/client module
vi.mock('@prisma/client', () => {
  const mockPrisma = {
    businessOwner: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    shop: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    setting: {
      create: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    knowledgeSource: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  return {
    PrismaClient: vi.fn(() => mockPrisma),
  };
});

describe('PostgreSQL Repositories', () => {
  let businessOwnerRepo: BusinessOwnerRepository;
  let shopRepo: ShopRepository;
  let settingRepo: SettingRepository;
  let knowledgeSourceRepo: KnowledgeSourceRepository;

  beforeEach(() => {
    businessOwnerRepo = new BusinessOwnerRepository();
    shopRepo = new ShopRepository();
    settingRepo = new SettingRepository();
    knowledgeSourceRepo = new KnowledgeSourceRepository();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('BusinessOwnerRepository', () => {
    it('should create a business owner', async () => {
      const mockData: any = { name: 'Test Owner', email: 'test@example.com' };
      const mockResult: any = { id: '1', ...mockData, createdAt: new Date(), updatedAt: new Date() };
      
      (businessOwnerRepo as any).prisma.businessOwner.create.mockResolvedValue(mockResult);

      const result = await businessOwnerRepo.create(mockData);
      
      expect(result).toEqual(mockResult);
      expect((businessOwnerRepo as any).prisma.businessOwner.create).toHaveBeenCalledWith({ data: mockData });
    });

    it('should find business owner by id', async () => {
      const mockResult: any = { id: '1', name: 'Test Owner', email: 'test@example.com' };
      
      (businessOwnerRepo as any).prisma.businessOwner.findUnique.mockResolvedValue(mockResult);

      const result = await businessOwnerRepo.findById('1');
      
      expect(result).toEqual(mockResult);
      expect((businessOwnerRepo as any).prisma.businessOwner.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { shops: true },
      });
    });
  });

  describe('ShopRepository', () => {
    it('should create a shop', async () => {
      const mockData: any = { name: 'Test Shop', businessOwnerId: '1' };
      const mockResult: any = { id: '1', ...mockData, createdAt: new Date(), updatedAt: new Date() };
      
      (shopRepo as any).prisma.shop.create.mockResolvedValue(mockResult);

      const result = await shopRepo.create(mockData);
      
      expect(result).toEqual(mockResult);
      expect((shopRepo as any).prisma.shop.create).toHaveBeenCalledWith({ data: mockData });
    });
  });

  describe('SettingRepository', () => {
    it('should create a setting', async () => {
      const mockData: any = { shopId: '1', autoReply: true };
      const mockResult: any = { id: '1', ...mockData, welcomeMessage: null, createdAt: new Date(), updatedAt: new Date() };
      
      (settingRepo as any).prisma.setting.create.mockResolvedValue(mockResult);

      const result = await settingRepo.create(mockData);
      
      expect(result).toEqual(mockResult);
      expect((settingRepo as any).prisma.setting.create).toHaveBeenCalledWith({ data: mockData });
    });
  });

  describe('KnowledgeSourceRepository', () => {
    it('should create a knowledge source', async () => {
      const mockData: any = { shopId: '1', name: 'Test Source', type: 'pdf', source: '/path/to/file.pdf' };
      const mockResult: any = { id: '1', ...mockData, status: 'pending', createdAt: new Date(), updatedAt: new Date() };
      
      (knowledgeSourceRepo as any).prisma.knowledgeSource.create.mockResolvedValue(mockResult);

      const result = await knowledgeSourceRepo.create(mockData);
      
      expect(result).toEqual(mockResult);
      expect((knowledgeSourceRepo as any).prisma.knowledgeSource.create).toHaveBeenCalledWith({ data: mockData });
    });
  });
});