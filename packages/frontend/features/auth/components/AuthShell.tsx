import type { ReactNode } from "react"

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
    description,
    sideTitle,
    sideDescription,
    children,
}: Props) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#f6f0e8,transparent_38%),linear-gradient(180deg,#fcfaf7_0%,#f6f4ef_100%)]">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(15,23,42,0.025)_45%,transparent_100%)]" />

            <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-10 lg:px-10">
                <div className="grid items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <section className="hidden overflow-hidden rounded-[32px] border border-slate-200/70 bg-slate-950 px-10 py-12 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] lg:flex lg:flex-col lg:justify-between">
                        <div className="space-y-6">
                            <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-white/70">
                                {eyebrow}
                            </span>

                            <div className="max-w-lg space-y-4">
                                <h1 className="text-4xl font-semibold tracking-tight">
                                    {sideTitle}
                                </h1>
                                <p className="text-base leading-7 text-white/70">
                                    {sideDescription}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 text-sm text-white/72">
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                Merkezi oturum akisi Cognito tarafinda, uygulama deneyimi ise Next.js tarafinda ozellestirildi.
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                Rol bazli giris akislari admin, satin alma, satis ve tedarikci panelleri icin ayni temel sistemi kullanir.
                            </div>
                        </div>
                    </section>

                    <section className="flex items-center">
                        <div className="w-full rounded-[32px] border border-slate-200/70 bg-white/92 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur xl:p-8">
                            <div className="space-y-2">
                                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                                    {eyebrow}
                                </p>
                                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                                    {title}
                                </h2>
                                <p className="max-w-xl text-sm leading-6 text-slate-500">
                                    {description}
                                </p>
                            </div>

                            <div className="mt-8">{children}</div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
