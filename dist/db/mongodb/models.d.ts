import mongoose, { Document } from 'mongoose';
export interface ILineMessage extends Document {
    messageId: string;
    userId: string;
    shopId: string;
    timestamp: Date;
    type: string;
    text?: string;
    payload?: any;
    reply?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IFacebookMessage extends Document {
    messageId: string;
    userId: string;
    shopId: string;
    timestamp: Date;
    type: string;
    text?: string;
    payload?: any;
    reply?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const LineMessage: mongoose.Model<ILineMessage, {}, {}, {}, mongoose.Document<unknown, {}, ILineMessage, {}, mongoose.DefaultSchemaOptions> & ILineMessage & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ILineMessage & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const FacebookMessage: mongoose.Model<IFacebookMessage, {}, {}, {}, mongoose.Document<unknown, {}, IFacebookMessage, {}, mongoose.DefaultSchemaOptions> & IFacebookMessage & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IFacebookMessage & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=models.d.ts.map