"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { PRODUCTION_CHANGE_SCOPE_LABELS } from "@core/helpers/production/productionRealtime"
import { formatProductionShortDateTime } from "@core/helpers/production/productionTime"
import type { RealtimeStatus } from "@/features/realtime/hooks/useRealtimeTopic"
import { useProductionRealtimeState } from "./ProductionRealtimeProvider"

const STATUS_COPY: Record<Exclude<RealtimeStatus, "disabled">, { label: string; dotClassName: string; description: string }> = {
    live: {
        label: "Canlı",
        dotClassName: "bg-emerald-500",
        description: "Diğer planlayıcıların değişiklikleri bu ekrana kendiliğinden yansır.",
    },
    connecting: {
        label: "Bağlanıyor",
        dotClassName: "bg-amber-500 motion-safe:animate-pulse",
        description: "Canlı güncelleme bağlantısı kuruluyor.",
    },
    offline: {
        label: "Canlı değil",
        dotClassName: "bg-muted-foreground/50",
        description: "Canlı bağlantı yok; kendiliğinden yeniden denenir. Bu arada sayfalar yenileme düğmesi ve otomatik yenilemeyle güncellenir.",
    },
}

/** Panel başlığında canlı güncelleme durumu; tıklayınca son gelen değişiklik. Realtime tanımlı değilse görünmez. */
export function ProductionLiveIndicator({ compact = false }: { compact?: boolean }) {
    const { status, lastChange } = useProductionRealtimeState()
    if (status === "disabled") return null
    const copy = STATUS_COPY[status]

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size={compact ? "icon" : "sm"}
                    className="rounded-xl"
                    aria-label={`Canlı güncelleme: ${copy.label}`}
                >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", copy.dotClassName)} aria-hidden />
                    {compact ? null : <span className="text-xs font-medium">{copy.label}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(18rem,calc(100vw-2rem))] space-y-2">
                <PopoverHeader>
                    <PopoverTitle>Canlı güncelleme · {copy.label}</PopoverTitle>
                    <PopoverDescription>{copy.description}</PopoverDescription>
                </PopoverHeader>
                <p className="text-xs text-muted-foreground">
                    {lastChange
                        ? `Son değişiklik ${formatProductionShortDateTime(lastChange.occurredAt)} · ${lastChange.scopes.map((scope) => PRODUCTION_CHANGE_SCOPE_LABELS[scope]).join(", ")} (${lastChange.byMe ? "sizin" : "başka bir kullanıcı"})`
                        : "Bu oturumda henüz değişiklik gelmedi."}
                </p>
            </PopoverContent>
        </Popover>
    )
}
