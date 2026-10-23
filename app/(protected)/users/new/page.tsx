import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserForm from "@/components/forms/user_form";

export default async function NewUserPage() {
    const currentUser = await requireAuth();

    if (currentUser.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">
                    Create User
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Create a Green Office account and configure its access permissions.
                </p>
            </div>

            <UserForm mode="create" />
        </div>
    );
}