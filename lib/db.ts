import mongoose from 'mongoose';

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const g = globalThis as typeof globalThis & { mongooseCache?: Cache };
const cache = (g.mongooseCache ??= { conn: null, promise: null });

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing');

  if (cache.conn?.connection.readyState === 1) return cache.conn;
  if (cache.conn) {
    cache.conn = null;
    cache.promise = null;
  }

  const attempt = cache.promise ?? (cache.promise = mongoose.connect(uri, {
    bufferCommands: false,
    maxPoolSize: 10,
    minPoolSize: 0,
    maxIdleTimeMS: 10_000,
    serverSelectionTimeoutMS: 10_000,
  }));

  try {
    cache.conn = await attempt;
    return cache.conn;
  } catch (error) {
    // A rejected connection promise must not poison this serverless instance forever.
    if (cache.promise === attempt) {
      cache.promise = null;
      cache.conn = null;
    }
    throw error;
  }
}
