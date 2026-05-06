"use client"

import { RefreshCw } from "lucide-react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ADMIN_LIST_REFRESH_INTERVAL_SECONDS,
    DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS,
} from "@/features/admin/shared/config"

type Props = {
    dataUpdatedAt?: number
    isFetching?: boolean
    onRefresh: () => void
    refreshIntervalSeconds?: number
    onRefreshIntervalChange?: (seconds: number) => void
    refreshOptions?: readonly number[]
}

export function AdminListRefreshBar({
    dataUpdatedAt,
    isFetching = false,
    onRefresh,
    refreshIntervalSeconds,
    onRefreshIntervalChange,
    refreshOptions = ADMIN_LIST_REFRESH_INTERVAL_SECONDS,
}: Props) {
    const lastUpdatedLabel = dataUpdatedAt
        ? new Intl.DateTimeFormat("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(new Date(dataUpdatedAt))
        : "-"

    const autoRefreshEnabled =
        typeof refreshIntervalSeconds === "number" && refreshIntervalSeconds > 0

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                    {typeof refreshIntervalSeconds === "number" && (
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                            <motion.span
                                className="inline-block h-2 w-2 rounded-full bg-emerald-500"
                                animate={autoRefreshEnabled
                                    ? { scale: [1, 1.35, 1], opacity: [0.75, 1, 0.75] }
                                    : { scale: 1, opacity: 0.55 }}
                                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                            />
                            {autoRefreshEnabled
                                ? `${refreshIntervalSeconds} sn otomatik yenileme`
                                : "Otomatik yenileme kapalı"}
                        </div>
                    )}

                    <span>Son güncelleme: {lastUpdatedLabel}</span>
                    <span>{isFetching ? "Liste yenileniyor..." : "Liste güncel"}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {typeof refreshIntervalSeconds === "number" && onRefreshIntervalChange && (
                        <Select
                            value={String(refreshIntervalSeconds)}
                            onValueChange={(value) => onRefreshIntervalChange(Number(value))}
                        >
                            <SelectTrigger size="sm" className="w-[180px] bg-white">
                                <SelectValue placeholder="Otomatik yenileme" />
                            </SelectTrigger>
                            <SelectContent>
                                {refreshOptions.map((seconds) => (
                                    <SelectItem key={seconds} value={String(seconds)}>
                                        {seconds === DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS
                                            ? "Kapalı"
                                            : `${seconds} saniye`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        disabled={isFetching}
                        onClick={onRefresh}
                    >
                        <motion.span
                            className="inline-flex"
                            animate={isFetching ? { rotate: 360 } : { rotate: 0 }}
                            transition={isFetching
                                ? { duration: 0.9, repeat: Infinity, ease: "linear" }
                                : { duration: 0.2 }}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </motion.span>
                        Yenile
                    </Button>
                </div>
            </div>
        </div>
    )
}
