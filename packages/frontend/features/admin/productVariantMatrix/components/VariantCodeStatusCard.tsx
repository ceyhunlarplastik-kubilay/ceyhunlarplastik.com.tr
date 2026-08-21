"use client"

import { AlertTriangle, Loader2, Lock, LockOpen, RefreshCw } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Props = {
    lockedAt: string | null
    /** Kilit ve yeniden numaralandırma yalnız yöneticiye açıktır. */
    canManageCodes: boolean
    isLockPending: boolean
    isRenumberPending: boolean
    onToggleLock: (locked: boolean) => void
    onRenumber: () => void
}

export function VariantCodeStatusCard({
    lockedAt,
    canManageCodes,
    isLockPending,
    isRenumberPending,
    onToggleLock,
    onRenumber,
}: Props) {
    const isLocked = Boolean(lockedAt)

    return (
        <div className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    {isLocked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
                    <span className="font-medium">Kod durumu</span>
                    <Badge variant={isLocked ? "default" : "secondary"}>
                        {isLocked ? "Kilitli" : "Taslak"}
                    </Badge>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {isLocked
                        ? `Kodlar ${new Date(lockedAt as string).toLocaleDateString("tr-TR")} tarihinde kilitlendi. Yeni ölçüler artık araya girmez, sona eklenir.`
                        : "Taslak modda her kayıtta ölçüler küçükten büyüğe yeniden numaralanır. Giriş bitince kodları kilitleyin."}
                </p>
            </div>

            {canManageCodes ? (
                <div className="flex shrink-0 gap-2">
                    {isLocked ? (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={isLockPending}>
                                    <LockOpen className="mr-2 size-4" />
                                    Kilidi aç
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Kod kilidini aç</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Kilidi açmak mevcut kodları hemen değiştirmez. Ancak bundan sonraki her
                                        kayıtta ölçüler yeniden sıralanabilir; katalog veya tekliflerde geçen
                                        kodlar bu üründe artık kalıcı sayılmaz.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onToggleLock(false)}>
                                        Kilidi aç
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <Button size="sm" onClick={() => onToggleLock(true)} disabled={isLockPending}>
                            {isLockPending ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <Lock className="mr-2 size-4" />
                            )}
                            Kodları kilitle
                        </Button>
                    )}

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isRenumberPending}>
                                {isRenumberPending ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 size-4" />
                                )}
                                Yeniden numaralandır
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="size-4 text-amber-600" />
                                    Tüm kodları baştan ver
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Bu ürünün TÜM ölçü ve versiyon kodları küçükten büyüğe yeniden verilir ve
                                    kilit yok sayılır. Kodlar katalog, teklif veya siparişlerde geçtiyse
                                    geçmişle uyum bozulur. Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                <AlertDialogAction onClick={onRenumber}>
                                    Yine de yeniden numaralandır
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            ) : null}
        </div>
    )
}
