"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Bell, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { UserAccessStatusBadge } from "@/features/admin/users/components/UserAccessStatusBadge"
import { useMyAccess } from "@/features/auth/hooks/useMyAccess"
import { useMarkMyNotificationRead, useMyNotifications } from "@/features/auth/hooks/useMyNotifications"
import { performClientSignOut } from "@/features/auth/lib/client-signout"
import { resolveAuthHome } from "@/features/auth/lib/navigation"

export function AccountStatusPageClient({
    fallbackGroups,
    fallbackAccessStatus,
}: {
    fallbackGroups: string[]
    fallbackAccessStatus: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
}) {
    const accessQuery = useMyAccess()
    const notificationsQuery = useMyNotifications()
    const markReadMutation = useMarkMyNotificationRead()

    const access = accessQuery.data?.user
    const groups = access?.groups ?? fallbackGroups
    const accessStatus = access?.accessStatus ?? fallbackAccessStatus
    const destination = useMemo(
        () => resolveAuthHome(groups, accessStatus),
        [accessStatus, groups]
    )

    return (
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                            Hesap Durumu
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                            Hesabınız inceleniyor
                        </h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-500">
                            Yetkilendirme ve erişim değişiklikleri burada görünür. Yeni rol atandığında panele geçmeden önce bu ekran kendini günceller.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <UserAccessStatusBadge status={accessStatus} />
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                                void accessQuery.refetch()
                                void notificationsQuery.refetch()
                            }}
                        >
                            <RefreshCcw className={`h-4 w-4 ${accessQuery.isFetching ? "animate-spin" : ""}`} />
                            Yenile
                        </Button>
                    </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    {accessStatus === "PENDING_REVIEW"
                        ? "Hesabınız oluşturuldu. Yönetici incelemesi tamamlandığında rolünüz ve erişiminiz burada güncellenecek."
                        : accessStatus === "ACTIVE"
                            ? "Erişiminiz aktif. Yeni yetkileriniz görünmüyorsa oturumunuzu yenileyin veya panele geçin."
                            : accessStatus === "SUSPENDED"
                                ? "Hesabınız geçici olarak askıya alındı. Detaylar için yöneticiyle iletişime geçin."
                                : "Hesap erişiminiz reddedildi. Gerekçe veya yeni yönlendirme için yöneticinizle iletişime geçin."}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                    {accessStatus === "ACTIVE" ? (
                        <Button asChild variant="brand" size="lg" className="h-11 rounded-xl px-5">
                            <Link href={destination}>
                                Uygun panele git
                            </Link>
                        </Button>
                    ) : null}

                    <Button variant="outline" size="lg" className="h-11 rounded-xl px-5" onClick={() => void performClientSignOut()}>
                        Oturumu kapat
                    </Button>
                </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900">
                    <Bell className="h-4 w-4" />
                    <h2 className="text-lg font-semibold">Bildirimler</h2>
                </div>

                {notificationsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <Spinner className="size-5" />
                    </div>
                ) : (
                    <div className="mt-4 space-y-3">
                        {(notificationsQuery.data?.data ?? []).map((notification) => (
                            <button
                                key={notification.id}
                                type="button"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-white"
                                onClick={() => void markReadMutation.mutateAsync(notification.id)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="font-medium text-slate-950">{notification.title}</p>
                                        <p className="text-sm leading-6 text-slate-600">{notification.message}</p>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {new Date(notification.createdAt).toLocaleString("tr-TR")}
                                    </div>
                                </div>
                            </button>
                        ))}

                        {(notificationsQuery.data?.data ?? []).length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                                Henüz bildirim yok.
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    )
}
