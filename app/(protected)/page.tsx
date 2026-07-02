import { getCurrentUser, requireAuth } from "@/lib/auth";
import pool from "@/lib/db";
import Dashboard from "@/components/dashboard";


export default async function DashboardPage() {
  const user = getCurrentUser();

  console.log(user);
  
  return (
    <div className="w-full p-8">
      <Dashboard/>
    </div>
  );
}
