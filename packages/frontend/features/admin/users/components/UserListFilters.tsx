"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Props = {
    search: string
    onSearchChange: (value: string) => void
}

export function UserListFilters({ search, onSearchChange }: Props) {
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

            <Button variant="ghost" onClick={() => onSearchChange("")}>
                Aramayı Temizle
            </Button>
        </div>
    )
}
