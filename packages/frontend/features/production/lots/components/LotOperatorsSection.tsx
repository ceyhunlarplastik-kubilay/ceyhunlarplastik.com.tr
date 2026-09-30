"use client"

import { UserRoundPen } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MAX_OPERATORS_PER_LOT } from "@core/helpers/production/productionLots"
import type { LotDetail } from "@/features/production/lots/api/types"
import { useReplaceLotOperators } from "@/features/production/lots/hooks/useProductionLots"
import { useProductionOperators } from "@/features/production/operators/hooks/useProductionOperators"
import { OperatorMultiPicker } from "@/features/production/shared/components/OperatorMultiPicker"
import { formatOperatorName } from "@/features/production/shared/operators"

const SOURCE_LABELS = {
    lot: "Lota özel",
    roster: "Vardiya ekibinden",
    none: "Atanmamış",
} as const

/**
 * Lotun ekibi: lota özel (ya da tamamlanınca dondurulmuş) ekip varsa o, yoksa vardiya ekibinden.
 * Düzenleme lota özel ekibi yazar; "Vardiya ekibine dön" onu siler.
 */
export function LotOperatorsSection({ lot }: { lot: LotDetail }) {
    const operatorsQuery = useProductionOperators()
    const mutation = useReplaceLotOperators(lot.lotNumber)

    async function apply(operatorIds: string[]) {
        try {
            const result = await mutation.mutateAsync(operatorIds)
            toast.success(result.source === "lot" ? `${lot.lotNumber} ekibi güncellendi` : `${lot.lotNumber} vardiya ekibine döndü`)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    const rosterDiffers = lot.operators.source === "lot"
        && lot.rosterOperators.map((operator) => operator.id).sort().join() !== lot.operators.list.map((operator) => operator.id).sort().join()

    return (
        <section className="space-y-3 rounded-2xl border p-4">
            <header className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">Ekip</h2>
                <Badge variant="outline" className="rounded-full">{SOURCE_LABELS[lot.operators.source]}</Badge>
                <div className="ms-auto flex gap-2">
                    {lot.operators.source === "lot" ? (
                        <Button type="button" variant="ghost" size="sm" disabled={mutation.isPending} onClick={() => void apply([])}>
                            Vardiya ekibine dön
                        </Button>
                    ) : null}
                    <OperatorMultiPicker
                        operators={operatorsQuery.data ?? []}
                        selectedIds={lot.operators.list.map((operator) => operator.id)}
                        max={MAX_OPERATORS_PER_LOT}
                        onApply={(ids) => void apply(ids)}
                        disabled={mutation.isPending || operatorsQuery.isLoading}
                        title="Lotun ekibi"
                        trigger={(
                            <Button type="button" variant="outline" size="sm" disabled={mutation.isPending}>
                                <UserRoundPen className="h-4 w-4" />
                                Düzenle
                            </Button>
                        )}
                    />
                </div>
            </header>
            {lot.operators.list.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Bu vardiyada makineye operatör atanmamış. Vardiya Ekibi sayfasından atayın ya da yalnız bu lot için ekip girin.
                </p>
            ) : (
                <ul className="flex flex-wrap gap-2">
                    {lot.operators.list.map((operator) => (
                        <li key={operator.id} className="rounded-full border bg-muted/40 px-3 py-1 text-sm">
                            {formatOperatorName(operator)}
                            {operator.employeeNo ? <span className="ms-1 text-xs text-muted-foreground">{operator.employeeNo}</span> : null}
                            {!operator.isActive ? <span className="ms-1 text-xs text-muted-foreground">(pasif)</span> : null}
                        </li>
                    ))}
                </ul>
            )}
            {rosterDiffers ? (
                <p className="text-xs text-muted-foreground">
                    Vardiya ekibi: {lot.rosterOperators.length > 0 ? lot.rosterOperators.map(formatOperatorName).join(", ") : "atanmamış"}.
                    {lot.status === "COMPLETED" ? " İş tamamlanırken ekip lota donduruldu." : ""}
                </p>
            ) : null}
        </section>
    )
}
