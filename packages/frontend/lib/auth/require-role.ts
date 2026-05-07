import { auth } from "@/lib/auth/auth";

export async function requireRole(allowedRoles: string[]) {
    const session = await auth();

    if (!session) {
        throw new Error("UNAUTHORIZED");
    }

    const groups = session.user?.groups || [];

    const allowed = allowedRoles.some(role => groups.includes(role));

    if (!allowed) {
        throw new Error("FORBIDDEN");
    }

    return session;
}
