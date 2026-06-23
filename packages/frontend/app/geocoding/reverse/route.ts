import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { reverseGeocoding } from "@/features/customerLocations/server/geocodingService"

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
        const lat = Number(request.nextUrl.searchParams.get("lat"))
        const lng = Number(request.nextUrl.searchParams.get("lng"))
        const data = await reverseGeocoding(lat, lng)
        return NextResponse.json({ data })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Reverse geocoding failed"
        const status = message.includes("koordinat") ? 400 : 502
        return NextResponse.json({ error: message }, { status })
    }
}
