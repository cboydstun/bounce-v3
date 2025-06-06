import mongoose from "mongoose";
declare class Database {
  private static instance;
  private isConnected;
  private constructor();
  static getInstance(): Database;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnectionReady(): boolean;
  getConnection(): mongoose.Connection;
}
export declare const database: Database;
export default database;
//# sourceMappingURL=database.d.ts.map
