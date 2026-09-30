"use client"

import { Play } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { LotListItem } from "@/features/production/lots/api/types"
import { useStartLot } from "@/features/production/lots/hooks/useProductionLots"

/** Lotu şimdi başlatır (anlık izleme). İş sahaya verilmemişse ya da işte başka lot üretimdeyse sunucu 409 döner. */
export function StartLotButton({ lot, size = "sm" }: { lot: Pick<LotListItem, "lotNumber" | "job">; size?: "sm" | "default" }) {
    const mutation = useStartLot()

    async function start() {
        try {
            await mutation.mutateAsync({ lotNumber: lot.lotNumber, input: { expectedVersion: lot.job.version } })
            toast.success(`${lot.lotNumber} üretimde`)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    return (
        <Button type="button" variant="outline" size={size} disabled={mutation.isPending} onClick={() => void start()}>
            <Play className="h-4 w-4" />
            Başlat
        </Button>
    )
}
