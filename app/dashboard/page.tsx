import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/logout_button";

export default async function Dashboard() {
  const user =
    await getCurrentUser();

  return (
    <div>
      Welcome {user?.username}
      <LogoutButton/>
    </div>
  );
}