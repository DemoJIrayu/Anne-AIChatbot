import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
export declare function initializeFacebookIntegration(prismaClient: PrismaClient): void;
export declare const verifyWebhook: (req: Request, res: Response) => void;
export declare const handleWebhook: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=webhook.d.ts.map