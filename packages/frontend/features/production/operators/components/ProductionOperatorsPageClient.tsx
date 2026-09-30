"use client"

import { useMemo, useState } from "react"
import { parseAsString, useQueryStates } from "nuqs"
import { HardHat, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import type { ProductionOperator } from "@/features/production/operators/api/types"
import {
    useDeleteProductionOperator,
    useProductionOperators,
} from "@/features/production/operators/hooks/useProductionOperators"
import {
    filterProductionOperators,
    operatorFullName,
} from "@/features/production/operators/lib/filterProductionOperators"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { ProductionOperatorFormDialog } from "./ProductionOperatorFormDialog"

const ALL_VALUE = "__all__"

export function ProductionOperatorsPageClient() {
    // Filtreler URL'de: ekran paylaşılabilir, geri tuşu filtreyi korur (AGENTS.md).
    const [{ q: search, durum: status }, setFilters] = useQueryStates({
        q: parseAsString.withDefault(""),
        durum: parseAsString.withDefault(""),
    })
    const operatorsQuery = useProductionOperators()
    const deleteMutation = useDeleteProductionOperator()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<ProductionOperator | null>(null)

    const operators = useMemo(() => operatorsQuery.data ?? [], [operatorsQuery.data])
    const visibleOperators = useMemo(
        () => filterProductionOperators(operators, { search, status }),
        [operators, search, status],
    )
    const activeCount = useMemo(() => operators.filter((operator) => operator.isActive).length, [operators])

    const isInitialLoading = operatorsQuery.isLoading && operators.length === 0
    const isBackgroundRefetch = operatorsQuery.isFetching && !isInitialLoading
    const hasFilters = Boolean(search || status)

    function openCreate() {
        setEditing(null)
        setDialogOpen(true)
    }

    function openEdit(operator: ProductionOperator) {
        setEditing(operator)
        setDialogOpen(true)
    }

    async function remove(operator: ProductionOperator) {
        try {
            await deleteMutation.mutateAsync(operator.id)
            toast.success("Operatör silindi")
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor.
        }
    }

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<HardHat />}
                title="Operatörler"
                description="Makine başında çalışan personel. Bu aşamada giriş hesabı yok; ileride makine × vardiya ekibi olarak atanır ve lotlarda görünür."
                action={(
                    <Button type="button" className="rounded-2xl" onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Yeni Operatör
                    </Button>
                )}
            />

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
                <div className="relative">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => void setFilters({ q: event.target.value || null })}
                        placeholder="Ad, soyad, sicil no veya telefon ara"
                        aria-label="Operatör ara"
                        className="ps-9"
                    />
                </div>
                <Select
                    value={status || ALL_VALUE}
                    onValueChange={(value) => void setFilters({ durum: value === ALL_VALUE ? null : value })}
                >
                    <SelectTrigger className="w-full" aria-label="Duruma göre filtrele">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_VALUE}>Tüm operatörler</SelectItem>
                        <SelectItem value="aktif">Aktif</SelectItem>
                        <SelectItem value="pasif">Pasif</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isInitialLoading ? (
                <Skeleton className="h-48 rounded-2xl" />
            ) : visibleOperators.length === 0 ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <HardHat />
                        </EmptyMedia>
                        <EmptyTitle>{hasFilters ? "Filtreyle eşleşen operatör yok" : "Henüz operatör yok"}</EmptyTitle>
                        <EmptyDescription>
                            {hasFilters
                                ? "Filtreleri temizleyip tekrar deneyin."
                                : "Makine başında çalışan personeli ekleyin; yalnız ad ve soyad zorunlu."}
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        {hasFilters ? (
                            <Button type="button" variant="outline" onClick={() => void setFilters({ q: null, durum: null })}>
                                Filtreleri temizle
                            </Button>
                        ) : (
                            <Button type="button" onClick={openCreate}>
                                <Plus className="h-4 w-4" />
                                İlk operatörü ekle
                            </Button>
                        )}
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        {operators.length} operatör · {activeCount} aktif
                    </p>
                    <div className="relative overflow-hidden rounded-2xl border bg-card" aria-busy={isBackgroundRefetch}>
                        <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ad Soyad</TableHead>
                                    <TableHead>Sicil no</TableHead>
                                    <TableHead>Telefon</TableHead>
                                    <TableHead>Not</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="w-24 text-end">
                                        <span className="sr-only">İşlemler</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleOperators.map((operator) => {
                                    const fullName = operatorFullName(operator)
                                    return (
                                        <TableRow key={operator.id}>
                                            <TableCell className="font-medium">{fullName}</TableCell>
                                            <TableCell className="tabular-nums text-muted-foreground">{operator.employeeNo ?? "—"}</TableCell>
                                            <TableCell className="tabular-nums text-muted-foreground">
                                                {operator.phone ? (
                                                    <a href={`tel:${operator.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                                                        {operator.phone}
                                                    </a>
                                                ) : "—"}
                                            </TableCell>
                                            <TableCell className="max-w-72 truncate text-muted-foreground" title={operator.notes ?? undefined}>
                                                {operator.notes ?? "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={operator.isActive ? "secondary" : "outline"} className="rounded-full">
                                                    {operator.isActive ? "Aktif" : "Pasif"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label={`${fullName} düzenle`}
                                                        onClick={() => openEdit(operator)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <ConfirmDeleteDialog
                                                        trigger={(
                                                            <Button type="button" variant="ghost" size="icon" aria-label={`${fullName} sil`}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        title="Operatör silinsin mi?"
                                                        description="Kayıt kalıcı olarak silinir. İşten ayrılan personel için 'Pasif' yapmak yeterli; ileride lot ve vardiya geçmişinde adı kalır."
                                                        itemNames={[operator.employeeNo ? `${fullName} · ${operator.employeeNo}` : fullName]}
                                                        onConfirm={() => void remove(operator)}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            <ProductionOperatorFormDialog open={dialogOpen} onOpenChange={setDialogOpen} operator={editing} />
        </div>
    )
}
