"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Loader2, Trash2, X } from "lucide-react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type Props = {
    selectedCount: number
    isDeleting: boolean
    onClear: () => void
    onDelete: () => void
}

/**
 * Toplu seçim işlem çubuğu — seçim varken beliren, tablonun ÜSTÜNDE duran şerit.
 *
 * Tablonun içine gömülmedi: seçim sayfa değiştirince korunuyor ve şeridin
 * kaydırmadan bağımsız görünür kalması gerekiyor.
 *
 * Silme geri alınamaz olduğu için onay diyaloğu şart; onayda kaç kaydın gideceği
 * ve engelli satırların ayrıca bildirileceği açıkça yazıyor.
 */
export function VariantSelectionBar({ selectedCount, isDeleting, onClear, onDelete }: Props) {
    const reduceMotion = useReducedMotion()

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
                    <span className="text-sm font-medium">
                        {selectedCount} varyant seçildi
                    </span>

                    <div className="flex items-center gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={onClear} disabled={isDeleting}>
                            <X className="mr-1 size-4" />
                            Seçimi temizle
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" size="sm" variant="destructive" disabled={isDeleting}>
                                    {isDeleting ? (
                                        <Loader2 className="mr-1 size-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="mr-1 size-4" />
                                    )}
                                    Sil
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        {selectedCount} varyant silinsin mi?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bu işlem geri alınamaz. Siparişte, iş talebinde, özel fiyatta,
                                        kampanyada veya müşteri atamasında kullanılan varyantlar
                                        silinmez — hangileri olduğu işlem sonunda bildirilir ve
                                        seçili kalırlar.
                                        <br />
                                        <br />
                                        Kullanılmayan ölçüler temizlenir ve ürünün varyant kodları
                                        yeniden hesaplanır.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                    <AlertDialogAction onClick={onDelete}>Sil</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
