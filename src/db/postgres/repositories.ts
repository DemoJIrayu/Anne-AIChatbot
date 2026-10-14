import { PrismaClient } from '@prisma/client';
import PostgresConnection from './connection';
import logger from '../../utils/logger';

// Type definitions for our models
type BusinessOwner = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

type Shop = {
  id: string;
  name: string;
  businessOwnerId: string;
  createdAt: Date;
  updatedAt: Date;
};

type Setting = {
  id: string;
  shopId: string;
  autoReply: boolean;
  welcomeMessage: string | null;
  systemPrompt: string | null;
  replyTone: string | null;
  confidenceThreshold: number | null;
  fallbackMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type KnowledgeSource = {
  id: string;
  shopId: string;
  name: string;
  type: string;
  source: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export class BusinessOwnerRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PostgresConnection.getInstance().getClient();
  }

  async create(data: Omit<BusinessOwner, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessOwner> {
    try {
      const businessOwner = await this.prisma.businessOwner.create({
        data: data as any,
      });
      logger.info(`Created business owner: ${businessOwner.id}`);
      return businessOwner as BusinessOwner;
    } catch (error: any) {
      logger.error('Error creating business owner:', { error: error.message || error });
      throw error;
    }
  }

  async findById(id: string): Promise<BusinessOwner | null> {
    try {
      return await this.prisma.businessOwner.findUnique({
        where: { id },
        include: { shops: true },
      }) as BusinessOwner | null;
    } catch (error: any) {
      logger.error(`Error finding business owner by id ${id}:`, { error: error.message || error });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<BusinessOwner | null> {
    try {
      return await this.prisma.businessOwner.findUnique({
        where: { email },
        include: { shops: true },
      }) as BusinessOwner | null;
    } catch (error: any) {
      logger.error(`Error finding business owner by email ${email}:`, { error: error.message || error });
      throw error;
    }
  }

  async findAll(): Promise<BusinessOwner[]> {
    try {
      return await this.prisma.businessOwner.findMany({
        include: { shops: true },
      }) as BusinessOwner[];
    } catch (error: any) {
      logger.error('Error finding all business owners:', { error: error.message || error });
      throw error;
    }
  }

  async update(id: string, data: Partial<Omit<BusinessOwner, 'id' | 'createdAt' | 'updatedAt'>>): Promise<BusinessOwner> {
    try {
      const businessOwner = await this.prisma.businessOwner.update({
        where: { id },
        data: data as any,
      });
      logger.info(`Updated business owner: ${id}`);
      return businessOwner as BusinessOwner;
    } catch (error: any) {
      logger.error(`Error updating business owner ${id}:`, { error: error.message || error });
      throw error;
    }
  }

  async delete(id: string): Promise<BusinessOwner> {
    try {
      const businessOwner = await this.prisma.businessOwner.delete({
        where: { id },
      });
      logger.info(`Deleted business owner: ${id}`);
      return businessOwner as BusinessOwner;
    } catch (error: any) {
      logger.error(`Error deleting business owner ${id}:`, { error: error.message || error });
      throw error;
    }
  }
}

export class ShopRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PostgresConnection.getInstance().getClient();
  }

  async create(data: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>): Promise<Shop> {
    try {
      const shop = await this.prisma.shop.create({
        data: data as any,
      });
      logger.info(`Created shop: ${shop.id}`);
      return shop as Shop;
    } catch (error: any) {
      logger.error('Error creating shop:', { error: error.message || error });
      throw error;
    }
  }

  async findById(id: string): Promise<Shop | null> {
    try {
      return await this.prisma.shop.findUnique({
        where: { id },
        include: { settings: true, knowledgeSources: true },
      }) as Shop | null;
    } catch (error: any) {
      logger.error(`Error finding shop by id ${id}:`, { error: error.message || error });
      throw error;
    }
  }

  async findByBusinessOwnerId(businessOwnerId: string): Promise<Shop[]> {
    try {
      return await this.prisma.shop.findMany({
        where: { businessOwnerId },
        include: { settings: true, knowledgeSources: true },
      }) as Shop[];
    } catch (error: any) {
      logger.error(`Error finding shops by business owner id ${businessOwnerId}:`, { error: error.message || error });
      throw error;
    }
  }

  async findAll(): Promise<Shop[]> {
    try {
      return await this.prisma.shop.findMany({
        include: { settings: true, knowledgeSources: true },
      }) as Shop[];
    } catch (error: any) {
      logger.error('Error finding all shops:', { error: error.message || error });
      throw error;
    }
  }

  async update(id: string, data: Partial<Omit<Shop, 'id' | 'businessOwnerId' | 'createdAt' | 'updatedAt'>>): Promise<Shop> {
    try {
      const shop = await this.prisma.shop.update({
        where: { id },
        data: data as any,
      });
      logger.info(`Updated shop: ${id}`);
      return shop as Shop;
    } catch (error: any) {
      logger.error(`Error updating shop ${id}:`, { error: error.message || error });
      throw error;
    }
  }

  async delete(id: string): Promise<Shop> {
    try {
      const shop = await this.prisma.shop.delete({
        where: { id },
      });
      logger.info(`Deleted shop: ${id}`);
      return shop as Shop;
    } catch (error: any) {
      logger.error(`Error deleting shop ${id}:`, { error: error.message || error });
      throw error;
    }
  }
}

export class SettingRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PostgresConnection.getInstance().getClient();
  }

  async create(data: Omit<Setting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Setting> {
    try {
      const setting = await this.prisma.setting.create({
        data: data as any,
      });
      logger.info(`Created setting for shop: ${data.shopId}`);
      return setting as Setting;
    } catch (error: any) {
      logger.error('Error creating setting:', { error: error.message || error });
      throw error;
    }
  }

  async findByShopId(shopId: string): Promise<Setting | null> {
    try {
      return await this.prisma.setting.findUnique({
        where: { shopId },
      }) as Setting | null;
    } catch (error: any) {
      logger.error(`Error finding setting by shop id ${shopId}:`, { error: error.message || error });
      throw error;
    }
  }

  async updateByShopId(shopId: string, data: Partial<Omit<Setting, 'id' | 'shopId' | 'createdAt' | 'updatedAt'>>): Promise<Setting> {
    try {
      const setting = await this.prisma.setting.upsert({
        where: { shopId },
        update: data as any,
        create: { shopId, ...(data as any) },
      });
      logger.info(`Updated setting for shop: ${shopId}`);
      return setting as Setting;
    } catch (error: any) {
      logger.error(`Error updating setting for shop ${shopId}:`, { error: error.message || error });
      throw error;
    }
  }

  async deleteByShopId(shopId: string): Promise<Setting> {
    try {
      const setting = await this.prisma.setting.delete({
        where: { shopId },
      });
      logger.info(`Deleted setting for shop: ${shopId}`);
      return setting as Setting;
    } catch (error: any) {
      logger.error(`Error deleting setting for shop ${shopId}:`, { error: error.message || error });
      throw error;
    }
  }
}

export class KnowledgeSourceRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PostgresConnection.getInstance().getClient();
  }

  async create(data: Omit<KnowledgeSource, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeSource> {
    try {
      const knowledgeSource = await this.prisma.knowledgeSource.create({
        data: data as any,
      });
      logger.info(`Created knowledge source: ${knowledgeSource.id}`);
      return knowledgeSource as KnowledgeSource;
    } catch (error: any) {
      logger.error('Error creating knowledge source:', { error: error.message || error });
      throw error;
    }
  }

  async findById(id: string): Promise<KnowledgeSource | null> {
    try {
      return await this.prisma.knowledgeSource.findUnique({
        where: { id },
      }) as KnowledgeSource | null;
    } catch (error: any) {
      logger.error(`Error finding knowledge source by id ${id}:`, { error: error.message || error });
      throw error;
    }
  }

  async findByShopId(shopId: string): Promise<KnowledgeSource[]> {
    try {
      return await this.prisma.knowledgeSource.findMany({
        where: { shopId },
      }) as KnowledgeSource[];
    } catch (error: any) {
      logger.error(`Error finding knowledge sources by shop id ${shopId}:`, { error: error.message || error });
      throw error;
    }
  }

  async update(id: string, data: Partial<Omit<KnowledgeSource, 'id' | 'shopId' | 'createdAt' | 'updatedAt'>>): Promise<KnowledgeSource> {
    try {
      const knowledgeSource = await this.prisma.knowledgeSource.update({
        where: { id },
        data: data as any,
      });
      logger.info(`Updated knowledge source: ${id}`);
      return knowledgeSource as KnowledgeSource;
    } catch (error: any) {
      logger.error(`Error updating knowledge source ${id}:`, { error: error.message || error });
      throw error;
    }
  }

  async delete(id: string): Promise<KnowledgeSource> {
    try {
      const knowledgeSource = await this.prisma.knowledgeSource.delete({
        where: { id },
      });
      logger.info(`Deleted knowledge source: ${id}`);
      return knowledgeSource as KnowledgeSource;
    } catch (error: any) {
      logger.error(`Error deleting knowledge source ${id}:`, { error: error.message || error });
      throw error;
    }
  }

  async updateStatus(id: string, status: string): Promise<KnowledgeSource> {
    try {
      const knowledgeSource = await this.prisma.knowledgeSource.update({
        where: { id },
        data: { status },
      });
      logger.info(`Updated knowledge source status ${id} to ${status}`);
      return knowledgeSource as KnowledgeSource;
    } catch (error: any) {
      logger.error(`Error updating knowledge source status ${id}:`, { error: error.message || error });
      throw error;
    }
  }
}

// Export singleton instances
export const businessOwnerRepository = new BusinessOwnerRepository();
export const shopRepository = new ShopRepository();
export const settingRepository = new SettingRepository();
export const knowledgeSourceRepository = new KnowledgeSourceRepository();