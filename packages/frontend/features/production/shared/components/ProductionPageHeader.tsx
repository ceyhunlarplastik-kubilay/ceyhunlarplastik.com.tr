import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"

/** Üretim planlama sayfalarının ortak başlığı: rozet + başlık + açıklama + birincil eylem. */
export function ProductionPageHeader({
    icon,
    title,
    description,
    action,
}: {
    icon: ReactNode
    title: string
    description: string
    action?: ReactNode
}) {
    return (
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
                <Badge variant="outline" className="rounded-full">
                    Üretim Planlama
                </Badge>
                <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight [&_svg]:size-6">
                    {icon}
                    {title}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
        </section>
    )
}
