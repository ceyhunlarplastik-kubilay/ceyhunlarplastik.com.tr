"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { LotDetail } from "@/features/production/lots/api/types"
import { lotDetailPath } from "@/features/production/lots/utils/lotFormat"
import { LotLabel } from "./LotLabel"

/**
 * Etiket önizleme + yazdır. Dialog açıkken etiketin bir kopyası `body` altına `.print-root`
 * olarak konur; yazdırmada yalnız o basılır (globals.css). Alan adı sabit yazılmaz: QR, sayfanın
 * açıldığı adresin kökünü kullanır.
 */
export function LotLabelDialog({ lot }: { lot: LotDetail }) {
    const [origin, setOrigin] = useState<string | null>(null)
    const open = origin !== null
    const url = `${origin ?? ""}${lotDetailPath(lot.lotNumber)}`

    return (
        <Dialog open={open} onOpenChange={(next) => setOrigin(next ? window.location.origin : null)}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" className="rounded-2xl">
                    <Printer className="h-4 w-4" />
                    Etiket
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-120">
                <DialogHeader>
                    <DialogTitle>Lot etiketi · {lot.lotNumber}</DialogTitle>
                    <DialogDescription>100 × 70 mm. Yazıcı ayarında kenar boşluğunu küçük, ölçeği %100 seçin.</DialogDescription>
                </DialogHeader>
                <div className="flex justify-center overflow-x-auto rounded-xl bg-muted/40 p-3">
                    <LotLabel lot={lot} url={url} />
                </div>
                <DialogFooter>
                    <Button type="button" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                        Yazdır
                    </Button>
                </DialogFooter>
                {open ? createPortal(<div className="print-root"><LotLabel lot={lot} url={url} /></div>, document.body) : null}
            </DialogContent>
        </Dialog>
    )
}
