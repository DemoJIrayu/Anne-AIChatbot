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
export declare class BusinessOwnerRepository {
    private prisma;
    constructor();
    create(data: Omit<BusinessOwner, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessOwner>;
    findById(id: string): Promise<BusinessOwner | null>;
    findByEmail(email: string): Promise<BusinessOwner | null>;
    findAll(): Promise<BusinessOwner[]>;
    update(id: string, data: Partial<Omit<BusinessOwner, 'id' | 'createdAt' | 'updatedAt'>>): Promise<BusinessOwner>;
    delete(id: string): Promise<BusinessOwner>;
}
export declare class ShopRepository {
    private prisma;
    constructor();
    create(data: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>): Promise<Shop>;
    findById(id: string): Promise<Shop | null>;
    findByBusinessOwnerId(businessOwnerId: string): Promise<Shop[]>;
    findAll(): Promise<Shop[]>;
    update(id: string, data: Partial<Omit<Shop, 'id' | 'businessOwnerId' | 'createdAt' | 'updatedAt'>>): Promise<Shop>;
    delete(id: string): Promise<Shop>;
}
export declare class SettingRepository {
    private prisma;
    constructor();
    create(data: Omit<Setting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Setting>;
    findByShopId(shopId: string): Promise<Setting | null>;
    updateByShopId(shopId: string, data: Partial<Omit<Setting, 'id' | 'shopId' | 'createdAt' | 'updatedAt'>>): Promise<Setting>;
    deleteByShopId(shopId: string): Promise<Setting>;
}
export declare class KnowledgeSourceRepository {
    private prisma;
    constructor();
    create(data: Omit<KnowledgeSource, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeSource>;
    findById(id: string): Promise<KnowledgeSource | null>;
    findByShopId(shopId: string): Promise<KnowledgeSource[]>;
    update(id: string, data: Partial<Omit<KnowledgeSource, 'id' | 'shopId' | 'createdAt' | 'updatedAt'>>): Promise<KnowledgeSource>;
    delete(id: string): Promise<KnowledgeSource>;
    updateStatus(id: string, status: string): Promise<KnowledgeSource>;
}
export declare const businessOwnerRepository: BusinessOwnerRepository;
export declare const shopRepository: ShopRepository;
export declare const settingRepository: SettingRepository;
export declare const knowledgeSourceRepository: KnowledgeSourceRepository;
export {};
//# sourceMappingURL=repositories.d.ts.map