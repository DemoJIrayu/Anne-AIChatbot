"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeSourceRepository = exports.settingRepository = exports.shopRepository = exports.businessOwnerRepository = exports.KnowledgeSourceRepository = exports.SettingRepository = exports.ShopRepository = exports.BusinessOwnerRepository = void 0;
const connection_1 = __importDefault(require("./connection"));
const logger_1 = __importDefault(require("../../utils/logger"));
class BusinessOwnerRepository {
    constructor() {
        this.prisma = connection_1.default.getInstance().getClient();
    }
    async create(data) {
        try {
            const businessOwner = await this.prisma.businessOwner.create({
                data: data,
            });
            logger_1.default.info(`Created business owner: ${businessOwner.id}`);
            return businessOwner;
        }
        catch (error) {
            logger_1.default.error('Error creating business owner:', { error: error.message || error });
            throw error;
        }
    }
    async findById(id) {
        try {
            return await this.prisma.businessOwner.findUnique({
                where: { id },
                include: { shops: true },
            });
        }
        catch (error) {
            logger_1.default.error(`Error finding business owner by id ${id}:`, { error: error.message || error });
            throw error;
        }
    }
    async findByEmail(email) {
        try {
            return await this.prisma.businessOwner.findUnique({
                where: { email },
                include: { shops: true },
            });
        }
        catch (error) {
            logger_1.default.error(`Error finding business owner by email ${email}:`, { error: error.message || error });
            throw error;
        }
    }
    async findAll() {
        try {
            return await this.prisma.businessOwner.findMany({
                include: { shops: true },
            });
        }
        catch (error) {
            logger_1.default.error('Error finding all business owners:', { error: error.message || error });
            throw error;
        }
    }
    async update(id, data) {
        try {
            const businessOwner = await this.prisma.businessOwner.update({
                where: { id },
                data: data,
            });
            logger_1.default.info(`Updated business owner: ${id}`);
            return businessOwner;
        }
        catch (error) {
            logger_1.default.error(`Error updating business owner ${id}:`, { error: error.message || error });
            throw error;
        }
    }
    async delete(id) {
        try {
            const businessOwner = await this.prisma.businessOwner.delete({
                where: { id },
            });
            logger_1.default.info(`Deleted business owner: ${id}`);
            return businessOwner;
        }
        catch (error) {
            logger_1.default.error(`Error deleting business owner ${id}:`, { error: error.message || error });
            throw error;
        }
    }
}
exports.BusinessOwnerRepository = BusinessOwnerRepository;
class ShopRepository {
    constructor() {
        this.prisma = connection_1.default.getInstance().getClient();
    }
    async create(data) {
        try {
            const shop = await this.prisma.shop.create({
                data: data,
            });
            logger_1.default.info(`Created shop: ${shop.id}`);
            return shop;
        }
        catch (error) {
            logger_1.default.error('Error creating shop:', { error: error.message || error });
            throw error;
        }
    }
    async findById(id) {
        try {
            return await this.prisma.shop.findUnique({
                where: { id },
                include: { settings: true, knowledgeSources: true },
            });
        }
        catch (error) {
            logger_1.default.error(`Error finding shop by id ${id}:`, { error: error.message || error });
            throw error;
        }
    }
    async findByBusinessOwnerId(businessOwnerId) {
        try {
            return await this.prisma.shop.findMany({
                where: { businessOwnerId },
                include: { settings: true, knowledgeSources: true },
            });
        }
        catch (error) {
            logger_1.default.error(`Error finding shops by business owner id ${businessOwnerId}:`, { error: error.message || error });
            throw error;
        }
    }
    async findAll() {
        try {
            return await this.prisma.shop.findMany({
                include: { settings: true, knowledgeSources: true },
            });
        }
        catch (error) {
            logger_1.default.error('Error finding all shops:', { error: error.message || error });
            throw error;
        }
    }
    async update(id, data) {
        try {
            const shop = await this.prisma.shop.update({
                where: { id },
                data: data,
            });
            logger_1.default.info(`Updated shop: ${id}`);
            return shop;
        }
        catch (error) {
            logger_1.default.error(`Error updating shop ${id}:`, { error: error.message || error });
            throw error;
        }
    }
    async delete(id) {
        try {
            const shop = await this.prisma.shop.delete({
                where: { id },
            });
            logger_1.default.info(`Deleted shop: ${id}`);
            return shop;
        }
        catch (error) {
            logger_1.default.error(`Error deleting shop ${id}:`, { error: error.message || error });
            throw error;
        }
    }
}
exports.ShopRepository = ShopRepository;
class SettingRepository {
    constructor() {
        this.prisma = connection_1.default.getInstance().getClient();
    }
    async create(data) {
        try {
            const setting = await this.prisma.setting.create({
                data: data,
            });
            logger_1.default.info(`Created setting for shop: ${data.shopId}`);
            return setting;
        }
        catch (error) {
            logger_1.default.error('Error creating setting:', { error: error.message || error });
            throw error;
        }
    }
    async findByShopId(shopId) {
        try {
            return await this.prisma.setting.findUnique({
                where: { shopId },
            });
        }
        catch (error) {
            logger_1.default.error(`Error finding setting by shop id ${shopId}:`, { error: error.message || error });
            throw error;
        }
    }
    async updateByShopId(shopId, data) {
        try {
            const setting = await this.prisma.setting.upsert({
                where: { shopId },
                update: data,
                create: { shopId, ...data },
            });
            logger_1.default.info(`Updated setting for shop: ${shopId}`);
            return setting;
        }
        catch (error) {
            logger_1.default.error(`Error updating setting for shop ${shopId}:`, { error: error.message || error });
            throw error;
        }
    }
    async deleteByShopId(shopId) {
        try {
            const setting = await this.prisma.setting.delete({
                where: { shopId },
            });
            logger_1.default.info(`Deleted setting for shop: ${shopId}`);
            return setting;
        }
        catch (error) {
            logger_1.default.error(`Error deleting setting for shop ${shopId}:`, { error: error.message || error });
            throw error;
        }
    }
}
exports.SettingRepository = SettingRepository;
class KnowledgeSourceRepository {
    constructor() {
        this.prisma = connection_1.default.getInstance().getClient();
    }
    async create(data) {
        try {
            const knowledgeSource = await this.prisma.knowledgeSource.create({
                data: data,
            });
            logger_1.default.info(`Created knowledge source: ${knowledgeSource.id}`);
            return knowledgeSource;
        }
        catch (error) {
            logger_1.default.error('Error creating knowledge source:', { error: error.message || error });
            throw error;
        }
    }
    async findById(id) {
        try {
            return await this.prisma.knowledgeSource.findUnique({
                where: { id },
            });
        }
        catch (error) {
            logger_1.default.error(`Error finding knowledge source by id ${id}:`, { error: error.message || error });
            throw error;
        }
    }
    async findByShopId(shopId) {
        try {
            return await this.prisma.knowledgeSource.findMany({
                where: { shopId },
            });
        }
        catch (error) {
            logger_1.default.error(`Error finding knowledge sources by shop id ${shopId}:`, { error: error.message || error });
            throw error;
        }
    }
    async update(id, data) {
        try {
            const knowledgeSource = await this.prisma.knowledgeSource.update({
                where: { id },
                data: data,
            });
            logger_1.default.info(`Updated knowledge source: ${id}`);
            return knowledgeSource;
        }
        catch (error) {
            logger_1.default.error(`Error updating knowledge source ${id}:`, { error: error.message || error });
            throw error;
        }
    }
    async delete(id) {
        try {
            const knowledgeSource = await this.prisma.knowledgeSource.delete({
                where: { id },
            });
            logger_1.default.info(`Deleted knowledge source: ${id}`);
            return knowledgeSource;
        }
        catch (error) {
            logger_1.default.error(`Error deleting knowledge source ${id}:`, { error: error.message || error });
            throw error;
        }
    }
    async updateStatus(id, status) {
        try {
            const knowledgeSource = await this.prisma.knowledgeSource.update({
                where: { id },
                data: { status },
            });
            logger_1.default.info(`Updated knowledge source status ${id} to ${status}`);
            return knowledgeSource;
        }
        catch (error) {
            logger_1.default.error(`Error updating knowledge source status ${id}:`, { error: error.message || error });
            throw error;
        }
    }
}
exports.KnowledgeSourceRepository = KnowledgeSourceRepository;
exports.businessOwnerRepository = new BusinessOwnerRepository();
exports.shopRepository = new ShopRepository();
exports.settingRepository = new SettingRepository();
exports.knowledgeSourceRepository = new KnowledgeSourceRepository();
//# sourceMappingURL=repositories.js.map