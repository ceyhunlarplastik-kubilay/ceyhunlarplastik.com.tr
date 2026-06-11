import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type {
    BusinessRequest,
    BusinessRequestDecisionInput,
    BusinessRequestDecisionScope,
} from "@/features/businessRequests/api/types"
import { buildCounterOfferItems } from "@/features/businessRequests/lib/businessRequestCounterOffer"
import { BusinessRequestCounterOfferFields } from "@/features/businessRequests/components/BusinessRequestCounterOfferFields"

type Props = {
    request: BusinessRequest
    decisionScope: BusinessRequestDecisionScope
    onDecision: (input: BusinessRequestDecisionInput) => void
    isDecisionPending: boolean
    canCounter: boolean
    note: string
    onNoteChange: (value: string) => void
    counterValues: Record<string, string>
    onCounterValueChange: (itemId: string, value: string) => void
}

export function BusinessRequestDecisionPanel({
    request,
    decisionScope,
    onDecision,
    isDecisionPending,
    canCounter,
    note,
    onNoteChange,
    counterValues,
    onCounterValueChange,
}: Props) {
    const normalizedNote = note.trim() || undefined

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="text-sm font-medium text-neutral-900">Karar Ver</div>
            {canCounter ? (
                <BusinessRequestCounterOfferFields
                    request={request}
                    counterValues={counterValues}
                    onCounterValueChange={onCounterValueChange}
                />
            ) : null}
            <Textarea
                value={note}
                onChange={(event) => onNoteChange(event.target.value)}
                rows={4}
                className="mt-3"
                placeholder="Karar notu"
            />
            <div className="mt-3 flex flex-wrap gap-2">
                <Button
                    type="button"
                    disabled={isDecisionPending}
                    onClick={() =>
                        onDecision({
                            scope: decisionScope,
                            id: request.id,
                            approved: true,
                            note: normalizedNote,
                        })
                    }
                >
                    <Check className="mr-2 h-4 w-4" />
                    Onayla
                </Button>
                {canCounter ? (
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isDecisionPending}
                        onClick={() => {
                            const counterOfferItems = buildCounterOfferItems(request, counterValues)
                            if (counterOfferItems.length === 0) return

                            onDecision({
                                scope: decisionScope,
                                id: request.id,
                                action: "COUNTER",
                                note: normalizedNote,
                                counterOfferItems,
                            })
                        }}
                    >
                        Karşı Teklif Gönder
                    </Button>
                ) : null}
                <Button
                    type="button"
                    variant="destructive"
                    disabled={isDecisionPending}
                    onClick={() =>
                        onDecision({
                            scope: decisionScope,
                            id: request.id,
                            action: "REJECT",
                            approved: false,
                            note: normalizedNote,
                        })
                    }
                >
                    <X className="mr-2 h-4 w-4" />
                    Reddet
                </Button>
            </div>
        </div>
    )
}
