"use client"

import { useMemo, useState } from "react"
import {
    AlertTriangle,
    Boxes,
    Gauge,
    PackageCheck,
    RotateCcw,
    Scale,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { CustomerPortalLoadGraphic } from "@/features/customerPortal/components/CustomerPortalLoadGraphic"
import { usePortalCartLoad } from "@/features/customerPortal/hooks/usePortalCartLoad"
import {
    findPortalCarrierLoad,
    type PortalCartCarrierId,
    type PortalCartLoadIssue,
} from "@/features/customerPortal/logistics/cartLoad"
import type { PortalRequestDraftItem } from "@/features/customerPortal/stores/usePortalRequestDraftStore"
import { cn } from "@/lib/utils"

type Props = {
    items: PortalRequestDraftItem[]
}

const VOLUME_FORMATTER = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
})

const WEIGHT_FORMATTER = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
})

function formatVolume(value: number) {
    return `${VOLUME_FORMATTER.format(value)} m³`
}

function formatFillPercent(value: number) {
    if (value > 0 && value < 1) return "%1'den az"
    return `%${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(value)}`
}

function formatIssueSummary(issues: readonly PortalCartLoadIssue[]) {
    const labels = new Set(issues.map((issue) => {
        switch (issue.status) {
            case "NO_ACTIVE_SUPPLIER":
                return "aktif koli profili yok"
            case "AMBIGUOUS_ACTIVE_SUPPLIER":
                return "aktif koli profili tekilleştirilemedi"
            case "INCOMPLETE_PACKAGE_DATA":
                return "koli adedi veya ölçüsü eksik"
            case "NOT_FOUND":
                return "varyant bulunamadı"
            case "PROFILE_MISSING":
                return "profil yanıtı eksik"
            default:
                return "koli bilgisi kullanılamıyor"
        }
    }))

    return [...labels].join("; ")
}

export function CustomerPortalLoadPlanner({ items }: Props) {
    const [manualCarrierId, setManualCarrierId] = useState<PortalCartCarrierId | null>(null)
    const { logisticsQuery, summary } = usePortalCartLoad(items)

    const fallbackLoad = useMemo(
        () => summary.carrierLoads.find((load) => load.requiredVehicleCount <= 1)
            ?? summary.carrierLoads[summary.carrierLoads.length - 1],
        [summary.carrierLoads],
    )
    const selectedCarrierId = manualCarrierId
        ?? summary.automaticLoad?.carrier.id
        ?? fallbackLoad.carrier.id
    const selectedLoad = findPortalCarrierLoad(summary, selectedCarrierId)
    const isAutomaticMode = manualCarrierId === null

    if (items.length === 0) return null

    if (logisticsQuery.isPending) {
        return (
            <div
                role="status"
                aria-live="polite"
                className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 motion-safe:animate-pulse"
            >
                <div className="h-4 w-44 rounded bg-neutral-200" />
                <div className="mt-4 h-36 rounded-2xl bg-neutral-100" />
                <span className="sr-only">Koli profilleri ve doluluk hesaplanıyor.</span>
            </div>
        )
    }

    if (logisticsQuery.isError) {
        return (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                    <div>
                        <div className="font-semibold">Doluluk şu anda hesaplanamadı</div>
                        <p className="mt-1 text-sm leading-6 text-amber-900">
                            Koli profili servisine ulaşılamadı. Sepetinizi düzenlemeye ve talebinizi oluşturmaya devam edebilirsiniz.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const selectedFillText = !summary.isComplete
        ? selectedLoad.requiredVehicleCount > 1
            ? `Bilinen en az hacim ${selectedLoad.requiredVehicleCount} araç gerektirir; eksik koli verisi nedeniyle kesin araç sayısı ve doluluk hesaplanamaz.`
            : `Bilinen en az hacim, ${selectedLoad.carrier.label} kapasitesinin ${formatFillPercent(selectedLoad.lastVehicleFillPercent)} kadarı; kesin sığma değerlendirmesi yapılamaz.`
        : selectedLoad.requiredVehicleCount > 1
            ? `${selectedLoad.requiredVehicleCount} araç gerekir; son araç ${formatFillPercent(selectedLoad.lastVehicleFillPercent)} dolu.`
            : summary.isComplete
            ? `${selectedLoad.carrier.label} hacminin ${formatFillPercent(selectedLoad.lastVehicleFillPercent)} kadarı.`
            : "Doluluk hesaplanamadı."

    return (
        <section
            aria-labelledby="portal-cart-load-title"
            className="overflow-hidden rounded-[26px] border border-neutral-200 bg-neutral-50"
        >
            <div className="border-b border-neutral-200 bg-white px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                            <Gauge className="h-4 w-4" aria-hidden="true" />
                            Hacim Planlayıcı
                        </div>
                        <h4 id="portal-cart-load-title" className="mt-1.5 text-base font-semibold text-neutral-950">
                            Sepetin taşıma kapasitesi karşılığı
                        </h4>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant={isAutomaticMode ? "secondary" : "outline"}
                        onClick={() => setManualCarrierId(null)}
                        className="rounded-full"
                    >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        Otomatik
                    </Button>
                </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.28fr)]">
                <div className="rounded-[22px] border border-neutral-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-xs font-medium text-neutral-500">
                                {isAutomaticMode && summary.automaticLoad ? "Hacme göre otomatik seçenek" : "Karşılaştırılan seçenek"}
                            </div>
                            <div className="mt-1 text-base font-semibold text-neutral-950">
                                {selectedLoad.carrier.label}
                            </div>
                        </div>
                        <div className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                            {!summary.isComplete
                                ? "Alt sınır "
                                : selectedLoad.requiredVehicleCount > 1
                                    ? "Son araç "
                                    : ""}
                            {formatFillPercent(selectedLoad.lastVehicleFillPercent)}
                        </div>
                    </div>

                    <CustomerPortalLoadGraphic
                        carrier={selectedLoad.carrier}
                        fillPercent={selectedLoad.lastVehicleFillPercent}
                        ariaValueText={selectedFillText}
                        className="mt-3"
                    />

                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-neutral-500">
                        <span>Planlama: {formatVolume(selectedLoad.carrier.capacityM3)}</span>
                        <span>{selectedLoad.carrier.referenceLabel}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Metric
                            icon={<Gauge className="h-4 w-4" />}
                            label={summary.isComplete ? "Hesaplanan hacim" : "Hesaplanabilen en az hacim"}
                            value={summary.hasKnownVolume ? formatVolume(summary.totalVolumeM3) : "—"}
                        />
                        <Metric
                            icon={<PackageCheck className="h-4 w-4" />}
                            label={summary.isComplete ? "Tam koli" : "Bilinen tam koli"}
                            value={summary.hasKnownVolume ? `${summary.totalPackages}` : "—"}
                        />
                        <Metric
                            icon={<Scale className="h-4 w-4" />}
                            label={summary.isWeightComplete ? "Tahmini brüt ağırlık" : "Bilinen brüt ağırlık"}
                            value={summary.hasKnownWeight ? `${WEIGHT_FORMATTER.format(summary.knownWeightKg)} kg` : "—"}
                        />
                        <Metric
                            icon={<Boxes className="h-4 w-4" />}
                            label="Araç sonucu"
                            value={summary.isComplete
                                ? `${selectedLoad.requiredVehicleCount} × ${selectedLoad.carrier.compactLabel}`
                                : "Kesinleştirilemedi"}
                        />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                                Beş seçeneği karşılaştır
                            </div>
                            {!isAutomaticMode ? (
                                <div className="text-xs text-neutral-500">Manuel karşılaştırma</div>
                            ) : null}
                        </div>
                        <div className="flex snap-x gap-2 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
                            {summary.carrierLoads.map((load) => {
                                const isSelected = load.carrier.id === selectedLoad.carrier.id
                                return (
                                    <button
                                        key={load.carrier.id}
                                        type="button"
                                        aria-pressed={isSelected}
                                        onClick={() => setManualCarrierId(load.carrier.id)}
                                        className={cn(
                                            "min-w-37 snap-start rounded-2xl border p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-brand/40 lg:min-w-0",
                                            isSelected
                                                ? "border-brand bg-brand/[0.07]"
                                                : "border-neutral-200 bg-white hover:border-neutral-300",
                                        )}
                                    >
                                        <div className="text-xs font-semibold text-neutral-950">
                                            {load.carrier.compactLabel}
                                        </div>
                                        <div className="mt-1 text-[11px] text-neutral-500">
                                            {formatVolume(load.carrier.capacityM3)} planlama
                                        </div>
                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                                            <div
                                                className="h-full rounded-full bg-brand"
                                                style={{ width: `${Math.min(100, load.lastVehicleFillPercent)}%` }}
                                            />
                                        </div>
                                        <div className="mt-1.5 text-[11px] font-medium text-neutral-700">
                                            {summary.hasKnownVolume
                                                ? summary.isComplete
                                                    ? load.requiredVehicleCount > 1
                                                        ? `${load.requiredVehicleCount} araç • son ${formatFillPercent(load.lastVehicleFillPercent)}`
                                                        : formatFillPercent(load.lastVehicleFillPercent)
                                                    : load.requiredVehicleCount > 1
                                                        ? `Bilinen hacim: en az ${load.requiredVehicleCount} araç`
                                                        : `Bilinen hacim: ${formatFillPercent(load.lastVehicleFillPercent)}`
                                                : "Veri bekleniyor"}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {summary.issues.length > 0 ? (
                        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-6 text-amber-950">
                            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                            <div>
                                <span className="font-semibold">{summary.issues.length} kalemin koli bilgisi hesaplamaya uygun değil.</span>{" "}
                                {formatIssueSummary(summary.issues)}. Gösterilen hacim yalnız hesaplanabilen en az değerdir;
                                herhangi bir araca sığma garantisi verilmez.
                            </div>
                        </div>
                    ) : selectedLoad.requiredVehicleCount > 1 ? (
                        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3.5 py-3 text-sm leading-6 text-sky-950">
                            Toplam hacim için <strong>{selectedLoad.requiredVehicleCount} adet {selectedLoad.carrier.compactLabel}</strong> gerekir.
                            Siluet son aracın {formatFillPercent(selectedLoad.lastVehicleFillPercent)} doluluğunu gösterir.
                        </div>
                    ) : null}

                    {!summary.isWeightComplete ? (
                        <div className="text-xs leading-5 text-neutral-500">
                            Ağırlık yalnız pozitif koli ağırlığı bulunan kalemlerden hesaplanır ve araç seçimini etkilemez.
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="border-t border-neutral-200 bg-white px-5 py-3 text-xs leading-5 text-neutral-500">
                Bu gösterge koli ölçülerinden hesaplanan hacim tahminidir. Fiziksel yerleşim, yön, istiflenebilirlik veya taşıma uygunluğu garantisi değildir.
            </div>
        </section>
    )
}

function Metric({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode
    label: string
    value: string
}) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-3">
            <div className="flex items-center gap-1.5 text-neutral-500">
                <span aria-hidden="true">{icon}</span>
                <span className="text-[11px] leading-4">{label}</span>
            </div>
            <div className="mt-2 text-sm font-semibold text-neutral-950">{value}</div>
        </div>
    )
}
