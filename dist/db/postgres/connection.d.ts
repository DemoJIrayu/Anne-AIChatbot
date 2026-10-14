import { PrismaClient } from '@prisma/client';
declare class PostgresConnection {
    private static instance;
    private prisma;
    private constructor();
    static getInstance(): PostgresConnection;
    getClient(): PrismaClient;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}
export default PostgresConnection;
//# sourceMappingURL=connection.d.ts.map