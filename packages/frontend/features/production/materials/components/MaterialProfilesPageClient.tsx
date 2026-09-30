"use client"

import { useState } from "react"
import { FlaskConical, Pencil, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import type { MaterialWithProfile } from "@/features/production/materials/api/types"
import { useMaterialProfiles } from "@/features/production/materials/hooks/useMaterialProfiles"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { MaterialProfileFormDialog } from "./MaterialProfileFormDialog"

function formatNumber(value: number | null, suffix = "") {
    return value === null ? "—" : `${value.toLocaleString("tr-TR")}${suffix}`
}

function describeDrying(material: MaterialWithProfile) {
    const profile = material.profile
    if (!profile) return "—"
    if (!profile.requiresDrying) return "Gerekmez"

    const parts = [
        profile.dryingTempC !== null ? `${profile.dryingTempC} °C` : null,
        profile.dryingHours !== null ? `${profile.dryingHours.toLocaleString("tr-TR")} sa` : null,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(" · ") : "Gerekir"
}

export function MaterialProfilesPageClient() {
    const materialsQuery = useMaterialProfiles()
    const [editing, setEditing] = useState<MaterialWithProfile | null>(null)

    const materials = materialsQuery.data ?? []
    const isInitialLoading = materialsQuery.isLoading && materials.length === 0
    const isBackgroundRefetch = materialsQuery.isFetching && !isInitialLoading

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<FlaskConical />}
                title="Hammadde Üretim Bilgisi"
                description="Katalogdaki hammaddelerin üretime özel bilgisi: makinede işlenip işlenmediği, kurutma ve çevrime etkisi. Hammadde adları ve çevirileri Veri Girişi panelinden yönetilir."
            />

            {isInitialLoading ? (
                <Skeleton className="h-64 rounded-2xl" />
            ) : materials.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <FlaskConical />
                        </EmptyMedia>
                        <EmptyTitle>Katalogda hammadde yok</EmptyTitle>
                        <EmptyDescription>Hammaddeler Veri Girişi panelinden eklenir; burada yalnız üretim bilgileri girilir.</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                <div className="relative overflow-hidden rounded-2xl border bg-card" aria-busy={isBackgroundRefetch}>
                    <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Hammadde</TableHead>
                                <TableHead>Makinede işlenir</TableHead>
                                <TableHead>Aile</TableHead>
                                <TableHead className="text-end">Yoğunluk</TableHead>
                                <TableHead>Kurutma</TableHead>
                                <TableHead className="text-end">Çevrim katsayısı</TableHead>
                                <TableHead className="w-36 text-end">
                                    <span className="sr-only">İşlemler</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {materials.map((material) => (
                                <TableRow key={material.id}>
                                    <TableCell>
                                        <div className="font-medium">{material.name}</div>
                                        {material.code ? <div className="text-xs text-muted-foreground">{material.code}</div> : null}
                                    </TableCell>
                                    <TableCell>
                                        {material.profile ? (
                                            <Badge variant={material.profile.isMoldResin ? "secondary" : "outline"} className="rounded-full">
                                                {material.profile.isMoldResin ? "Evet" : "Hayır (insert)"}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Bilgi girilmedi</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{material.profile?.family ?? "—"}</TableCell>
                                    <TableCell className="text-end tabular-nums text-muted-foreground">
                                        {formatNumber(material.profile?.densityGCm3 ?? null, " g/cm³")}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{describeDrying(material)}</TableCell>
                                    <TableCell className="text-end tabular-nums">
                                        {material.profile ? `× ${material.profile.cycleTimeFactor.toLocaleString("tr-TR")}` : "—"}
                                    </TableCell>
                                    <TableCell className="text-end">
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(material)}>
                                            {material.profile ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                            {material.profile ? "Düzenle" : "Bilgi gir"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <MaterialProfileFormDialog
                open={Boolean(editing)}
                onOpenChange={(open) => {
                    if (!open) setEditing(null)
                }}
                material={editing}
            />
        </div>
    )
}
