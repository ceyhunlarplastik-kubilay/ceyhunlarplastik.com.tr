"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, Loader2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import type { IndustrialUsageFunctionsPayload } from "@/features/admin/industrialUsageFunctions/api/types"
import { UsageFunctionCoverageGrid } from "./UsageFunctionCoverageGrid"
import {
    buildUsageFunctionWorkbook,
    selectExportRows,
} from "@/features/admin/industrialUsageFunctions/lib/usageFunctionWorkbook"
import { orderedLocales } from "@/features/admin/industrialUsageFunctions/lib/usageFunctionWorkbookFormat"

type Props = {
    payload: IndustrialUsageFunctionsPayload
}

function downloadWorkbook(buffer: ArrayBuffer, fileName: string) {
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")

    anchor.href = url
    anchor.download = fileName
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
}

export function UsageFunctionExportCard({ payload }: Props) {
    const [onlyMissing, setOnlyMissing] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const exportRowCount = selectExportRows(payload, onlyMissing).length
    const localeCount = orderedLocales().length

    const handleExport = async () => {
        if (exportRowCount === 0) {
            toast.info("Dışa aktarılacak satır yok")
            return
        }

        setIsExporting(true)
        try {
            const { buffer, fileName, rowCount, localeCount: exportedLocaleCount } =
                await buildUsageFunctionWorkbook({ payload, onlyMissing })

            downloadWorkbook(buffer as ArrayBuffer, fileName)
            toast.success(`${rowCount} satır · ${exportedLocaleCount} dil sütunu indirildi`)
        } catch (error) {
            console.error("Kullanım fonksiyonu dosyası oluşturulamadı:", error)
            toast.error("Excel dosyası oluşturulamadı")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
                        <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-950">Dışa Aktar</h2>
                        <p className="max-w-2xl text-sm text-neutral-500">
                            Tek sayfa, {localeCount} dil <span className="font-medium text-neutral-700">yan yana sütun</span>{" "}
                            (1. sütun Türkçe, 2. sütun İngilizce). Her satırda kaynak Türkçe metin ile hedef diller aynı
                            hizada durur; sol taraftaki sektör, üretim grubu ve kullanım alanı sabitlenmiştir.
                        </p>
                    </div>
                </div>

                <Button
                    type="button"
                    onClick={handleExport}
                    disabled={isExporting || exportRowCount === 0}
                    className="rounded-2xl"
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    {isExporting ? "Hazırlanıyor" : "Excel İndir"}
                </Button>
            </div>

            <Separator className="my-4" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-neutral-700">
                    <Checkbox
                        checked={onlyMissing}
                        onCheckedChange={(checked) => setOnlyMissing(checked === true)}
                        className="mt-0.5"
                    />
                    <span>
                        Yalnızca eksik satırlar
                        <span className="block text-xs text-neutral-500">
                            En az bir dilde metni olmayan satırlar aktarılır.
                        </span>
                    </span>
                </label>

                <Badge variant="outline" className="w-fit rounded-full">
                    {exportRowCount} / {payload.rows.length} satır aktarılacak
                </Badge>
            </div>

            <div className="mt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Dil Doluluğu
                </div>
                <UsageFunctionCoverageGrid rows={payload.rows} />
            </div>

            <div className="mt-4 space-y-2 rounded-2xl border border-neutral-100 bg-neutral-50 px-3 py-2.5 text-xs leading-5 text-neutral-500">
                <p>
                    Ürün kimliği ve satır kimliği <span className="font-medium text-neutral-700">gizlenmiştir</span>;
                    sayfa koruması altında ürün bilgileri, başlıklar ve taksonomi sütunları değiştirilemez,
                    yalnız dil sütunları yazılabilir.
                </p>
                <p className="flex gap-1.5">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span>
                        Dosyayı <span className="font-medium text-neutral-700">Microsoft Excel</span> veya{" "}
                        <span className="font-medium text-neutral-700">LibreOffice Calc</span> ile doldurun.
                        Apple Numbers&apos;ın sayfa koruması özelliği yoktur ve dosyadaki korumayı yok sayar —
                        Numbers&apos;ta gizli alanları açıp bozmamaya dikkat edin.
                    </span>
                </p>
            </div>
        </section>
    )
}
