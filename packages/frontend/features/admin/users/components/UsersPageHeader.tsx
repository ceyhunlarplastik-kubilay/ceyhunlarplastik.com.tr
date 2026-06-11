"use client"

import { Users } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
    totalCount: number
    visibleCount: number
    dirtyCount: number
    selectedCount: number
}

function HeaderMetric({
    label,
    value,
    tone = "neutral",
}: {
    label: string
    value: number
    tone?: "neutral" | "warning" | "accent"
}) {
    return (
        <div
            className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
                tone === "accent" && "border-sky-200 bg-sky-50 text-sky-700",
                tone === "neutral" && "border-neutral-200 bg-white text-neutral-600",
            )}
        >
            <span className="font-semibold text-neutral-950">{value}</span> {label}
        </div>
    )
}

export function UsersPageHeader({
    totalCount,
    visibleCount,
    dirtyCount,
    selectedCount,
}: Props) {
    return (
        <div className="rounded-[28px] border border-neutral-200 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,0.94))] p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                        <Users className="h-3.5 w-3.5" />
                        Kullanıcı Yönetimi
                    </div>

                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">Kullanıcılar</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                            Ana listede yalnızca kritik özetleri gösterin, rol ve erişim düzenlemelerini detay yüzeylerinden yönetin.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <HeaderMetric label="toplam kayıt" value={totalCount} />
                    <HeaderMetric label="görünen kayıt" value={visibleCount} tone="accent" />
                    <HeaderMetric label="taslak değişiklik" value={dirtyCount} tone={dirtyCount > 0 ? "warning" : "neutral"} />
                    {selectedCount > 0 ? <HeaderMetric label="seçili" value={selectedCount} /> : null}
                </div>
            </div>
        </div>
    )
}
