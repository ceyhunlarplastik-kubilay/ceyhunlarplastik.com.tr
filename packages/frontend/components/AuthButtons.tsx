"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import Link from "next/link"

export function AuthButtons() {
    const { data: session, status } = useSession()

    if (status === "loading") {
        return <p className="text-sm">Yükleniyor...</p>
    }

    if (session) {
        return (
            <div className="flex flex-col gap-4 items-start">
                <p>Hoş geldin, <span className="font-semibold">{session.user?.email}</span></p>
                <div className="flex gap-2">
                    <Link
                        href="/protected"
                        className="rounded bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 dark:hover:bg-zinc-300 transition"
                    >
                        Korumalı Sayfaya Git
                    </Link>
                    <button
                        onClick={() => {
                            signOut({
                                callbackUrl: "/api/auth/signout-cognito"
                            })
                        }}
                        className="rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 transition"
                    >
                        Çıkış Yap
                    </button>
                </div>
            </div>
        )
    }

    // `cognito` tells next-auth to specifically use the CognitoProvider
    return (
        <button
            onClick={() => signIn("cognito")}
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition"
        >
            Giriş Yap / Kayıt Ol
        </button>
    )
}
