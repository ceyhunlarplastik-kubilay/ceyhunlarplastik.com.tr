"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import { motion } from "motion/react"
import { Mail, Phone, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type UserContactCardProps = {
    eyebrow: string
    icon: LucideIcon
    name?: string | null
    roleLabel?: string | null
    subtitle?: string | null
    description?: string | null
    email?: string | null
    phone?: string | null
    imageUrl?: string | null
    emptyMessage?: string
    badge?: ReactNode
    size?: "default" | "compact"
    className?: string
}

function getInitials(value?: string | null) {
    if (!value) return "??"

    const parts = value
        .split(" ")
        .map((part) => part.trim())
        .filter(Boolean)

    if (parts.length === 0) return "??"

    return parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("")
}

function ContactRow({
    icon: Icon,
    label,
    value,
    href,
}: {
    icon: LucideIcon
    label: string
    value?: string | null
    href?: string
}) {
    return (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="mt-0.5 rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500">
                <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    {label}
                </div>
                {value ? (
                    href ? (
                        <a
                            href={href}
                            className="mt-1 block max-w-full break-all text-[13px] font-medium leading-5 text-slate-900 transition hover:text-brand"
                            title={value}
                        >
                            {value}
                        </a>
                    ) : (
                        <div className="mt-1 max-w-full break-words text-[13px] font-medium leading-5 text-slate-900" title={value}>
                            {value}
                        </div>
                    )
                ) : (
                    <div className="mt-1 text-sm text-slate-400">Bilgi eklenmedi</div>
                )}
            </div>
        </div>
    )
}

export function UserContactCard({
    eyebrow,
    icon: Icon,
    name,
    roleLabel,
    subtitle,
    description,
    email,
    phone,
    imageUrl,
    emptyMessage = "İlgili kullanıcı bilgisi henüz tanımlanmadı.",
    badge,
    size = "default",
    className,
}: UserContactCardProps) {
    const compact = size === "compact"
    const initials = getInitials(name || subtitle)
    const hasIdentity = Boolean(name || email || phone)

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            whileHover={{ y: -2 }}
            className={cn(
                "group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,250,252,0.94))] shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)]",
                compact ? "p-4" : "p-5 sm:p-6",
                className,
            )}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,185,102,0.14),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.06),transparent_38%)] opacity-90" />
            <div className="relative flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex min-w-0 items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
                        <span className="inline-flex rounded-full border border-slate-200 bg-white/90 p-2 text-slate-500 shadow-sm">
                            <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate">{eyebrow}</span>
                    </div>
                    {badge ? <div className="shrink-0">{badge}</div> : null}
                </div>

                <div className={cn("flex items-start gap-4", compact && "gap-3")}>
                    <div
                        className={cn(
                            "relative shrink-0 overflow-hidden rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] shadow-inner",
                            compact ? "h-16 w-16" : "h-20 w-20",
                        )}
                    >
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={name || eyebrow}
                                fill
                                className="object-cover"
                                sizes={compact ? "64px" : "80px"}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-semibold tracking-[0.2em] text-slate-500">
                                {initials}
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className={cn("font-semibold tracking-tight text-slate-950", compact ? "text-base" : "text-xl")}>
                            {name || "Bilgi bekleniyor"}
                        </div>
                        {roleLabel ? (
                            <div className="mt-2 inline-flex rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-amber-700">
                                {roleLabel}
                            </div>
                        ) : null}
                        {subtitle ? (
                            <div className="mt-2 text-sm font-medium text-slate-600">
                                {subtitle}
                            </div>
                        ) : null}
                        {hasIdentity ? (
                            description ? (
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    {description}
                                </p>
                            ) : null
                        ) : (
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                {emptyMessage}
                            </p>
                        )}
                    </div>
                </div>

                <div className={cn("grid gap-3", compact ? "md:grid-cols-1" : "sm:grid-cols-2")}>
                    <ContactRow
                        icon={Mail}
                        label="E-posta"
                        value={email}
                        href={email ? `mailto:${email}` : undefined}
                    />
                    <ContactRow
                        icon={Phone}
                        label="Telefon"
                        value={phone}
                        href={phone ? `tel:${phone}` : undefined}
                    />
                </div>
            </div>
        </motion.article>
    )
}
