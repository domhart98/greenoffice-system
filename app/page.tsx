import { getUserFromRequest } from "@/lib/auth";
import pool from "@/lib/db";
import Dashboard from "@/components/dashboard";


export default async function DashboardPage() {
  const user = getUserFromRequest();
  
  return (
    <div className="p-8">
      <Dashboard/>
    </div>
  );
}
