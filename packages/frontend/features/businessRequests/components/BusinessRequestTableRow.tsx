import { Fragment } from "react"
import { ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import {
    BusinessRequestExpandedPanel,
} from "@/features/businessRequests/components/BusinessRequestExpandedPanel"
import { BusinessRequestApprovalRoleBadge } from "@/features/businessRequests/components/BusinessRequestApprovalFlowPanel"
import { BusinessRequestOrderSummary } from "@/features/businessRequests/components/BusinessRequestOrderSummary"
import { BusinessRequestStatusBadge } from "@/features/businessRequests/components/BusinessRequestStatusBadge"
import {
    BUSINESS_REQUEST_DOMAIN_LABELS,
    BUSINESS_REQUEST_PRIORITY_LABELS,
    BUSINESS_REQUEST_TYPE_LABELS,
} from "@/features/businessRequests/config"
import type {
    BusinessRequest,
    BusinessRequestDecisionInput,
    BusinessRequestDecisionScope,
} from "@/features/businessRequests/api/types"
import {
    canCurrentUserDecideRequest,
    canCurrentUserSendCounterOffer,
    getCurrentPendingStep,
    type BusinessRequestUserContext,
} from "@/features/businessRequests/lib/businessRequestAccess"
import { getSubjectLabel } from "@/features/businessRequests/lib/businessRequestDisplay"
import { getUserDisplayName } from "@/lib/users/displayName"

type Props = {
    request: BusinessRequest
    isExpanded: boolean
    onToggleExpand: () => void
    showDomain: boolean
    showRequester: boolean
    colSpan: number
    userContext: BusinessRequestUserContext
    decisionScope?: BusinessRequestDecisionScope
    onDecision?: (input: BusinessRequestDecisionInput) => void
    isDecisionPending: boolean
    showAllFields: boolean
    onToggleShowAll: () => void
    note: string
    onNoteChange: (value: string) => void
    counterValues: Record<string, string>
    onCounterValueChange: (itemId: string, value: string) => void
}

export function BusinessRequestTableRow({
    request,
    isExpanded,
    onToggleExpand,
    showDomain,
    showRequester,
    colSpan,
    userContext,
    decisionScope,
    onDecision,
    isDecisionPending,
    showAllFields,
    onToggleShowAll,
    note,
    onNoteChange,
    counterValues,
    onCounterValueChange,
}: Props) {
    const currentStep = getCurrentPendingStep(request)
    const itemCount = request.items?.length ?? 0
    const isOrderRequest = request.type === "CUSTOMER_ORDER_REQUEST"
    const canDecide = decisionScope && onDecision
        ? canCurrentUserDecideRequest(request, userContext)
        : false
    const canCounter = decisionScope && onDecision
        ? canCurrentUserSendCounterOffer(request, userContext)
        : false

    return (
        <Fragment>
            <TableRow className={isExpanded ? "bg-neutral-50/70 align-top" : "align-top"}>
                <TableCell>
                    <button
                        type="button"
                        onClick={onToggleExpand}
                        className="flex items-start gap-2 text-left"
                    >
                        <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        <div className="space-y-1">
                            <div className="font-medium text-neutral-900">
                                {BUSINESS_REQUEST_TYPE_LABELS[request.type]}
                            </div>
                            <div className="line-clamp-2 text-xs text-neutral-500">
                                {request.title}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{BUSINESS_REQUEST_PRIORITY_LABELS[request.priority]}</Badge>
                            </div>
                        </div>
                    </button>
                </TableCell>
                {showDomain ? (
                    <TableCell>{BUSINESS_REQUEST_DOMAIN_LABELS[request.domain]}</TableCell>
                ) : null}
                <TableCell className="min-w-[320px]">
                    <div className="text-sm text-neutral-900">{getSubjectLabel(request)}</div>
                    {isOrderRequest ? (
                        <BusinessRequestOrderSummary request={request} />
                    ) : itemCount > 0 ? (
                        <div className="text-xs text-neutral-500">{itemCount} kalem eklendi</div>
                    ) : null}
                </TableCell>
                {showRequester ? (
                    <TableCell>
                        <div className="text-sm text-neutral-900">
                            {getUserDisplayName(request.requestedByUser) || request.requestedByUser.email}
                        </div>
                        <div className="text-xs text-neutral-500">{request.requestedByUser.email}</div>
                    </TableCell>
                ) : null}
                <TableCell>
                    <BusinessRequestStatusBadge status={request.status} />
                </TableCell>
                <TableCell>
                    {currentStep ? (
                        <BusinessRequestApprovalRoleBadge role={currentStep.requiredRole} status={currentStep.status} />
                    ) : "-"}
                </TableCell>
                <TableCell className="pr-4 text-right text-sm text-neutral-500">
                    {new Date(request.createdAt).toLocaleString("tr-TR")}
                </TableCell>
            </TableRow>

            {isExpanded ? (
                <TableRow>
                    <TableCell colSpan={colSpan} className="bg-white p-4">
                        <BusinessRequestExpandedPanel
                            request={request}
                            showAllFields={showAllFields}
                            onToggleShowAll={onToggleShowAll}
                            decisionScope={decisionScope}
                            onDecision={onDecision}
                            isDecisionPending={isDecisionPending}
                            canDecide={canDecide}
                            canCounter={canCounter}
                            note={note}
                            onNoteChange={onNoteChange}
                            counterValues={counterValues}
                            onCounterValueChange={onCounterValueChange}
                        />
                    </TableCell>
                </TableRow>
            ) : null}
        </Fragment>
    )
}
