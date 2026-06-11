import type { BusinessRequest } from "@/features/businessRequests/api/types"
import { getUserDisplayName } from "@/lib/users/displayName"

type Props = {
    request: BusinessRequest
}

export function BusinessRequestActivityPanel({ request }: Props) {
    if ((request.activityLogs?.length ?? 0) === 0) return null

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="text-sm font-medium text-neutral-900">Aktivite Akışı</div>
            <div className="mt-3 space-y-3">
                {request.activityLogs?.slice(0, 5).map((log) => (
                    <div key={log.id} className="border-l border-neutral-200 pl-3">
                        <div className="text-sm font-medium text-neutral-900">{log.title}</div>
                        {log.description ? (
                            <div className="mt-1 text-xs leading-5 text-neutral-600">{log.description}</div>
                        ) : null}
                        <div className="mt-1 text-[11px] text-neutral-400">
                            {new Date(log.createdAt).toLocaleString("tr-TR")}
                            {log.actorUser
                                ? ` • ${getUserDisplayName(log.actorUser) || log.actorUser.email}`
                                : ""}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
