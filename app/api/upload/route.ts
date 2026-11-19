import { v2 as cloudinary } from 'cloudinary';
import { identity } from '@/lib/auth';
import { fail, ok } from '@/lib/http';

export async function POST(req: Request) {
  const me = await identity();
  if (!me) return fail('Sign in required', 401);
  const { name } = await req.json();
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) return fail('Image hosting is not configured', 503);

  cloudinary.config({ cloud_name: cloud, api_key: key, api_secret: secret });
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `ashik-electric/${me.shopId}/products`;
  const cleanBase = (name || 'product')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9_-]/gi, '-')
    .toLowerCase()
    .slice(0, 48);
  const publicId = `${cleanBase}-${timestamp}-${Math.random().toString(36).slice(2, 6)}`;
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, public_id: publicId },
    secret
  );

  return ok({ cloudName: cloud, apiKey: key, timestamp, folder, signature, publicId });
}
