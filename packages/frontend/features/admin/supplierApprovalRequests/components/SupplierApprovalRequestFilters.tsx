"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
    DEFAULT_SUPPLIER_APPROVAL_REQUEST_PAGE_SIZE,
    DEFAULT_SUPPLIER_APPROVAL_REQUEST_REFRESH_INTERVAL_SECONDS,
    SUPPLIER_APPROVAL_REQUEST_REFRESH_INTERVAL_SECONDS,
    SUPPLIER_APPROVAL_STATUS_LABELS,
    SUPPLIER_APPROVAL_TYPE_LABELS,
} from "@/features/admin/supplierApprovalRequests/config"

type Props = {
    search: string
    status: string
    type: string
    limit: number
    refreshIntervalSeconds: number
    onSearchChange: (value: string) => void
    onStatusChange: (value: string) => void
    onTypeChange: (value: string) => void
    onLimitChange: (value: number) => void
    onRefreshIntervalChange: (value: number) => void
}

export function SupplierApprovalRequestFilters({
    search,
    status,
    type,
    limit,
    refreshIntervalSeconds,
    onSearchChange,
    onStatusChange,
    onTypeChange,
    onLimitChange,
    onRefreshIntervalChange,
}: Props) {
    return (
        <>
            <div className="grid gap-3 lg:grid-cols-4">
                <div className="relative lg:col-span-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                        className="pl-9"
                        placeholder="Tedarikçi, kullanıcı veya varyant ara"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                <Select value={status || "__all__"} onValueChange={(value) => onStatusChange(value === "__all__" ? "" : value)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tüm Durumlar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Tüm Durumlar</SelectItem>
                        {Object.entries(SUPPLIER_APPROVAL_STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={type || "__all__"} onValueChange={(value) => onTypeChange(value === "__all__" ? "" : value)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tüm Tipler" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Tüm Tipler</SelectItem>
                        {Object.entries(SUPPLIER_APPROVAL_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                    <span>Otomatik yenileme</span>
                    <Select
                        value={String(refreshIntervalSeconds)}
                        onValueChange={(value) => onRefreshIntervalChange(Number(value))}
                    >
                        <SelectTrigger size="sm" className="w-[170px] bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SUPPLIER_APPROVAL_REQUEST_REFRESH_INTERVAL_SECONDS.map((seconds) => (
                                <SelectItem key={seconds} value={String(seconds)}>
                                    {seconds === 0 ? "Kapalı" : `${seconds} saniye`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-xs text-neutral-500">
                        Varsayılan: {DEFAULT_SUPPLIER_APPROVAL_REQUEST_REFRESH_INTERVAL_SECONDS} saniye
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                    <span>Sayfa boyutu</span>
                    <Select value={String(limit)} onValueChange={(value) => onLimitChange(Number(value))}>
                        <SelectTrigger size="sm" className="w-[130px] bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, DEFAULT_SUPPLIER_APPROVAL_REQUEST_PAGE_SIZE, 50].map((value) => (
                                <SelectItem key={value} value={String(value)}>
                                    {value} / sayfa
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => onSearchChange("")}>
                        Aramayı Temizle
                    </Button>
                </div>
            </div>
        </>
    )
}
