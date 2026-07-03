import { Filter, RotateCcw, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { ProductAttributeValue } from "@/features/admin/productAttributes/types"

type Props = {
    search: string
    parentFilterValueId: string
    parentAttributeCode: string | null
    parentLabel: string
    parentValues: ProductAttributeValue[]
    onSearchChange: (value: string) => void
    onParentFilterChange: (value: string) => void
    onClearFilters: () => void
}

export function ProductAttributeValuesToolbar({
    search,
    parentFilterValueId,
    parentAttributeCode,
    parentLabel,
    parentValues,
    onSearchChange,
    onParentFilterChange,
    onClearFilters,
}: Props) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="grid min-h-11 gap-3 lg:grid-cols-[minmax(0,1fr)_260px_auto]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                        placeholder="Değer veya üst ilişki ara"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        className="h-11 pl-9"
                    />
                </div>

                {parentAttributeCode ? (
                    <Select
                        value={parentFilterValueId || "__all__"}
                        onValueChange={(value) => onParentFilterChange(value === "__all__" ? "" : value)}
                    >
                        <SelectTrigger className="h-11 bg-white">
                            <Filter className="mr-2 h-4 w-4 text-neutral-400" />
                            <SelectValue placeholder={`${parentLabel} filtresi`} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Tüm {parentLabel}</SelectItem>
                            {parentValues.map((value) => (
                                <SelectItem key={value.id} value={value.id}>
                                    {value.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="hidden lg:block" />
                )}

                <Button
                    type="button"
                    variant="outline"
                    className="h-11 gap-2"
                    onClick={onClearFilters}
                >
                    <RotateCcw className="h-4 w-4" />
                    Temizle
                </Button>
            </div>
        </div>
    )
}
