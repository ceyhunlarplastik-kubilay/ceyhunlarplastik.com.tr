import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    console.log(session);

    // login değilse
    if (!session) redirect("/api/auth/signin");

    const groups = session.user?.groups ?? [];
    const allowed = groups.includes("admin") || groups.includes("owner");

    if (!allowed) redirect("/?unauthorized=1");

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* burada sonra sidebar/header koyarsın */}
            {children}
        </div>
    );
}
