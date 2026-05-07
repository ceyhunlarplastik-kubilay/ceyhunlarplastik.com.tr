"use client"

import { Loader2, LogOut } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { performClientSignOut } from "@/features/auth/lib/client-signout"

export function SignOutPageClient() {
    const [isPending, setIsPending] = useState(false)

    async function handleSignOut() {
        try {
            setIsPending(true)
            await performClientSignOut()
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                Çıkış yaptığınızda hem uygulama oturumunuz temizlenir hem de varsa Cognito refresh tokenınız iptal edilir. Ardından güvenli giriş ekranına dönersiniz.
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
