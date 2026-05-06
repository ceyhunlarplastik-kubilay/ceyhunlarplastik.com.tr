"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type FilterValue = {
    id: string
    name: string
}

type Props = {
    search: string
    sectorValueId: string
    productionGroupValueId: string
    usageAreaValueId: string
    sectorValues: FilterValue[]
    productionGroupValues: FilterValue[]
    usageAreaValues: FilterValue[]
    onSearchChange: (value: string) => void
    onSectorValueIdChange: (value: string) => void
    onProductionGroupValueIdChange: (value: string) => void
    onUsageAreaValueIdChange: (value: string) => void
}

export function CustomerListFilters({
    search,
    sectorValueId,
    productionGroupValueId,
    usageAreaValueId,
    sectorValues,
    productionGroupValues,
    usageAreaValues,
    onSearchChange,
    onSectorValueIdChange,
    onProductionGroupValueIdChange,
    onUsageAreaValueIdChange,
}: Props) {
    return (
        <div className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-4">
                <div className="relative lg:col-span-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                        placeholder="Müşteri, firma, e-posta veya telefon ara"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select
                    value={sectorValueId || "__all__"}
                    onValueChange={(value) => onSectorValueIdChange(value === "__all__" ? "" : value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tüm Sektörler" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Tüm Sektörler</SelectItem>
                        {sectorValues.map((value) => (
                            <SelectItem key={value.id} value={value.id}>
                                {value.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={productionGroupValueId || "__all__"}
                    onValueChange={(value) => onProductionGroupValueIdChange(value === "__all__" ? "" : value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tüm Üretim Grupları" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Tüm Üretim Grupları</SelectItem>
                        {productionGroupValues.map((value) => (
                            <SelectItem key={value.id} value={value.id}>
                                {value.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <Select
                    value={usageAreaValueId || "__all__"}
                    onValueChange={(value) => onUsageAreaValueIdChange(value === "__all__" ? "" : value)}
                >
                    <SelectTrigger className="w-full lg:w-72">
                        <SelectValue placeholder="Tüm Kullanım Alanları" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Tüm Kullanım Alanları</SelectItem>
                        {usageAreaValues.map((value) => (
                            <SelectItem key={value.id} value={value.id}>
                                {value.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button variant="ghost" onClick={() => onSearchChange("")}>
                    Aramayı Temizle
                </Button>
            </div>
        </div>
    )
}
