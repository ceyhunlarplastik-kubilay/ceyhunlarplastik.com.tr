"use client"

import type { ReactNode } from "react"
import { ArrowUpDown, BriefcaseBusiness, Building2, Filter, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { UserListFilters } from "@/features/admin/users/components/UserListFilters"
import {
    QUICK_LINK_OPTIONS,
    QUICK_ROLE_OPTIONS,
    QUICK_STATE_OPTIONS,
    SORT_OPTIONS,
    type QuickLinkFilter,
    type QuickRoleFilter,
    type QuickStateFilter,
    type SortDirection,
    type SortKey,
} from "@/features/admin/users/lib/userFilters"
import { cn } from "@/lib/utils"

type Props = {
    search: string
    accessStatus?: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED" | null
    quickRole: QuickRoleFilter
    quickLink: QuickLinkFilter
    quickState: QuickStateFilter
    sortKey: SortKey
    sortDirection: SortDirection
    onSearchChange: (value: string) => void
    onAccessStatusChange: (value: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED" | "") => void
    onQuickRoleChange: (value: QuickRoleFilter) => void
    onQuickLinkChange: (value: QuickLinkFilter) => void
    onQuickStateChange: (value: QuickStateFilter) => void
    onSortKeyChange: (value: SortKey) => void
    onSortDirectionToggle: () => void
    onReset: () => void
}

function QuickFilterButton({
    active,
    onClick,
    children,
}: {
    active: boolean
    onClick: () => void
    children: ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                active
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900",
            )}
        >
            {children}
        </button>
    )
}

const QUICK_LINK_ICONS = {
    all: Filter,
    portal_supplier: Building2,
    portal_customer: BriefcaseBusiness,
    unlinked: ShieldCheck,
} satisfies Record<QuickLinkFilter, typeof Filter>

export function UsersToolbar({
    search,
    accessStatus,
    quickRole,
    quickLink,
    quickState,
    sortKey,
    sortDirection,
    onSearchChange,
    onAccessStatusChange,
    onQuickRoleChange,
    onQuickLinkChange,
    onQuickStateChange,
    onSortKeyChange,
    onSortDirectionToggle,
    onReset,
}: Props) {
    return (
        <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <UserListFilters
                        search={search}
                        accessStatus={accessStatus}
                        onSearchChange={onSearchChange}
                        onAccessStatusChange={onAccessStatusChange}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600">
                            <ArrowUpDown className="h-3.5 w-3.5" />
                            Sıralama
                        </div>

                        <Select value={sortKey} onValueChange={(value) => onSortKeyChange(value as SortKey)}>
                            <SelectTrigger className="h-9 min-w-44 bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button type="button" variant="outline" size="sm" onClick={onSortDirectionToggle}>
                            {sortDirection === "asc" ? "Artan" : "Azalan"}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
                            Sıfırla
                        </Button>
                    </div>
                </div>

                <div className="grid gap-3 border-t border-neutral-200 pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
                            Roller
                        </div>
                        {QUICK_ROLE_OPTIONS.map((option) => (
                            <QuickFilterButton
                                key={option.value}
                                active={quickRole === option.value}
                                onClick={() => onQuickRoleChange(option.value)}
                            >
                                {option.label}
                            </QuickFilterButton>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
                            Portal
                        </div>
                        {QUICK_LINK_OPTIONS.map((option) => {
                            const Icon = QUICK_LINK_ICONS[option.value]
                            return (
                                <QuickFilterButton
                                    key={option.value}
                                    active={quickLink === option.value}
                                    onClick={() => onQuickLinkChange(option.value)}
                                >
                                    <span className="inline-flex items-center gap-1.5">
                                        <Icon className="h-3.5 w-3.5" />
                                        {option.label}
                                    </span>
                                </QuickFilterButton>
                            )
                        })}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
                            Durum
                        </div>
                        {QUICK_STATE_OPTIONS.map((option) => (
                            <QuickFilterButton
                                key={option.value}
                                active={quickState === option.value}
                                onClick={() => onQuickStateChange(option.value)}
                            >
                                {option.label}
                            </QuickFilterButton>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
