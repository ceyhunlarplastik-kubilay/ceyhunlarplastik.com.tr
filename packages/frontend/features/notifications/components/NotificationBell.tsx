"use client"

import Link from "next/link"
import { useState, useSyncExternalStore } from "react"
import { Bell, Check, RefreshCcw } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { useMarkMyNotificationRead, useMyNotifications } from "@/features/auth/hooks/useMyNotifications"
import { useRealtimeNotifications } from "@/features/notifications/hooks/useRealtimeNotifications"
import { cn } from "@/lib/utils"

type Props = {
    className?: string
    viewport?: "all" | "mobile" | "desktop"
    requestsHref?: string
}

function getViewportQuery(viewport: NonNullable<Props["viewport"]>) {
    if (viewport === "desktop") return "(min-width: 768px)"
    if (viewport === "mobile") return "(max-width: 767.98px)"
    return null
}

function getInitialViewportMatch(viewport: NonNullable<Props["viewport"]>) {
    const query = getViewportQuery(viewport)
    if (!query) return true
    if (typeof window === "undefined") return false
    return window.matchMedia(query).matches
}

function subscribeViewport(viewport: NonNullable<Props["viewport"]>, onChange: () => void) {
    const query = getViewportQuery(viewport)
    if (!query || typeof window === "undefined") return () => undefined

    const media = window.matchMedia(query)
    media.addEventListener("change", onChange)

    return () => {
        media.removeEventListener("change", onChange)
    }
}

function useViewportMatch(viewport: NonNullable<Props["viewport"]>) {
    return useSyncExternalStore(
        (onChange) => subscribeViewport(viewport, onChange),
        () => getInitialViewportMatch(viewport),
        () => viewport === "all",
    )
}

function formatDate(value: string) {
    return new Date(value).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export function NotificationBell({ className, viewport = "all", requestsHref }: Props) {
    const [open, setOpen] = useState(false)
    const { status } = useSession()
    const viewportMatches = useViewportMatch(viewport)
    const active = viewportMatches && status === "authenticated"
    const notificationsQuery = useMyNotifications({
        enabled: active,
        refetchInterval: 30_000,
        refetchIntervalInBackground: false,
    })
    const markReadMutation = useMarkMyNotificationRead()

    useRealtimeNotifications({ enabled: active })

    if (!viewportMatches) return null

    const notifications = notificationsQuery.data?.data ?? []
    const unreadCount = notificationsQuery.data?.unreadCount ?? 0
    const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount)

    return (
        <DropdownMenu
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen)
                if (nextOpen) {
                    void notificationsQuery.refetch()
                }
            }}
        >
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn("relative rounded-xl bg-white", className)}
                    aria-label="Bildirimler"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 ? (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-none text-white shadow-sm">
                            {badgeLabel}
                        </span>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <DropdownMenuLabel className="p-0 text-sm font-semibold text-slate-900">
                        Bildirimler
                    </DropdownMenuLabel>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg"
                        onClick={() => void notificationsQuery.refetch()}
                        aria-label="Bildirimleri yenile"
                    >
                        <RefreshCcw className={cn("h-4 w-4", notificationsQuery.isFetching && "animate-spin")} />
                    </Button>
                </div>

                <DropdownMenuSeparator className="m-0" />

                {notificationsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Spinner className="size-5" />
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="max-h-[22rem] overflow-y-auto p-1.5">
                        {notifications.map((notification) => {
                            const unread = !notification.readAt

                            return (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className="items-start gap-3 rounded-lg px-3 py-3"
                                    onSelect={() => markReadMutation.mutate(notification.id)}
                                >
                                    <span
                                        className={cn(
                                            "mt-1 h-2 w-2 rounded-full",
                                            unread ? "bg-brand" : "bg-slate-200",
                                        )}
                                    />
                                    <span className="min-w-0 flex-1 space-y-1">
                                        <span className="block truncate text-sm font-medium text-slate-950">
                                            {notification.title}
                                        </span>
                                        <span className="block line-clamp-2 text-xs leading-5 text-slate-500">
                                            {notification.message}
                                        </span>
                                        <span className="block text-[11px] text-slate-400">
                                            {formatDate(notification.createdAt)}
                                        </span>
                                    </span>
                                    {unread ? <Check className="mt-0.5 h-4 w-4 text-slate-400" /> : null}
                                </DropdownMenuItem>
                            )
                        })}
                    </div>
                ) : (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                        Henüz bildirim yok.
                    </div>
                )}

                {requestsHref ? (
                    <>
                        <DropdownMenuSeparator className="m-0" />
                        <div className="p-2">
                            <Button asChild variant="ghost" size="sm" className="w-full justify-center rounded-lg">
                                <Link href={requestsHref}>Onay akışına git</Link>
                            </Button>
                        </div>
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
