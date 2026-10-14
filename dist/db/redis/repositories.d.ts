export declare class CacheRepository {
    private redis;
    set(key: string, value: string, expirySeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    delete(key: string): Promise<number>;
    exists(key: string): Promise<boolean>;
    expire(key: string, seconds: number): Promise<boolean>;
    flushAll(): Promise<void>;
}
export declare class LockRepository {
    private redis;
    acquireLock(lockKey: string, lockValue: string, timeoutSeconds: number): Promise<boolean>;
    releaseLock(lockKey: string, lockValue: string): Promise<boolean>;
    isLocked(lockKey: string): Promise<boolean>;
    getLockValue(lockKey: string): Promise<string | null>;
}
export declare const cacheRepository: CacheRepository;
export declare const lockRepository: LockRepository;
//# sourceMappingURL=repositories.d.ts.map