import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { fail, ok } from '@/lib/http';
import User from '@/models/User';

const schema = z.object({
  email: z.string().email(),
  securityPin: z.string().min(4).max(8),
  newPassword: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const { email, securityPin, newPassword } = schema.parse(await req.json());
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return fail('এই ইমেইলের কোনো অ্যাকাউন্ট পাওয়া যায়নি', 404);
    }

    // Default pin is 1234 if not explicitly set
    const userPin = user.securityPin || '1234';
    if (userPin !== securityPin) {
      return fail('সিকিউরিটি পিন (Security PIN) সঠিক নয়!', 400);
    }

    // Hash and update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();

    return ok({ message: 'Password reset successfully' });
  } catch (err: any) {
    return fail(err.errors?.[0]?.message || 'পাসওয়ার্ড রিসেট সম্পন্ন করা সম্ভব হয়নি', 400);
  }
}

