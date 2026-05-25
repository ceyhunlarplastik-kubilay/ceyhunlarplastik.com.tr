"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type MetaItem = {
    label: string
    value: string
}

type Props = {
    eyebrow: string
    title: ReactNode
    description?: ReactNode
    icon?: LucideIcon
    badge?: ReactNode
    meta?: MetaItem[]
    aside?: ReactNode
    className?: string
}

export function CustomerPortalPageHeader({
    eyebrow,
    title,
    description,
    icon: Icon,
    badge,
    meta = [],
    aside,
    className,
}: Props) {
    return (
        <section
            className={cn(
                "relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_52%,#edf6f3_100%)] px-4 py-4 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)] sm:px-5 sm:py-[1.125rem]",
                className,
            )}
        >
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[36%] bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.13),transparent_62%)] lg:block" />
            <div className="pointer-events-none absolute -right-12 top-0 h-24 w-24 rounded-full bg-[var(--color-brand)]/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-10 h-14 w-14 rounded-full bg-white/70 blur-2xl" />

            <div className="relative flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0 max-w-4xl space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 shadow-sm backdrop-blur">
                        {Icon ? <Icon className="h-3 w-3 text-[var(--color-brand)]" /> : null}
                        {eyebrow}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-[1.7rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[1.9rem]">
                            {title}
                        </h1>
                        {badge}
                    </div>

                    {description ? (
                        <p className="max-w-3xl text-sm leading-5 text-slate-600 sm:text-[14px]">
                            {description}
                        </p>
                    ) : null}

                    {meta.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {meta.map((item) => (
                                <div
                                    key={`${item.label}-${item.value}`}
                                    className="rounded-full border border-slate-200/80 bg-white/85 px-2.5 py-1 text-[11px] text-slate-600 shadow-sm"
                                >
                                    <span className="font-medium text-slate-900">{item.value}</span>
                                    <span className="ml-1.5 text-slate-500">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>

                {aside ? (
                    <div className="relative min-w-0 xl:min-w-[220px] xl:max-w-[560px]">
                        {aside}
                    </div>
                ) : null}
            </div>
        </section>
    )
}

type StatProps = {
    label: string
    value: ReactNode
    className?: string
}

export function CustomerPortalPageHeaderStat({
    label,
    value,
    className,
}: StatProps) {
    return (
        <div
            className={cn(
                "rounded-xl border border-white/80 bg-white/82 px-3 py-2.5 shadow-sm backdrop-blur",
                className,
            )}
        >
            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                {label}
            </div>
            <div className="mt-1.5 text-base font-semibold text-slate-950">
                {value}
            </div>
        </div>
    )
}
