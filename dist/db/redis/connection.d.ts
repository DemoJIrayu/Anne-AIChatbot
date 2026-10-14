import Redis from 'ioredis';
declare class RedisConnection {
    private static instance;
    private redis;
    private constructor();
    static getInstance(): RedisConnection;
    connect(): Promise<void>;
    getClient(): Redis;
    disconnect(): Promise<void>;
    isConnected(): boolean;
}
export default RedisConnection;
//# sourceMappingURL=connection.d.ts.map