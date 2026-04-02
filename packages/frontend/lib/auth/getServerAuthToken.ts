import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"

export async function getServerAuthToken(): Promise<string | null> {
    const session = await getServerSession(authOptions)
    return (session as any)?.idToken ?? null
}
