"use client"

import { Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { requestTypeMeta } from "@/features/customerPortal/components/requestComposer/schema"
import type { PortalBusinessRequestInput } from "@/features/businessRequests/api/types"

type Props = {
    requestType: PortalBusinessRequestInput["type"]
    assignedSalesUserLabel: string
    onSelect: (type: PortalBusinessRequestInput["type"]) => void
}

export function CustomerPortalRequestTypePicker({
    requestType,
    assignedSalesUserLabel,
    onSelect,
}: Props) {
    return (
        <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                        <Sparkles className="h-3.5 w-3.5" />
                        Talep Merkezi
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
                        Talep tipine gore dogru akis secin
                    </h2>
                    <p className="max-w-3xl text-sm leading-6 text-neutral-500">
                        Her talep ayni formu kullanmaz. Profil degisikligi musteri verisini, siparis ve fiyat talepleri sepet kalemlerini,
                        dokuman talepleri ise sadece ilgili belge ihtiyacini toplar.
                    </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                    Atanmış satış temsilcisi:
                    <span className="ml-1 font-medium text-neutral-900">{assignedSalesUserLabel}</span>
                </div>
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-4">
                {Object.entries(requestTypeMeta).map(([type, meta]) => {
                    const Icon = meta.icon
                    const isActive = type === requestType

                    return (
                        <button
                            key={type}
                            type="button"
                            onClick={() => onSelect(type as PortalBusinessRequestInput["type"])}
                            className={`rounded-2xl border p-4 text-left transition ${isActive
                                    ? "border-brand bg-brand/5 shadow-sm"
                                    : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                                }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className={`inline-flex rounded-2xl p-2 ${isActive ? "bg-brand text-white" : "bg-neutral-100 text-neutral-700"}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                {isActive ? <Badge>Aktif</Badge> : null}
                            </div>
                            <div className="mt-4 text-base font-semibold text-neutral-950">{meta.label}</div>
                            <p className="mt-2 text-sm leading-6 text-neutral-500">{meta.description}</p>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
