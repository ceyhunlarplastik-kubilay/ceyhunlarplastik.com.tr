import { NextResponse } from "next/server"

export async function GET() {
    const domain = process.env.COGNITO_DOMAIN!
    const clientId = process.env.COGNITO_CLIENT_ID!
    const logoutUrl = process.env.NEXTAUTH_URL!

    const url = `https://${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUrl)}`

    return NextResponse.redirect(url)
}