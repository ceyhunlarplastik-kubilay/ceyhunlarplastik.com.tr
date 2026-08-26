"use client"

import { useState } from "react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Geri alınamaz silmeler için onay diyaloğu.
 *
 * Tekil ve toplu silme AYNI bileşeni kullanır — yazarak onaylama mantığının
 * ikinci bir kopyası çıkmasın (AGENTS.md: ortak bileşeni genişlet).
 *
 * İki sertleştirme opsiyonel:
 *  - `itemNames`: silinecekler ADIYLA listelenir. Kullanıcı sayıya değil,
 *    gerçekte neyin gideceğine bakarak onaylamalı.
 *  - `confirmationPhrase`: ifade harfi harfine yazılmadan düğme açılmaz
 *    (AWS'in kaynak silmede istediği desen).
 */
type Props = {
    /** Diyaloğu açan düğme. */
    trigger: React.ReactNode
    title: React.ReactNode
    description: React.ReactNode
    onConfirm: () => void
    itemNames?: string[]
    confirmationPhrase?: string
    confirmLabel?: string
}

export function ConfirmDeleteDialog({
    trigger,
    title,
    description,
    onConfirm,
    itemNames,
    confirmationPhrase,
    confirmLabel = "Sil",
}: Props) {
    const [open, setOpen] = useState(false)
    const [typed, setTyped] = useState("")

    const confirmationSatisfied = !confirmationPhrase || typed.trim() === confirmationPhrase

    return (
        <AlertDialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                // Yazılan onay her açılışta SIFIRLANIR: bir önceki onay bir
                // sonraki silmeyi otomatik açmamalı. Effect yerine burada —
                // effect içinde senkron setState kaskad render tetikliyor.
                if (!next) setTyped("")
            }}
        >
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>

                {itemNames && itemNames.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto rounded-md border bg-neutral-50 p-3 text-sm dark:bg-neutral-900/40">
                        <ul className="space-y-1">
                            {itemNames.map((name, index) => (
                                <li key={`${name}-${index}`} className="truncate">
                                    {name}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}

                {confirmationPhrase ? (
                    <div className="space-y-2">
                        <Label htmlFor="confirm-delete-phrase" className="text-sm font-normal">
                            Onaylamak için{" "}
                            <span className="font-mono font-semibold">{confirmationPhrase}</span> yazın
                        </Label>
                        <Input
                            id="confirm-delete-phrase"
                            value={typed}
                            onChange={(event) => setTyped(event.target.value)}
                            placeholder={confirmationPhrase}
                            autoComplete="off"
                            aria-describedby="confirm-delete-hint"
                        />
                        <p id="confirm-delete-hint" className="sr-only">
                            Silme düğmesi, ifade birebir yazılana kadar devre dışıdır.
                        </p>
                    </div>
                ) : null}

                <AlertDialogFooter>
                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={!confirmationSatisfied}
                        onClick={(event) => {
                            // İfade yazılmadıysa diyalog KAPANMAMALI: varsayılan
                            // AlertDialogAction her tıklamada kapatır.
                            if (!confirmationSatisfied) {
                                event.preventDefault()
                                return
                            }
                            onConfirm()
                        }}
                    >
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
