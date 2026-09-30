import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/lib/adminAuth";
import { AdminDashboard } from "./AdminDashboard";

// Defence in depth: `src/middleware.ts` already guards `/admin/:path*`; this
// repeats the same cookie check server-side in case the matcher ever changes.
export default async function AdminPage() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const authed = await isValidAdminSessionToken(token);

  if (!authed) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}
