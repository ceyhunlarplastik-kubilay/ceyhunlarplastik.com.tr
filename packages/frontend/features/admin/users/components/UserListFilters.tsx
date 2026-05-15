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

type Props = {
    search: string
    accessStatus?: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED" | null
    onSearchChange: (value: string) => void
    onAccessStatusChange: (value: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED" | "") => void
}

export function UserListFilters({ search, accessStatus, onSearchChange, onAccessStatusChange }: Props) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                    placeholder="E-posta, kullanıcı adı veya grup ara"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>

            <Select
                value={accessStatus || "__all__"}
                onValueChange={(value) =>
                    onAccessStatusChange(
                        value === "__all__"
                            ? ""
                            : value as "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
                    )
                }
            >
                <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Tüm durumlar" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="__all__">Tüm durumlar</SelectItem>
                    <SelectItem value="PENDING_REVIEW">İnceleniyor</SelectItem>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="SUSPENDED">Askıya alındı</SelectItem>
                    <SelectItem value="REJECTED">Reddedildi</SelectItem>
                </SelectContent>
            </Select>

            <Button
                variant="ghost"
                onClick={() => {
                    onSearchChange("")
                    onAccessStatusChange("")
                }}
            >
                Aramayı Temizle
            </Button>
        </div>
    )
}
