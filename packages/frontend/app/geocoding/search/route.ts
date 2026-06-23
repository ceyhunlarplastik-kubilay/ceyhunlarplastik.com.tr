import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { searchGeocoding } from "@/features/customerLocations/server/geocodingService"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const allowedGroups = ["customer", "sales", "sales_director", "admin", "owner"]

function canAccess(groups: string[]) {
    return groups.some((group) => allowedGroups.includes(group))
}

export async function GET(request: NextRequest) {
    const session = await auth()
    const groups = session?.user?.groups ?? []

    if (!session?.user || session.user.accessStatus !== "ACTIVE" || !canAccess(groups)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
        const query = request.nextUrl.searchParams.get("q") ?? ""
        const data = await searchGeocoding(query)
        return NextResponse.json({ data })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Geocoding search failed"
        const status = message.includes("3 karakter") ? 400 : 502
        return NextResponse.json({ error: message }, { status })
    }
}

