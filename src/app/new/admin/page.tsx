import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/lib/adminAuth";
import { AdminDashboard } from "./AdminDashboard";

// Server-rendered guard: `src/middleware.ts` only matches `/admin/:path*`, so it
// never sees `/new/admin`. This performs the identical check — same cookie,
// same verification function — directly in the page instead, since the
// middleware config is off-limits to edit for this skin.
export default async function NewAdminPage() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const authed = await isValidAdminSessionToken(token);

  if (!authed) {
    redirect("/new/admin/login");
  }

  return <AdminDashboard />;
}
