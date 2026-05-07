"use client"

import { signOut } from "next-auth/react"

export async function performClientSignOut() {
    try {
        await fetch("/api/auth/cognito/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: "{}",
        })
    } catch (error) {
        console.error("Logout request failed", error)
    } finally {
        await signOut({ callbackUrl: "/auth/signin" })
    }
}
