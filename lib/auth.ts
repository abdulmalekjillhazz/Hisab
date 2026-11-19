import {getServerSession} from 'next-auth';import {authOptions} from '@/lib/auth-options';import {jwtVerify} from 'jose';import {headers} from 'next/headers';import {connectDB} from '@/lib/db';import User from '@/models/User';import Shop from '@/models/Shop';
export type Identity={userId:string;shopId:string;role:'owner'|'staff'};
export async function identity():Promise<Identity|null>{let userId:string|undefined;let shopId:string|undefined;try{const s=await getServerSession(authOptions);if(s?.user?.id&&s.user.shopId){userId=s.user.id;shopId=s.user.shopId}else{const reqHeaders=await headers();const token=reqHeaders.get('authorization')?.replace(/^Bearer\s+/i,'');if(!token||!process.env.MOBILE_JWT_SECRET)return null;const {payload}=await jwtVerify(token,new TextEncoder().encode(process.env.MOBILE_JWT_SECRET));if(!payload.sub||!payload.shopId)return null;userId=String(payload.sub);shopId=String(payload.shopId)}}catch{return null}try{await connectDB();const user=await User.findOne({_id:userId,shop:shopId,active:true}).select('_id shop role').lean() as { _id: unknown; shop: unknown; role?: string } | null;if(!user)return null;const shop=await Shop.findOne({_id:shopId,active:{$ne:false}}).select('_id').lean();if(!shop)return null;return{userId:String(user._id),shopId:String(user.shop),role:user.role==='staff'?'staff':'owner'}}catch{return null}}

export async function requireSuperAdmin(){
  const me=await identity();if(!me)return null;
  const user=await User.findById(me.userId).select('email active').lean() as { email: string; active?: boolean } | null;
  if(!user?.active)return null;
  const allowlist=(process.env.SUPER_ADMIN_EMAILS||'').split(',').map((email)=>email.trim().toLowerCase()).filter(Boolean);
  return allowlist.includes(user.email.toLowerCase())?{...me,email:user.email}:null;
}
