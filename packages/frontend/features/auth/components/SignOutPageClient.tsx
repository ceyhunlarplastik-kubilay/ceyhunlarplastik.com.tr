"use client"

import { Loader2, LogOut } from "lucide-react"
import { useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function SignOutPageClient() {
    const [isPending, setIsPending] = useState(false)

    async function handleSignOut() {
        try {
            setIsPending(true)
            await signOut({ redirect: false })
            window.location.href = "/api/auth/signout-cognito"
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                Cikis yaptiginizda hem uygulama oturumunuz hem de Cognito oturumunuz temizlenir. Bu islem sizi guvenli sekilde giris ekranina geri dondurur.
            </div>

            <div className="flex flex-wrap gap-3">
                <Button
                    variant="destructive"
                    size="lg"
                    className="h-11 rounded-xl px-5"
                    disabled={isPending}
                    onClick={() => void handleSignOut()}
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    Oturumu Kapat
                </Button>

                <Button
                    variant="outline"
                    size="lg"
                    className="h-11 rounded-xl px-5"
                    onClick={() => window.history.back()}
                    disabled={isPending}
                >
                    Vazgec
                </Button>
            </div>
        </div>
    )
}
