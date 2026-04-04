import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectToMongo(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI);
  }

  try {
    return await connectionPromise;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
}
