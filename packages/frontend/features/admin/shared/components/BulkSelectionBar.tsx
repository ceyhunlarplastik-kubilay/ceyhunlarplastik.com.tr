"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Loader2, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"

type Props = {
    selectedCount: number
    isDeleting: boolean
    onClear: () => void
    onDelete: () => void
    /** "3 varyant seçildi" / "3 potansiyel müşteri seçildi" */
    itemLabel: string
    /** Onay diyaloğunun gövdesi — neyin silinmeyeceğini yüzeye özel anlatır. */
    confirmDescription: React.ReactNode
    /**
     * Silinecek kayıtların adları. Verilirse onayda LİSTELENİR: kullanıcı sayıya
     * değil, gerçekte neyin gideceğine bakarak onaylamalı.
     */
    itemNames?: string[]
    /**
     * Verilirse kullanıcı bu ifadeyi HARFİ HARFİNE yazmadan silme düğmesi açılmaz
     * (AWS'in kaynak silmede istediği onay deseni). Geri alınamaz ve toplu olan
     * işlemlerde kaza eseri tıklamayı engeller.
     */
    confirmationPhrase?: string
    /** Silmenin yanındaki yüzeye özel toplu işlemler (ör. "Taslağa kopyala"). */
    actions?: React.ReactNode
    /**
     * Sayfalar arası "tümünü seç" (Gmail deseni): seçim yapılınca görünür sayfanın
     * ötesindeki satırları da seçmeyi önerir. Etiket yüzeyden gelir ("Filtredeki tümünü seç (40)").
     */
    selectAll?: { label: string; onSelect: () => void } | null
    /**
     * Uç tek istekte en fazla bu kadar kaydı silebiliyorsa: seçim aşınca Sil kapanır ve
     * neden yazılır — kullanıcı 400 almak yerine seçimi daraltır.
     */
    deleteLimit?: number
}

/**
 * Toplu seçim işlem çubuğu — seçim varken beliren, tablonun ÜSTÜNDE duran şerit.
 *
 * Varyant matrisi ve potansiyel müşteri listesi ORTAK kullanıyor; yeni bir toplu
 * seçim yüzeyi eklenirse paralel kopya yazmak yerine buraya bağlanmalı
 * (AGENTS.md: ortak bileşeni genişlet). Yüzeye özel toplu işlem `actions`'a,
 * sayfalar arası seçim `selectAll`'a, ucun istek sınırı `deleteLimit`'e verilir.
 *
 * Tablonun içine gömülmedi: seçim sayfa değiştirince korunuyor ve şeridin
 * kaydırmadan bağımsız görünür kalması gerekiyor.
 *
 * Silme geri alınamaz olduğu için onay diyaloğu şart; onayda kaç kaydın gideceği
 * ve engellilerin ayrıca bildirileceği açıkça yazıyor.
 */
export function BulkSelectionBar({
    selectedCount,
    isDeleting,
    onClear,
    onDelete,
    itemLabel,
    confirmDescription,
    itemNames,
    confirmationPhrase,
    actions,
    selectAll,
    deleteLimit,
}: Props) {
    const reduceMotion = useReducedMotion()
    const overDeleteLimit = deleteLimit !== undefined && selectedCount > deleteLimit

    return (
        <AnimatePresence>
            {selectedCount > 0 ? (
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-neutral-50 px-3 py-2 dark:bg-neutral-900/50"
                    role="status"
                    aria-live="polite"
                >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-sm font-medium">
                            {selectedCount} {itemLabel} seçildi
                        </span>
                        {selectAll ? (
                            <Button
                                type="button"
                                size="sm"
                                variant="link"
                                className="h-auto px-0"
                                onClick={selectAll.onSelect}
                                disabled={isDeleting}
                            >
                                {selectAll.label}
                            </Button>
                        ) : null}
                        {overDeleteLimit ? (
                            <span className="text-xs text-red-600 dark:text-red-400">
                                Tek seferde en fazla {deleteLimit} {itemLabel} silinebilir.
                            </span>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {actions}

                        <Button type="button" size="sm" variant="ghost" onClick={onClear} disabled={isDeleting}>
                            <X className="mr-1 size-4" />
                            Seçimi temizle
                        </Button>

                        <ConfirmDeleteDialog
                            trigger={
                                <Button type="button" size="sm" variant="destructive" disabled={isDeleting || overDeleteLimit}>
                                    {isDeleting ? (
                                        <Loader2 className="mr-1 size-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="mr-1 size-4" />
                                    )}
                                    Sil
                                </Button>
                            }
                            title={`${selectedCount} ${itemLabel} silinsin mi?`}
                            description={confirmDescription}
                            itemNames={itemNames}
                            confirmationPhrase={confirmationPhrase}
                            onConfirm={onDelete}
                        />
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
