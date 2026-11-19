import mongoose from 'mongoose';
type Cache={conn:typeof mongoose|null;promise:Promise<typeof mongoose>|null};const g=global as typeof globalThis&{mongooseCache?:Cache};const cache=g.mongooseCache??{conn:null,promise:null};g.mongooseCache=cache;
export async function connectDB(){const uri=process.env.MONGODB_URI;if(!uri)throw new Error('MONGODB_URI is missing');if(cache.conn)return cache.conn;if(!cache.promise)cache.promise=mongoose.connect(uri,{bufferCommands:false});cache.conn=await cache.promise;return cache.conn;}
