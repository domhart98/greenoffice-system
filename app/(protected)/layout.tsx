import { requireAuth } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import { Toaster } from "react-hot-toast";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const user = await requireAuth();

  return (
    <html lang="en" className={`h-full antialiased`}>
      <body className="flex p-8 bg-gray-50"> 
        <Sidebar role={user.role} />
        {children}
      </body>
    </html>
  );
}