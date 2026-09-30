"use client"

import { TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

/**
 * İstatistik ilk yüklemede alınamadıysa: iskelette takılı kalmasın, yeniden denensin. Süzgeç
 * (ör. URL'de artık olmayan bir alan) hataya yol açmış olabileceği için temizleme de sunulur.
 */
export function StatsErrorState({
    onRetry,
    retrying,
    onClearFilters,
}: {
    onRetry: () => void
    retrying: boolean
    onClearFilters?: () => void
}) {
    return (
        <Empty className="border">
            <EmptyHeader>
                <EmptyMedia variant="icon"><TriangleAlert /></EmptyMedia>
                <EmptyTitle>İstatistik alınamadı</EmptyTitle>
                <EmptyDescription>Bağlantı ya da sunucu hatası. Birazdan yeniden deneyin.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
                <Button type="button" variant="outline" disabled={retrying} onClick={onRetry}>Yeniden dene</Button>
                {onClearFilters ? <Button type="button" variant="ghost" onClick={onClearFilters}>Süzgeçleri temizle</Button> : null}
            </EmptyContent>
        </Empty>
    )
}
