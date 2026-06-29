import mongoose from "mongoose";

let isConnected = false;

/**
 * Connects to the MongoDB database using Mongoose.
 * Prevents application startup crashes by validating the environment variables
 * and handling connection schemes gracefully.
 */
export async function connectDatabase(): Promise<boolean> {
  if (isConnected) {
    return true;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri || !uri.trim()) {
    console.warn("⚠️ MONGODB_URI is not defined or is empty. Falling back to local/Firestore storage.");
    return false;
  }

  const trimmedUri = uri.trim();
  if (!trimmedUri.startsWith("mongodb://") && !trimmedUri.startsWith("mongodb+srv://")) {
    console.warn("⚠️ MONGODB_URI has an invalid scheme. Expected connection string to start with 'mongodb://' or 'mongodb+srv://'.");
    return false;
  }

  try {
    const connection = await mongoose.connect(trimmedUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = connection.connection.readyState === 1;
    console.log("🔌 MongoDB Connected successfully using database.ts to:", connection.connection.name);
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB using database.ts connection logic:", error);
    return false;
  }
}

/**
 * Gets the current connection status of Mongoose.
 */
export function getDatabaseStatus(): { isConnected: boolean; connectionName: string | null } {
  return {
    isConnected: mongoose.connection.readyState === 1,
    connectionName: mongoose.connection.readyState === 1 ? mongoose.connection.name : null,
  };
}
