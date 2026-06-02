"use client"

export function CustomerPricingRequestCreateFlow({
    draftPanel,
    formCard,
}: {
    draftPanel: React.ReactNode
    formCard: React.ReactNode
}) {
    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.95fr)]">
            {formCard}
            {draftPanel}
        </div>
    )
}
