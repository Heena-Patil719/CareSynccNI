import "dotenv/config";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

const globalState = globalThis as typeof globalThis & {
  __careSyncMongoClientPromise?: Promise<MongoClient>;
};

function getMongoUri() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  return uri;
}

function getClientPromise() {
  if (!globalState.__careSyncMongoClientPromise) {
    const client = new MongoClient(getMongoUri(), {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    globalState.__careSyncMongoClientPromise = client.connect().catch((error) => {
      delete globalState.__careSyncMongoClientPromise;
      throw error;
    });
  }

  return globalState.__careSyncMongoClientPromise;
}

function getDatabaseName() {
  const dbNameFromEnv = process.env.MONGODB_DB?.trim();
  if (dbNameFromEnv) {
    return dbNameFromEnv;
  }

  try {
    const parsed = new URL(getMongoUri());
    const dbNameFromPath = parsed.pathname.replace(/^\//, "").trim();
    return dbNameFromPath || "caresync";
  } catch {
    return "caresync";
  }
}

export async function getDb() {
  const connectedClient = await getClientPromise();
  return connectedClient.db(getDatabaseName());
}

export function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return new ObjectId(id);
}
