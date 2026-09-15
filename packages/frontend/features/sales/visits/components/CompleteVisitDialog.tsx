"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { useUpdateManagedCustomerVisit } from "@/features/sales/visits/hooks/useUpdateManagedCustomerVisit"
import { VISIT_OUTCOME_LABELS } from "@/features/sales/visits/lib/visitLabels"
import { resolveCustomerDisplayName } from "@core/helpers/crm/customerDisplayName"
import type { CustomerVisitOutcome, CustomerVisitReportItem } from "@/features/admin/customers/api/types"

type Props = {
    visit: CustomerVisitReportItem | null
    onOpenChange: (open: boolean) => void
}

export function CompleteVisitDialog({ visit, onOpenChange }: Props) {
    return (
        <Dialog open={Boolean(visit)} onOpenChange={(open) => { if (!open) onOpenChange(false) }}>
            <DialogContent className="max-w-md">
                {visit ? (
                    <Body key={visit.id} visit={visit} onDone={() => onOpenChange(false)} />
                ) : null}
            </DialogContent>
        </Dialog>
    )
}

function Body({ visit, onDone }: { visit: CustomerVisitReportItem; onDone: () => void }) {
    const [status, setStatus] = useState<"COMPLETED" | "CANCELED">("COMPLETED")
    const [outcome, setOutcome] = useState<CustomerVisitOutcome | "">("")
    const [note, setNote] = useState(visit.note ?? "")
    const [nextActionAt, setNextActionAt] = useState("")

    const updateMutation = useUpdateManagedCustomerVisit()

    async function handleSubmit() {
        try {
            await updateMutation.mutateAsync({
                customerId: visit.customerId,
                visitId: visit.id,
                status,
                note: note.trim() || null,
                ...(status === "COMPLETED" ? { outcome: outcome || null } : {}),
                ...(status === "COMPLETED" && nextActionAt
                    ? { nextActionAt: new Date(nextActionAt).toISOString() }
                    : {}),
            })
            toast.success(status === "COMPLETED" ? "Ziyaret tamamlandı" : "Ziyaret iptal edildi")
            onDone()
        } catch {
            toast.error("Ziyaret güncellenemedi")
        }
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>{visit.title}</DialogTitle>
                <DialogDescription>
                    {resolveCustomerDisplayName(visit.customer)} — {new Date(visit.scheduledAt).toLocaleString("tr-TR")}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant={status === "COMPLETED" ? "default" : "outline"}
                        onClick={() => setStatus("COMPLETED")}
                        className="flex-1"
                    >
                        Tamamlandı
                    </Button>
                    <Button
                        type="button"
                        variant={status === "CANCELED" ? "default" : "outline"}
                        onClick={() => setStatus("CANCELED")}
                        className="flex-1"
                    >
                        İptal Et
                    </Button>
                </div>

                {status === "COMPLETED" ? (
                    <div className="space-y-2">
                        <Label>Sonuç</Label>
                        <Select
                            value={outcome}
                            onValueChange={(value) => setOutcome(value as CustomerVisitOutcome)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sonuç seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(VISIT_OUTCOME_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : null}

                <div className="space-y-2">
                    <Label htmlFor="complete-visit-note">Not</Label>
                    <Textarea
                        id="complete-visit-note"
                        rows={4}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                    />
                </div>

                {status === "COMPLETED" ? (
                    <div className="space-y-2">
                        <Label htmlFor="complete-visit-next-action">Sonraki Takip Tarihi (opsiyonel)</Label>
                        <Input
                            id="complete-visit-next-action"
                            type="datetime-local"
                            value={nextActionAt}
                            onChange={(event) => setNextActionAt(event.target.value)}
                        />
                    </div>
                ) : null}
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onDone}>Vazgeç</Button>
                <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                </Button>
            </DialogFooter>
        </>
    )
}
