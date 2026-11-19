# Ashik Electric — Store Manager

Next.js 14 App Router, TypeScript, MongoDB/Mongoose, NextAuth JWT sessions, Tailwind, React Hook Form + Zod, Zustand, Recharts, Sonner and Capacitor-ready mobile API.

## Local setup
1. Install Node.js 20+ and MongoDB Atlas (use a replica-set cluster for sale transactions).
2. Copy `.env.example` to `.env.local`; set `MONGODB_URI`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and a separate `MOBILE_JWT_SECRET`. Set Cloudinary credentials to enable the signed upload endpoint.
3. Run `npm install`, then `npm run dev`; open `http://localhost:3000/signup` and create the owner account.
4. For production, set the server variables in Vercel. Add the Vercel domain to MongoDB Atlas Network Access. Set `CAPACITOR_SERVER_URL` to the deployed HTTPS URL before `npx cap sync android`.

## Android / Capacitor
The web app uses NextAuth's JWT cookie session. Native clients authenticate through `POST /api/auth/mobile/login`, receive a short-lived bearer JWT, and send it as `Authorization: Bearer <token>` on API requests. Store tokens with a native secure-storage plugin before shipping. Set `CAPACITOR_SERVER_URL` to your deployed HTTPS origin; do not package production secrets into the mobile binary. The Android WebView loads the deployed app URL.

## Implemented
- Private owner account, password hashing, NextAuth credentials, mobile bearer login and role checks.
- Shop-scoped products, server search/pagination, stock alerts, sales/invoices, customer upsert, MongoDB transaction stock decrement.
- Dashboard aggregation, date-range reports, sales chart, CSV export, PDF invoice route, BDT/USD setting and English/Bangla language preference.
- Cloudinary signed upload parameter endpoint, responsive routes, loading/empty/error feedback.

## Operational notes
- MongoDB transactions require Atlas or another replica-set deployment.
- Configure Cloudinary secrets before enabling product image uploads. The API returns signed upload parameters; clients upload directly to Cloudinary so image bytes do not pass through Vercel.
- Use an Android secure-storage plugin for refresh/session persistence. Current mobile access tokens expire after 30 minutes; call the login endpoint again when expired.
- `Due / Credit` is tracked as a payment method and included in period reports; this starter does not model partial payments or expenses.
- Set a strong unique secret for each environment. Back up Atlas and restrict database network access.
# Hisab
