import { Input } from "@/components/ui/input"
import type { BusinessRequest } from "@/features/businessRequests/api/types"
import { getCounterOfferInputPlaceholder } from "@/features/businessRequests/lib/businessRequestCounterOffer"
import {
    getBusinessRequestItemReference,
    getBusinessRequestItemTitle,
} from "@/features/businessRequests/lib/businessRequestDisplay"

type Props = {
    request: BusinessRequest
    counterValues: Record<string, string>
    onCounterValueChange: (itemId: string, value: string) => void
}

export function BusinessRequestCounterOfferFields({
    request,
    counterValues,
    onCounterValueChange,
}: Props) {
    return (
        <div className="mt-3 space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
                Karşı Teklif Fiyatları
            </div>
            {request.items?.map((item) => (
                <div key={`${request.id}-${item.id}`} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_140px] md:items-center">
                    <div>
                        <div className="text-sm font-medium text-neutral-900">
                            {getBusinessRequestItemTitle(item)}
                        </div>
                        <div className="text-xs text-neutral-500">
                            {getBusinessRequestItemReference(item)}
                        </div>
                    </div>
                    <Input
                        inputMode="decimal"
                        placeholder={getCounterOfferInputPlaceholder(item)}
                        value={counterValues[item.id] ?? ""}
                        onChange={(event) => onCounterValueChange(item.id, event.target.value)}
                    />
                </div>
            ))}
        </div>
    )
}
