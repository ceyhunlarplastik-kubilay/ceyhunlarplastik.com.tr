"use client"

import { useMemo } from "react"
import { useSession } from "next-auth/react"
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { BusinessRequestTableEmptyState } from "@/features/businessRequests/components/BusinessRequestTableEmptyState"
import { BusinessRequestTableLoadingState } from "@/features/businessRequests/components/BusinessRequestTableLoadingState"
import { BusinessRequestTableRow } from "@/features/businessRequests/components/BusinessRequestTableRow"
import type {
    BusinessRequest,
    BusinessRequestDecisionInput,
    BusinessRequestDecisionScope,
} from "@/features/businessRequests/api/types"
import { useBusinessRequestDecisionState } from "@/features/businessRequests/hooks/useBusinessRequestDecisionState"
import { useBusinessRequestTableState } from "@/features/businessRequests/hooks/useBusinessRequestTableState"
import type { BusinessRequestUserContext } from "@/features/businessRequests/lib/businessRequestAccess"
import { getBusinessRequestTableColSpan } from "@/features/businessRequests/lib/businessRequestDisplay"

type Props = {
    requests: BusinessRequest[]
    isLoading?: boolean
    emptyMessage: string
    showRequester?: boolean
    showDomain?: boolean
    decisionScope?: BusinessRequestDecisionScope
    onDecision?: (input: BusinessRequestDecisionInput) => void
    isDecisionPending?: boolean
}

export function BusinessRequestTable({
    requests,
    isLoading = false,
    emptyMessage,
    showRequester = true,
    showDomain = false,
    decisionScope,
    onDecision,
    isDecisionPending = false,
}: Props) {
    const { data: session } = useSession()
    const { expandedId, showAllFieldsById, toggleExpanded, toggleShowAllFields } = useBusinessRequestTableState()
    const { getNote, getCounterValues, setNote, setCounterValue } = useBusinessRequestDecisionState()
    const sessionUser = session?.user as BusinessRequestUserContext | undefined

    const userContext = useMemo<BusinessRequestUserContext>(
        () => ({
            dbUserId: sessionUser?.dbUserId ?? null,
            customerId: sessionUser?.customerId ?? null,
            groups: sessionUser?.groups ?? [],
        }),
        [sessionUser?.customerId, sessionUser?.dbUserId, sessionUser?.groups],
    )

    const colSpan = getBusinessRequestTableColSpan(showDomain, showRequester)

    return (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Talep</TableHead>
                        {showDomain ? <TableHead>Domain</TableHead> : null}
                        <TableHead>İlgili Kayıt</TableHead>
                        {showRequester ? <TableHead>Talebi Açan</TableHead> : null}
                        <TableHead>Durum</TableHead>
                        <TableHead>Bekleyen Adım</TableHead>
                        <TableHead className="pr-4 text-right">Tarih</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <BusinessRequestTableLoadingState colSpan={colSpan} />
                    ) : requests.length === 0 ? (
                        <BusinessRequestTableEmptyState colSpan={colSpan} message={emptyMessage} />
                    ) : requests.map((request) => (
                        <BusinessRequestTableRow
                            key={request.id}
                            request={request}
                            isExpanded={expandedId === request.id}
                            onToggleExpand={() => toggleExpanded(request.id)}
                            showDomain={showDomain}
                            showRequester={showRequester}
                            colSpan={colSpan}
                            userContext={userContext}
                            decisionScope={decisionScope}
                            onDecision={onDecision}
                            isDecisionPending={isDecisionPending}
                            showAllFields={Boolean(showAllFieldsById[request.id])}
                            onToggleShowAll={() => toggleShowAllFields(request.id)}
                            note={getNote(request.id)}
                            onNoteChange={(value) => setNote(request.id, value)}
                            counterValues={getCounterValues(request.id)}
                            onCounterValueChange={(itemId, value) => setCounterValue(request.id, itemId, value)}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
