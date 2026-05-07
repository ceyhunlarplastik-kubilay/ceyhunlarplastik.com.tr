"use client"

import { ArrowRight, ShieldCheck } from "lucide-react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAuthErrorMessage } from "@/features/auth/lib/errors"

type Props = {
    callbackUrl: string
    error?: string
}

export function SignInPageClient({ callbackUrl, error }: Props) {
    const errorMessage = getAuthErrorMessage(error)

    return (
        <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Admin</div>
                    <div className="mt-2 text-sm text-slate-600">Katalog, kullanici, tedarikci ve onay surecleri</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Operasyon</div>
                    <div className="mt-2 text-sm text-slate-600">Satin alma ve satis ekipleri icin kontrollu erisim</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Supplier</div>
                    <div className="mt-2 text-sm text-slate-600">Teklif, vade ve fiyat degisiklikleri icin ayri alan</div>
                </div>
            </div>

            {errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <div className="text-sm font-semibold text-rose-700">{errorMessage.title}</div>
                    <p className="mt-1 text-sm leading-6 text-rose-600">{errorMessage.description}</p>
                </div>
            ) : null}

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-2">
                        <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                            Merkezi Kimlik Dogrulama
                        </Badge>
                        <div className="text-sm leading-6 text-slate-500">
                            Giris, kayit, sifre sifirlama ve dogrulama akislari Cognito tarafinda guvenli sekilde yonetilir.
                        </div>
                    </div>

                    <Button
                        variant="brand"
                        size="lg"
                        className="h-11 rounded-xl px-5"
                        onClick={() => signIn("cognito", { callbackUrl })}
                    >
                        <ShieldCheck className="h-4 w-4" />
                        Cognito ile Giris Yap
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="text-xs leading-6 text-slate-500">
                Oturum actiktan sonra sistem sizi hedef sayfaya geri yonlendirir.
                Mevcut hedef: <span className="font-medium text-slate-700">{callbackUrl}</span>
            </div>
        </div>
    )
}
