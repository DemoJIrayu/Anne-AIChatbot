import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
export declare function initializeLineIntegration(prismaClient: PrismaClient): void;
export declare const verifySignature: (req: Request, res: Response, next: Function) => void;
export declare const handleWebhook: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=webhook.d.ts.map