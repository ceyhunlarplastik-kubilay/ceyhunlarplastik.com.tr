"use client"

import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { GROUP_LABELS } from "@/features/admin/users/schema/userEditor"
import { cn } from "@/lib/utils"

import type { AuditAction, AuditChange, AuditLogEntry } from "../api/types"
import {
    AUDIT_ACTION_LABELS,
    auditActorLabel,
    buildAuditChangeView,
    formatAuditDateTime,
    type AuditPresenter,
} from "../utils/auditPresentation"

const ACTION_BADGE_CLASS: Record<AuditAction, string> = {
    CREATE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    UPDATE: "border-sky-200 bg-sky-50 text-sky-700",
    DELETE: "border-red-200 bg-red-50 text-red-700",
}

const groupLabel = (group: string) => (GROUP_LABELS as Record<string, string>)[group] ?? group

function AuditChangeRow({ change, presenter }: { change: AuditChange; presenter: AuditPresenter }) {
    const view = buildAuditChangeView(change, presenter)
    const itemLabel = (item: string) => presenter.itemLabel?.(change.field, item) ?? item

    return (
        <div className="grid gap-1 sm:grid-cols-[minmax(9rem,14rem)_1fr] sm:gap-3">
            <dt className="text-xs font-medium text-neutral-500 sm:pt-0.5">
                {presenter.fieldLabel(change.field)}
            </dt>

            <dd className="min-w-0 break-words text-sm text-neutral-900">
                {view.kind === "list" ? (
                    <ul className="space-y-1">
                        {view.added.length > 0 && (
                            <li className="text-emerald-700">
                                <span className="font-medium">Eklendi ({view.added.length}):</span>{" "}
                                {view.added.map(itemLabel).join(", ")}
                            </li>
                        )}
                        {view.removed.length > 0 && (
                            <li className="text-red-700">
                                <span className="font-medium">Çıkarıldı ({view.removed.length}):</span>{" "}
                                {view.removed.map(itemLabel).join(", ")}
                            </li>
                        )}
                    </ul>
                ) : (
                    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                        {view.before !== null && (
                            <del className="text-neutral-500">{view.before}</del>
                        )}
                        {view.before !== null && view.after !== null && (
                            <ArrowRight aria-hidden className="size-3.5 shrink-0 text-neutral-400" />
                        )}
                        {view.after !== null && (
                            <ins className="font-medium no-underline">{view.after}</ins>
                        )}
                        {view.before === null && view.after === null && (
                            <span className="text-neutral-400">—</span>
                        )}
                    </span>
                )}
            </dd>
        </div>
    )
}

function AuditLogItem({ entry, presenter }: { entry: AuditLogEntry; presenter: AuditPresenter }) {
    const metadataLines = presenter.metadataLines?.(entry) ?? []
    const trace = [
        entry.source,
        entry.ipAddress ? `IP ${entry.ipAddress}` : null,
        entry.requestId ? `İstek ${entry.requestId}` : null,
    ].filter(Boolean)

    return (
        <li className="rounded-xl border bg-white p-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <Badge variant="outline" className={cn(ACTION_BADGE_CLASS[entry.action])}>
                    {AUDIT_ACTION_LABELS[entry.action]}
                </Badge>

                <span className="text-sm font-medium text-neutral-900">
                    {auditActorLabel(entry.actor)}
                </span>

                {entry.actor.groups.length > 0 && (
                    <span className="text-xs text-neutral-500">
                        {entry.actor.groups.map(groupLabel).join(", ")}
                    </span>
                )}

                <time dateTime={entry.createdAt} className="ml-auto text-xs text-neutral-500">
                    {formatAuditDateTime(entry.createdAt)}
                </time>
            </div>

            {entry.changes.length > 0 && (
                <dl className="mt-3 space-y-2">
                    {entry.changes.map((change) => (
                        <AuditChangeRow key={change.field} change={change} presenter={presenter} />
                    ))}
                </dl>
            )}

            {metadataLines.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-amber-700">
                    {metadataLines.map((line) => (
                        <li key={line}>{line}</li>
                    ))}
                </ul>
            )}

            <p className="mt-3 break-all border-t pt-2 text-[11px] text-neutral-400">
                {trace.join(" · ")}
            </p>
        </li>
    )
}

type Props = {
    entries: AuditLogEntry[]
    presenter: AuditPresenter
}

/** Denetim kayıtlarının listesi — modeli tanımaz; alan adlarını `presenter` verir. */
export function AuditLogTimeline({ entries, presenter }: Props) {
    return (
        <ol className="space-y-3">
            {entries.map((entry) => (
                <AuditLogItem key={entry.id} entry={entry} presenter={presenter} />
            ))}
        </ol>
    )
}
