"use client"

import { useMemo, useState } from "react"
import { parseAsStringLiteral, useQueryStates } from "nuqs"
import { ListChecks, Pencil, Plus, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DEFAULT_PRODUCTION_REASONS, STOP_CATEGORY_LABELS, missingDefaultReasons } from "@core/helpers/production/productionReasons"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import type { ProductionReason } from "@/features/production/reasons/api/types"
import {
    useCreateDefaultProductionReasons,
    useDeleteProductionReason,
    useProductionReasons,
} from "@/features/production/reasons/hooks/useProductionReasons"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { ProductionReasonFormDialog } from "./ProductionReasonFormDialog"

const KINDS = ["STOP", "SCRAP"] as const

/** Vardiya raporunda seçilen duruş ve fire nedenleri. Tür sekmesi URL'de. */
export function ProductionReasonsPageClient() {
    const [{ tur: kind }, setState] = useQueryStates({ tur: parseAsStringLiteral(KINDS).withDefault("STOP") })
    const reasonsQuery = useProductionReasons()
    const deleteMutation = useDeleteProductionReason()
    const defaultsMutation = useCreateDefaultProductionReasons()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<ProductionReason | null>(null)

    const reasons = useMemo(() => reasonsQuery.data ?? [], [reasonsQuery.data])
    const visible = reasons.filter((reason) => reason.kind === kind)
    const missingDefaults = missingDefaultReasons(reasons).length
    const nextSortOrder = visible.reduce((max, reason) => Math.max(max, reason.sortOrder + 1), 0)

    async function addDefaults() {
        try {
            const created = await defaultsMutation.mutateAsync()
            toast.success(created > 0 ? `${created} varsayılan neden eklendi` : "Varsayılanların hepsi zaten var")
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    async function remove(reason: ProductionReason) {
        try {
            await deleteMutation.mutateAsync(reason.id)
            toast.success(`${reason.code} silindi`)
        } catch {
            // Kullanılan neden 409 döner; mesaj global interceptor'da.
        }
    }

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<ListChecks />}
                title="Duruş ve Fire Nedenleri"
                description="Vardiya raporunda seçilen nedenler. Duruş kategorisi istatistikte kayıp türünü ayırır (planlı duruş kullanılabilirlik kaybı sayılmaz). Raporda kullanılan neden silinmez, pasife alınır."
                action={(
                    <div className="flex flex-wrap gap-2">
                        {missingDefaults > 0 ? (
                            <Button type="button" variant="outline" className="rounded-2xl" disabled={defaultsMutation.isPending} onClick={() => void addDefaults()}>
                                <Sparkles className="h-4 w-4" />
                                Varsayılanları ekle ({missingDefaults})
                            </Button>
                        ) : null}
                        <Button type="button" className="rounded-2xl" onClick={() => { setEditing(null); setDialogOpen(true) }}>
                            <Plus className="h-4 w-4" />
                            Yeni neden
                        </Button>
                    </div>
                )}
            />

            <Tabs value={kind} onValueChange={(value) => void setState({ tur: value === "STOP" ? null : value as (typeof KINDS)[number] })}>
                <TabsList>
                    <TabsTrigger value="STOP">Duruş nedenleri ({reasons.filter((reason) => reason.kind === "STOP").length})</TabsTrigger>
                    <TabsTrigger value="SCRAP">Fire nedenleri ({reasons.filter((reason) => reason.kind === "SCRAP").length})</TabsTrigger>
                </TabsList>
            </Tabs>

            {reasonsQuery.isLoading && reasons.length === 0 ? (
                <Skeleton className="h-64 rounded-2xl" />
            ) : visible.length === 0 ? (
                <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                    Henüz {kind === "STOP" ? "duruş" : "fire"} nedeni yok. &quot;Varsayılanları ekle&quot; ile {DEFAULT_PRODUCTION_REASONS.filter((reason) => reason.kind === kind).length} yaygın nedeni ekleyebilir ya da kendiniz tanımlayabilirsiniz.
                </p>
            ) : (
                <div className="relative overflow-hidden rounded-2xl border bg-card" aria-busy={reasonsQuery.isFetching}>
                    <AdminSectionLoadingOverlay isVisible={reasonsQuery.isFetching && !reasonsQuery.isLoading} />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-20">Kod</TableHead>
                                <TableHead>Ad</TableHead>
                                {kind === "STOP" ? <TableHead>Kategori</TableHead> : null}
                                <TableHead className="text-end">Kullanım</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="w-24" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.map((reason) => (
                                <TableRow key={reason.id} className={reason.isActive ? undefined : "text-muted-foreground"}>
                                    <TableCell className="font-mono">{reason.code}</TableCell>
                                    <TableCell>{reason.name}</TableCell>
                                    {kind === "STOP" ? (
                                        <TableCell>{reason.stopCategory ? STOP_CATEGORY_LABELS[reason.stopCategory] : "—"}</TableCell>
                                    ) : null}
                                    <TableCell className="text-end tabular-nums">{reason.usageCount}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="rounded-full">{reason.isActive ? "Aktif" : "Pasif"}</Badge>
                                    </TableCell>
                                    <TableCell className="text-end">
                                        <Button type="button" variant="ghost" size="icon" aria-label={`${reason.code} düzenle`} onClick={() => { setEditing(reason); setDialogOpen(true) }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        {reason.usageCount === 0 ? (
                                            <ConfirmDeleteDialog
                                                trigger={(
                                                    <Button type="button" variant="ghost" size="icon" aria-label={`${reason.code} sil`}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                title="Neden silinsin mi?"
                                                description="Hiçbir raporda kullanılmadığı için kalıcı olarak silinir."
                                                itemNames={[`${reason.code} · ${reason.name}`]}
                                                onConfirm={() => void remove(reason)}
                                            />
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <ProductionReasonFormDialog open={dialogOpen} onOpenChange={setDialogOpen} kind={kind} reason={editing} nextSortOrder={nextSortOrder} />
        </div>
    )
}
