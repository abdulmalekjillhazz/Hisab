import 'next-auth';
declare module 'next-auth' { interface Session { user: { id:string; shopId:string; role:'owner'|'staff'; isSuperAdmin:boolean; name?:string|null; email?:string|null } } }
declare module 'next-auth/jwt' { interface JWT { id?:string;shopId?:string;role?:'owner'|'staff' } }
