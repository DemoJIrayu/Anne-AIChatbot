import { ILineMessage, IFacebookMessage } from './models';
export declare class LineMessageRepository {
    create(data: any): Promise<ILineMessage>;
    findById(messageId: string): Promise<ILineMessage | null>;
    findByUserId(userId: string, limit?: number): Promise<ILineMessage[]>;
    findByShopId(shopId: string, limit?: number): Promise<ILineMessage[]>;
    updateReply(messageId: string, reply: string): Promise<ILineMessage | null>;
    deleteById(messageId: string): Promise<ILineMessage | null>;
}
export declare class FacebookMessageRepository {
    create(data: any): Promise<IFacebookMessage>;
    findById(messageId: string): Promise<IFacebookMessage | null>;
    findByUserId(userId: string, limit?: number): Promise<IFacebookMessage[]>;
    findByShopId(shopId: string, limit?: number): Promise<IFacebookMessage[]>;
    updateReply(messageId: string, reply: string): Promise<IFacebookMessage | null>;
    deleteById(messageId: string): Promise<IFacebookMessage | null>;
}
export declare const lineMessageRepository: LineMessageRepository;
export declare const facebookMessageRepository: FacebookMessageRepository;
//# sourceMappingURL=repositories.d.ts.map