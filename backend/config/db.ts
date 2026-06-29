import { connectDatabase, getDatabaseStatus } from "./database";

export async function connectDB(): Promise<boolean> {
  return connectDatabase();
}

export function getDBStatus(): { isConnected: boolean; connectionName: string | null } {
  return getDatabaseStatus();
}

