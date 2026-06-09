import mongoose from 'mongoose';
export declare function isMongoConfigured(): boolean;
export declare function connectMongo(): Promise<typeof mongoose>;
export declare function disconnectMongo(): Promise<void>;
export default mongoose;
//# sourceMappingURL=mongo.d.ts.map