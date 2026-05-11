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
    status: string
    hideStatusFilter?: boolean
    assignedSalesUserId: string
    sectorValueId: string
    productionGroupValueId: string
    usageAreaValueId: string
    salesUsers: Array<{
        id: string
        label: string
    }>
    sectorValues: FilterValue[]
    productionGroupValues: FilterValue[]
    usageAreaValues: FilterValue[]
    onSearchChange: (value: string) => void
    onStatusChange: (value: string) => void
    onAssignedSalesUserIdChange: (value: string) => void
    onSectorValueIdChange: (value: string) => void
    onProductionGroupValueIdChange: (value: string) => void
    onUsageAreaValueIdChange: (value: string) => void
}

export function CustomerListFilters({
    search,
    status,
    hideStatusFilter = false,
    assignedSalesUserId,
    sectorValueId,
    productionGroupValueId,
    usageAreaValueId,
    salesUsers,
    sectorValues,
    productionGroupValues,
    usageAreaValues,
    onSearchChange,
    onStatusChange,
    onAssignedSalesUserIdChange,
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

                {!hideStatusFilter ? (
                    <Select
                        value={status || "__all__"}
                        onValueChange={(value) => onStatusChange(value === "__all__" ? "" : value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Tüm Durumlar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Tüm Durumlar</SelectItem>
                            <SelectItem value="LEAD">Potansiyel Müşteri</SelectItem>
                            <SelectItem value="CUSTOMER">Müşteri</SelectItem>
                        </SelectContent>
                    </Select>
                ) : null}

                <Select
                    value={assignedSalesUserId || "__all__"}
                    onValueChange={(value) => onAssignedSalesUserIdChange(value === "__all__" ? "" : value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tüm Satış Temsilcileri" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Tüm Satış Temsilcileri</SelectItem>
                        {salesUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                                {user.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

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
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <Select
                    value={productionGroupValueId || "__all__"}
                    onValueChange={(value) => onProductionGroupValueIdChange(value === "__all__" ? "" : value)}
                >
                    <SelectTrigger className="w-full xl:w-72">
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

                <Select
                    value={usageAreaValueId || "__all__"}
                    onValueChange={(value) => onUsageAreaValueIdChange(value === "__all__" ? "" : value)}
                >
                    <SelectTrigger className="w-full xl:w-72">
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

                <Button
                    variant="ghost"
                    onClick={() => {
                        onSearchChange("")
                        onStatusChange("")
                        onAssignedSalesUserIdChange("")
                        onSectorValueIdChange("")
                        onProductionGroupValueIdChange("")
                        onUsageAreaValueIdChange("")
                    }}
                >
                    Filtreleri Temizle
                </Button>
            </div>
        </div>
    )
}
