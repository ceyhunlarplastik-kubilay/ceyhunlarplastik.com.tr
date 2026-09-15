"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Search } from "lucide-react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { useManagedCustomers } from "@/features/sales/customers/hooks/useManagedCustomers"
import { useCreateManagedCustomerVisit } from "@/features/sales/visits/hooks/useCreateManagedCustomerVisit"
import { VISIT_TYPE_LABELS } from "@/features/sales/visits/lib/visitLabels"
import { resolveCustomerDisplayName } from "@core/helpers/crm/customerDisplayName"
import type { CustomerVisitType } from "@/features/admin/customers/api/types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateVisitDialog({ open, onOpenChange }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
                {/* Gövde key ile taze mount edilir → dialog her açılışta sıfırlanır. */}
                {open ? <ComposerBody key="create-visit" onDone={() => onOpenChange(false)} /> : null}
            </DialogContent>
        </Dialog>
    )
}

function ComposerBody({ onDone }: { onDone: () => void }) {
    const { data: session } = useSession()
    // DİKKAT: `session.user.id` Cognito sub'ıdır; `ownerUserId` DB `User.id`
    // FK'sına bağlanır — bu yüzden `dbUserId` kullanılmalı (bkz. lib/auth/auth.ts).
    const ownerUserId = session?.user?.dbUserId

    const [search, setSearch] = useState("")
    const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null)
    const [scheduledAt, setScheduledAt] = useState("")
    const [title, setTitle] = useState("")
    const [type, setType] = useState<CustomerVisitType>("IN_PERSON")
    const [note, setNote] = useState("")

    const customersQuery = useManagedCustomers({
        page: 1,
        limit: 20,
        search: search || undefined,
    })
    const customers = customersQuery.data?.data ?? []

    const createMutation = useCreateManagedCustomerVisit()

    async function handleSubmit() {
        if (!ownerUserId) {
            toast.error("Oturum bilgisi okunamadı, sayfayı yenileyin")
            return
        }
        if (!selectedCustomer) {
            toast.error("Bir müşteri seçin")
            return
        }
        if (!scheduledAt || !title.trim()) {
            toast.error("Tarih ve başlık zorunlu")
            return
        }

        try {
            await createMutation.mutateAsync({
                customerId: selectedCustomer.id,
                ownerUserId,
                scheduledAt: new Date(scheduledAt).toISOString(),
                title: title.trim(),
                note: note.trim() || null,
                type,
            })
            toast.success("Ziyaret planlandı")
            onDone()
        } catch {
            toast.error("Ziyaret planlanamadı")
        }
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Yeni Ziyaret Planla</DialogTitle>
                <DialogDescription>
                    Bir müşteri seçip ziyaret tarihini ve türünü belirleyin.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Müşteri</Label>
                    {selectedCustomer ? (
                        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                            <span className="font-medium text-emerald-900">{selectedCustomer.name}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                                Değiştir
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Müşteri ara"
                                    className="pl-9"
                                />
                            </div>
                            <ScrollArea className="h-48 rounded-xl border border-neutral-200">
                                {customersQuery.isLoading ? (
                                    <div className="flex h-48 items-center justify-center">
                                        <Spinner className="size-4" />
                                    </div>
                                ) : customers.length === 0 ? (
                                    <div className="flex h-48 items-center justify-center text-sm text-neutral-500">
                                        Müşteri bulunamadı
                                    </div>
                                ) : (
                                    <div className="divide-y divide-neutral-100">
                                        {customers.map((customer) => {
                                            const name = resolveCustomerDisplayName(customer)
                                            return (
                                                <button
                                                    key={customer.id}
                                                    type="button"
                                                    onClick={() => setSelectedCustomer({ id: customer.id, name })}
                                                    className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
                                                >
                                                    {name}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </ScrollArea>
                        </>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="visit-scheduled-at">Tarih</Label>
                        <Input
                            id="visit-scheduled-at"
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(event) => setScheduledAt(event.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Tür</Label>
                        <Select value={type} onValueChange={(value) => setType(value as CustomerVisitType)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(VISIT_TYPE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="visit-title">Başlık</Label>
                    <Input
                        id="visit-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Ör. Tanışma ziyareti"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="visit-note">Not</Label>
                    <Textarea
                        id="visit-note"
                        rows={4}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Ziyaret öncesi plan/gündem"
                    />
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onDone}>Vazgeç</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Kaydediliyor..." : "Ziyareti Planla"}
                </Button>
            </DialogFooter>
        </>
    )
}
