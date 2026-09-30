import { QRCodeSVG } from "qrcode.react"

import { formatDateKey } from "@core/helpers/production/productionCalendar"
import type { LotDetail } from "@/features/production/lots/api/types"
import { formatLotShiftDay, formatLotTimeRange } from "@/features/production/lots/utils/lotFormat"

/**
 * Yazdırılabilir lot etiketi (100 × 70 mm). Renkler sabit siyah / beyaz — koyu temada da doğru
 * basılsın. QR lot ayrıntı sayfasının adresini taşır (alan adı çalışan ortamdan gelir).
 */
export function LotLabel({ lot, url }: { lot: LotDetail; url: string }) {
    const first = lot.outputs[0]
    return (
        <div
            className="flex h-[70mm] w-[100mm] flex-col gap-[2mm] overflow-hidden border border-black bg-white p-[4mm] font-sans text-black"
            style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
        >
            <div className="flex items-start justify-between gap-[3mm]">
                <div className="min-w-0 space-y-[1mm]">
                    <p className="text-[8pt] uppercase tracking-wide">Ceyhunlar Plastik · Üretim lotu</p>
                    <p className="text-[26pt] font-bold leading-none tabular-nums">{lot.lotNumber}</p>
                    <p className="text-[9pt]">{formatLotShiftDay(lot)} · {formatLotTimeRange(lot)}</p>
                </div>
                <QRCodeSVG value={url} size={96} level="M" marginSize={0} className="h-[24mm] w-[24mm] shrink-0" />
            </div>
            <div className="border-t border-black pt-[2mm] text-[10pt] leading-tight">
                <p className="font-semibold">{first?.productName}</p>
                <p className="font-mono">{first?.order?.variantCode ?? first?.sizeCode}</p>
                {lot.colorName ? (
                    <p className="flex items-center gap-[1.5mm]">
                        {lot.colorHex ? <span className="inline-block h-[3mm] w-[3mm] border border-black" style={{ backgroundColor: lot.colorHex }} /> : null}
                        {lot.colorName}
                    </p>
                ) : null}
            </div>
            <div className="mt-auto grid grid-cols-2 gap-x-[3mm] text-[8.5pt] leading-snug">
                <span>Makine: <b>{lot.job.machine.code}</b></span>
                <span>Kalıp: <b>{lot.job.mold.code}</b></span>
                {lot.outputs.map((output) => (
                    <span key={output.jobOutputId} className="col-span-2">
                        {output.sizeCode} · {output.plannedQuantity.toLocaleString("tr-TR")} adet
                        {output.order ? ` · ${output.order.orderNumber}${output.order.dueDate ? ` (termin ${formatDateKey(output.order.dueDate)})` : ""}` : " · yan ürün"}
                    </span>
                ))}
            </div>
        </div>
    )
}
