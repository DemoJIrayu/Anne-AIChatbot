import PostgresConnection from './postgres/connection';
import MongoConnection from './mongodb/connection';
import RedisConnection from './redis/connection';
import { businessOwnerRepository, shopRepository, settingRepository, knowledgeSourceRepository } from './postgres/repositories';
import { lineMessageRepository, facebookMessageRepository } from './mongodb/repositories';
import { cacheRepository, lockRepository } from './redis/repositories';
export declare function initializeDatabaseConnections(): Promise<void>;
export declare function closeDatabaseConnections(): Promise<void>;
export { businessOwnerRepository, shopRepository, settingRepository, knowledgeSourceRepository, lineMessageRepository, facebookMessageRepository, cacheRepository, lockRepository, };
export { PostgresConnection, MongoConnection, RedisConnection, };
//# sourceMappingURL=index.d.ts.map