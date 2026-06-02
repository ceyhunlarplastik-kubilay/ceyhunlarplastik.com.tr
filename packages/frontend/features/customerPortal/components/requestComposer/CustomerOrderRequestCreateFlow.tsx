"use client"

export function CustomerOrderRequestCreateFlow({
    draftPanel,
    formCard,
}: {
    draftPanel: React.ReactNode
    formCard: React.ReactNode
}) {
    return (
        <div className="space-y-6">
            {draftPanel}
            {formCard}
        </div>
    )
}
