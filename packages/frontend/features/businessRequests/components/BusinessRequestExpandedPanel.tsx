import type {
    BusinessRequest,
    BusinessRequestDecisionInput,
    BusinessRequestDecisionScope,
} from "@/features/businessRequests/api/types"
import { BusinessRequestActivityPanel } from "@/features/businessRequests/components/BusinessRequestActivityPanel"
import { BusinessRequestApprovalFlowPanel } from "@/features/businessRequests/components/BusinessRequestApprovalFlowPanel"
import { BusinessRequestDataSummary } from "@/features/businessRequests/components/BusinessRequestDataSummary"
import { BusinessRequestDecisionPanel } from "@/features/businessRequests/components/BusinessRequestDecisionPanel"
import { BusinessRequestItemsPanel } from "@/features/businessRequests/components/BusinessRequestItemsPanel"

type Props = {
    request: BusinessRequest
    showAllFields: boolean
    onToggleShowAll: () => void
    decisionScope?: BusinessRequestDecisionScope
    onDecision?: (input: BusinessRequestDecisionInput) => void
    isDecisionPending: boolean
    canDecide: boolean
    canCounter: boolean
    note: string
    onNoteChange: (value: string) => void
    counterValues: Record<string, string>
    onCounterValueChange: (itemId: string, value: string) => void
}

export function BusinessRequestExpandedPanel({
    request,
    showAllFields,
    onToggleShowAll,
    decisionScope,
    onDecision,
    isDecisionPending,
    canDecide,
    canCounter,
    note,
    onNoteChange,
    counterValues,
    onCounterValueChange,
}: Props) {
    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
            <div className="space-y-4">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="text-sm font-medium text-neutral-900">Talep Detayı</div>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                        {request.description?.trim() || "Açıklama girilmedi."}
                    </p>
                </div>

                <BusinessRequestDataSummary
                    request={request}
                    showAllFields={showAllFields}
                    onToggleShowAll={onToggleShowAll}
                />

                <BusinessRequestItemsPanel request={request} />
            </div>

            <div className="space-y-4">
                <BusinessRequestApprovalFlowPanel request={request} />
                <BusinessRequestActivityPanel request={request} />

                {decisionScope && onDecision && canDecide ? (
                    <BusinessRequestDecisionPanel
                        request={request}
                        decisionScope={decisionScope}
                        onDecision={onDecision}
                        isDecisionPending={isDecisionPending}
                        canCounter={canCounter}
                        note={note}
                        onNoteChange={onNoteChange}
                        counterValues={counterValues}
                        onCounterValueChange={onCounterValueChange}
                    />
                ) : null}
            </div>
        </div>
    )
}
