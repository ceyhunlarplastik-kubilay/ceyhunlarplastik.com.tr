"use client"

import { Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ReferenceOption = { id: string; name: string; code?: string | null }

type Props = {
    query: string
    onQueryChange: (value: string) => void
    supplierId: string
    onSupplierIdChange: (value: string) => void
    colorId: string
    onColorIdChange: (value: string) => void
    suppliers: ReferenceOption[]
    colors: ReferenceOption[]
    hasActiveFilters: boolean
    onClear: () => void
    resultCount: number
}

/**
 * Kayıtlı varyant listesinin filtre çubuğu. Durum URL'de (nuqs) tutulduğu için
 * bileşen kontrollü: kendi `useState`'i yok.
 */
export function VariantMatrixFilters({
    query,
    onQueryChange,
    supplierId,
    onSupplierIdChange,
    colorId,
    onColorIdChange,
    suppliers,
    colors,
    hasActiveFilters,
    onClear,
    resultCount,
}: Props) {
    return (
        <div className="space-y-3 rounded-lg border p-3">
            <div className="grid gap-3 md:grid-cols-[1fr_200px_200px_auto]">
                <div className="space-y-1">
                    <Label className="text-xs">Ara</Label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            value={query}
                            onChange={(event) => onQueryChange(event.target.value)}
                            placeholder="Kod, tedarikçi kodu veya ölçü değeri"
                            className="pl-8"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs">Tedarikçi</Label>
                    <Select value={supplierId || "all"} onValueChange={(value) => onSupplierIdChange(value === "all" ? "" : value)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Tümü" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tümü</SelectItem>
                            {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs">Renk</Label>
                    <Select value={colorId || "all"} onValueChange={(value) => onColorIdChange(value === "all" ? "" : value)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Tümü" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tümü</SelectItem>
                            {colors.map((color) => (
                                <SelectItem key={color.id} value={color.id}>
                                    {color.code ? `${color.code} — ` : ""}{color.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-end">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClear}
                        disabled={!hasActiveFilters}
                    >
                        <X className="mr-1 size-4" />
                        Temizle
                    </Button>
                </div>
            </div>

            {/* Sıfır sonuçta bile aktif filtre görünür kalır ki kullanıcı hangi
                filtrenin listeyi boşalttığını görüp geri alabilsin. */}
            {hasActiveFilters ? (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-neutral-500">Aktif filtre:</span>
                    {query.trim() ? <Badge variant="secondary">Arama: {query.trim()}</Badge> : null}
                    {supplierId ? (
                        <Badge variant="secondary">
                            Tedarikçi: {suppliers.find((s) => s.id === supplierId)?.name ?? "—"}
                        </Badge>
                    ) : null}
                    {colorId ? (
                        <Badge variant="secondary">
                            Renk: {colors.find((c) => c.id === colorId)?.name ?? "—"}
                        </Badge>
                    ) : null}
                    <span className="text-neutral-500">{resultCount} sonuç</span>
                </div>
            ) : null}
        </div>
    )
}
