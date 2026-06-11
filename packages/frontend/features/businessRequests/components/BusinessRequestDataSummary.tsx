import { BusinessRequestDiffPanel } from "@/features/businessRequests/components/BusinessRequestDiffPanel"
import type { BusinessRequest } from "@/features/businessRequests/api/types"
import { isDiffRequest } from "@/features/businessRequests/lib/businessRequestDisplay"
import {
    getRequestDataHighlights,
    getRequestDataNotes,
} from "@/features/businessRequests/lib/businessRequestHighlights"

type Props = {
    request: BusinessRequest
    showAllFields: boolean
    onToggleShowAll: () => void
}

export function BusinessRequestDataSummary({
    request,
    showAllFields,
    onToggleShowAll,
}: Props) {
    if (Object.entries(request.requestedData ?? {}).length === 0) return null

    const highlights = getRequestDataHighlights(request)
    const notes = getRequestDataNotes(request)

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="text-sm font-medium text-neutral-900">Talep Verileri</div>
            {isDiffRequest(request) ? (
                <div className="mt-3">
                    <BusinessRequestDiffPanel
                        request={request}
                        showAllFields={showAllFields}
                        onToggleShowAll={onToggleShowAll}
                    />
                </div>
            ) : (
                <>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {highlights.map(({ label, value }) => (
                            <div key={label} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                                <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">{label}</div>
                                <div className="mt-1 text-sm text-neutral-700">{value}</div>
                            </div>
                        ))}
                    </div>

                    {notes.length > 0 ? (
                        <div className="mt-4 grid gap-3">
                            {notes.map(({ label, value }) => (
                                <div key={label} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                                    <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">{label}</div>
                                    <div className="mt-1 text-sm leading-6 text-neutral-700">{value}</div>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </>
            )}
        </div>
    )
}
