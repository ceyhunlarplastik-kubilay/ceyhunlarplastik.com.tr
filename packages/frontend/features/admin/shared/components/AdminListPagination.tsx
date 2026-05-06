"use client"

import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ADMIN_LIST_PAGE_SIZE_OPTIONS,
    DEFAULT_ADMIN_LIST_PAGE_SIZE,
} from "@/features/admin/shared/config"

type Props = {
    page: number
    totalPages?: number
    total?: number
    limit: number
    itemLabel?: string
    onPageChange: (page: number) => void
    onLimitChange: (limit: number) => void
    limitOptions?: readonly number[]
}

export function AdminListPagination({
    page,
    totalPages = 1,
    total,
    limit,
    itemLabel = "kayıt",
    onPageChange,
    onLimitChange,
    limitOptions = ADMIN_LIST_PAGE_SIZE_OPTIONS,
}: Props) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-600">
                Toplam{" "}
                <span className="font-semibold text-neutral-900">
                    {total ?? 0}
                </span>{" "}
                {itemLabel}
            </p>

            <div className="flex flex-wrap items-center gap-2">
                <Select
                    value={String(limit)}
                    onValueChange={(next) => onLimitChange(Number(next))}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Sayfa boyutu" />
                    </SelectTrigger>
                    <SelectContent>
                        {limitOptions.map((value) => (
                            <SelectItem key={value} value={String(value)}>
                                {value === DEFAULT_ADMIN_LIST_PAGE_SIZE
                                    ? `${value} / sayfa`
                                    : `${value} / sayfa`}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                >
                    Önceki
                </Button>

                <span className="px-2 text-sm text-neutral-700">
                    Sayfa {page} / {totalPages}
                </span>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Sonraki
                </Button>
            </div>
        </div>
    )
}
