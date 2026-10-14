import { Connection } from 'mongoose';
declare class MongoConnection {
    private static instance;
    private connection;
    private constructor();
    static getInstance(): MongoConnection;
    connect(): Promise<void>;
    getConnection(): Connection | null;
    disconnect(): Promise<void>;
}
export default MongoConnection;
//# sourceMappingURL=connection.d.ts.map