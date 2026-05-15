"use client"

import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    BUSINESS_REQUEST_DOMAIN_LABELS,
    BUSINESS_REQUEST_STATUS_LABELS,
    BUSINESS_REQUEST_TYPE_LABELS,
    DEFAULT_BUSINESS_REQUEST_PAGE_SIZE,
} from "@/features/businessRequests/config"
import type {
    BusinessRequestDomain,
    BusinessRequestType,
} from "@/features/businessRequests/api/types"

type Props = {
    search: string
    status: string
    type: string
    domain?: string
    limit?: number
    onSearchChange: (value: string) => void
    onStatusChange: (value: string) => void
    onTypeChange: (value: string) => void
    onDomainChange?: (value: string) => void
    onLimitChange?: (value: number) => void
    allowedTypes?: readonly BusinessRequestType[]
    showDomainFilter?: boolean
}

export function BusinessRequestFilters({
    search,
    status,
    type,
    domain = "",
    limit = DEFAULT_BUSINESS_REQUEST_PAGE_SIZE,
    onSearchChange,
    onStatusChange,
    onTypeChange,
    onDomainChange,
    onLimitChange,
    allowedTypes,
    showDomainFilter = false,
}: Props) {
    const typeValues = allowedTypes ?? (Object.keys(BUSINESS_REQUEST_TYPE_LABELS) as BusinessRequestType[])

    return (
        <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 lg:grid-cols-[minmax(220px,1.3fr)_repeat(4,minmax(0,0.75fr))]">
            <Input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Talep, müşteri, tedarikçi veya kullanıcı ara"
            />

            <Select value={status || "__all__"} onValueChange={(value) => onStatusChange(value === "__all__" ? "" : value)}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="__all__">Tüm durumlar</SelectItem>
                    {Object.entries(BUSINESS_REQUEST_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                            {label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={type || "__all__"} onValueChange={(value) => onTypeChange(value === "__all__" ? "" : value)}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Talep tipi" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="__all__">Tüm tipler</SelectItem>
                    {typeValues.map((value) => (
                        <SelectItem key={value} value={value}>
                            {BUSINESS_REQUEST_TYPE_LABELS[value]}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {showDomainFilter ? (
                <Select value={domain || "__all__"} onValueChange={(value) => onDomainChange?.(value === "__all__" ? "" : value)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Domain" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Tüm domainler</SelectItem>
                        {(Object.keys(BUSINESS_REQUEST_DOMAIN_LABELS) as BusinessRequestDomain[]).map((value) => (
                            <SelectItem key={value} value={value}>
                                {BUSINESS_REQUEST_DOMAIN_LABELS[value]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                <div />
            )}

            <Select value={String(limit)} onValueChange={(value) => onLimitChange?.(Number(value))}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sayfa boyutu" />
                </SelectTrigger>
                <SelectContent>
                    {[10, 20, 50, 100].map((value) => (
                        <SelectItem key={value} value={String(value)}>
                            {value} kayıt
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
