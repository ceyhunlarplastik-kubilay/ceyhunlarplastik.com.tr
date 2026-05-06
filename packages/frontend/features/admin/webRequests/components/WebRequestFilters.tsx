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
import { WEB_REQUEST_STATUS_VALUES } from "@/features/admin/webRequests/hooks/useWebRequestListFilters"
import { WEB_REQUEST_STATUS_LABELS } from "@/features/admin/webRequests/components/WebRequestStatusBadge"

type Props = {
    search: string
    status: string
    onSearchChange: (value: string) => void
    onStatusChange: (value: string) => void
}

export function WebRequestFilters({
    search,
    status,
    onSearchChange,
    onStatusChange,
}: Props) {
    return (
        <div className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                    placeholder="Ad, e-posta, telefon veya mesaj ara"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="flex gap-2">
                <Select
                    value={status || "__all__"}
                    onValueChange={(value) => onStatusChange(value === "__all__" ? "" : value)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tüm Durumlar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">Tüm Durumlar</SelectItem>
                        {WEB_REQUEST_STATUS_VALUES.map((value) => (
                            <SelectItem key={value} value={value}>
                                {WEB_REQUEST_STATUS_LABELS[value]}
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
