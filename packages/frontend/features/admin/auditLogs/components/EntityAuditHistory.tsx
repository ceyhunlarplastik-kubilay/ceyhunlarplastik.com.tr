"use client"

import { useState } from "react"
import { History } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { DEFAULT_ADMIN_LIST_PAGE_SIZE } from "@/features/admin/shared/config"

import type { AuditActor, AuditEntityType } from "../api/types"
import { useEntityAuditLogs } from "../hooks/useEntityAuditLogs"
import { auditActorLabel, formatAuditDateTime, type AuditPresenter } from "../utils/auditPresentation"
import { AuditLogTimeline } from "./AuditLogTimeline"

type Props = {
    entityType: AuditEntityType
    entityId: string
    presenter: AuditPresenter
}

function SummaryItem({
    label,
    actor,
    at,
    emptyText,
}: {
    label: string
    actor: AuditActor | null
    at: string | null
    emptyText: string
}) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-neutral-500">{label}</dt>
            <dd className="mt-0.5 text-sm">
                {actor && at ? (
                    <>
                        <span className="font-medium text-neutral-900">{auditActorLabel(actor)}</span>
                        <time dateTime={at} className="block text-xs text-neutral-500">
                            {formatAuditDateTime(at)}
                        </time>
                    </>
                ) : (
                    <span className="text-neutral-500">{emptyText}</span>
                )}
            </dd>
        </div>
    )
}

/**
 * Bir kaydın değişiklik geçmişi: oluşturan / son değiştiren özeti + sayfalı kayıt listesi.
 * Modelden bağımsızdır — hangi modelin geçmişi olursa olsun bu bileşen kullanılır, yalnız
 * `presenter` değişir.
 */
export function EntityAuditHistory({ entityType, entityId, presenter }: Props) {
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState<number>(DEFAULT_ADMIN_LIST_PAGE_SIZE)

    const { data, isLoading, isError, isFetching, refetch } = useEntityAuditLogs({
        entityType,
        entityId,
        page,
        limit,
    })

    if (isLoading) {
        return (
            <div className="space-y-3" role="status" aria-label="Değişiklik geçmişi yükleniyor">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
            </div>
        )
    }

    if (isError || !data) {
        return (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>Değişiklik geçmişi yüklenemedi.</p>
                <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>
                    Tekrar dene
                </Button>
            </div>
        )
    }

    const { data: entries, meta, summary } = data
    const isRefetching = isFetching && !isLoading

    return (
        <div className="space-y-4">
            <dl className="grid gap-4 rounded-xl border bg-neutral-50 p-4 sm:grid-cols-3">
                <SummaryItem
                    label="Oluşturan"
                    actor={summary.createdBy}
                    at={summary.createdAt}
                    emptyText="Kayıt yok (denetim öncesi)"
                />
                <SummaryItem
                    label="Son değişiklik"
                    actor={summary.lastChangedBy}
                    at={summary.lastChangedAt}
                    emptyText="Henüz değişiklik kaydı yok"
                />
                <div>
                    <dt className="text-xs text-neutral-500">Kayıt sayısı</dt>
                    <dd className="mt-0.5 text-sm font-medium text-neutral-900">{meta.total}</dd>
                </div>
            </dl>

            {meta.total === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
                    <History aria-hidden className="size-6 text-neutral-400" />
                    <p className="text-sm font-medium text-neutral-900">Henüz değişiklik kaydı yok</p>
                    <p className="max-w-md text-xs leading-5 text-neutral-500">
                        Kayıtlar, denetim devreye alındıktan sonraki değişiklikler için tutulur. Bu kayıtta
                        yapılacak ilk değişiklik burada görünecek.
                    </p>
                </div>
            ) : (
                <>
                    <div className="relative" aria-busy={isRefetching}>
                        <AdminSectionLoadingOverlay isVisible={isRefetching} />
                        <AuditLogTimeline entries={entries} presenter={presenter} />
                    </div>

                    <AdminListPagination
                        page={page}
                        limit={limit}
                        total={meta.total}
                        totalPages={meta.totalPages}
                        itemLabel="kayıt"
                        onPageChange={setPage}
                        onLimitChange={(next) => {
                            setLimit(next)
                            setPage(1)
                        }}
                    />
                </>
            )}
        </div>
    )
}
