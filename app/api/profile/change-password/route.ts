import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { identity } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import User from '@/models/User';

const schema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
  securityPin: z.string().min(4).max(8).optional(),
});

export async function POST(req: Request) {
  const me = await identity();
  if (!me) return fail('Sign in required', 401);

  try {
    const { currentPassword, newPassword, securityPin } = schema.parse(await req.json());
    await connectDB();

    const user = await User.findById(me.userId).select('+passwordHash');
    if (!user) return fail('User not found', 404);

    // If updating password
    if (newPassword) {
      if (!currentPassword) {
        return fail('বর্তমান পাসওয়ার্ড দিন', 400);
      }
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        return fail('বর্তমান পাসওয়ার্ড সঠিক নয়!', 400);
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    // If updating security pin
    if (securityPin) {
      user.securityPin = securityPin;
    }

    await user.save();
    return ok({ message: 'Security credentials updated' });
  } catch (err: any) {
    return fail('পরিবর্তন সম্পন্ন করা সম্ভব হয়নি', 400);
  }
}

