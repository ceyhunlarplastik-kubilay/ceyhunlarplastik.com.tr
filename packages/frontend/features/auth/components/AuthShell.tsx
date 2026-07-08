import Image from "next/image"
import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

type Props = {
    eyebrow: string
    title: string
    description: string
    sideTitle: string
    sideDescription: string
    children: ReactNode
}

export function AuthShell({
    eyebrow,
    title,
    sideTitle,
    children,
}: Props) {
    const t = useTranslations("auth.shell")
    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#f6f0e8,transparent_38%),linear-gradient(180deg,#fcfaf7_0%,#f6f4ef_100%)]">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(15,23,42,0.025)_45%,transparent_100%)]" />

            <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-5 sm:px-6 lg:px-8">
                <div className="grid auto-rows-fr gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] md:items-stretch lg:gap-5">
                    <section className="min-w-0 overflow-hidden rounded-[30px] border border-slate-200/70 bg-slate-950 px-6 py-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:px-7 sm:py-7 md:flex md:min-h-[560px] md:flex-col md:justify-between lg:px-8 lg:py-8">
                        <div className="flex h-full flex-col justify-between">
                            <div className="space-y-8">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-[0_12px_30px_rgba(255,255,255,0.08)]">
                                    <Image
                                        src="/favicon-5312.png"
                                        alt="Ceyhunlar Plastik"
                                        width={44}
                                        height={44}
                                        className="h-11 w-11 object-contain"
                                        priority
                                    />
                                </div>

                                <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-white/70">
                                    {eyebrow}
                                </span>

                                <div className="max-w-sm space-y-3">
                                    <h1 className="text-3xl font-semibold tracking-tight">
                                        {sideTitle}
                                    </h1>
                                    {/* sideDescription intentionally kept in props for future variants but hidden for a cleaner auth shell */}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-white/68">
                                {t("secureAccess")}
                            </div>
                        </div>
                        {/* Supporting auth context intentionally removed from the visible UI for simplicity:
                            - Kimlik arayüzü uygulama içinde, güvenlik omurgası Cognito tarafında yönetilir.
                            - Admin, operasyon ve tedarikçi panelleri aynı rol tabanlı yapı üzerinde çalışır.
                        */}
                    </section>

                    <section className="flex min-w-0">
                        <div className="flex h-full w-full min-w-0 flex-col rounded-[30px] border border-slate-200/70 bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 xl:p-7 md:min-h-[560px]">
                            <div className="mb-5 flex items-center gap-3 md:hidden">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                                    <Image
                                        src="/favicon-5312.png"
                                        alt="Ceyhunlar Plastik"
                                        width={32}
                                        height={32}
                                        className="h-8 w-8 object-contain"
                                        priority
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                                    {eyebrow}
                                </p>
                                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
                                    {title}
                                </h2>
                                {/* description intentionally hidden to keep the auth view compact */}
                            </div>

                            <div className="mt-6 flex-1 min-w-0">{children}</div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
