import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import type { Session } from "next-auth"

export async function getServerAuthToken(): Promise<string | null> {
    const session = await getServerSession(authOptions)
    return (session as Session | null)?.idToken ?? null
}
