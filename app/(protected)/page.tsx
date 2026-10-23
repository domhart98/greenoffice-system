import { getCurrentUser, requireAuth } from "@/lib/auth";
import pool from "@/lib/db";
import Dashboard from "@/components/dashboard";
import { User } from "@/types/user";


export default async function DashboardPage() {
  const user = await requireAuth();
  
  return (
    <div className="w-full p-12">
      <Dashboard user={user}/>
    </div>
  );
}
