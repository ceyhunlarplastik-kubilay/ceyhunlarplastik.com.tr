import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function requireRole(allowedRoles: string[]) {
    const session = await getServerSession(authOptions)

    if (!session) {
        throw new Error("UNAUTHORIZED")
    }

    const groups = (session.user as any).groups || []

    const allowed = allowedRoles.some(role => groups.includes(role))

    if (!allowed) {
        throw new Error("FORBIDDEN")
    }

    return session
}