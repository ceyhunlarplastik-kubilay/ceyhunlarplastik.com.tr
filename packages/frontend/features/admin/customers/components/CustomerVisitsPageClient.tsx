"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useCustomerVisits } from "@/features/admin/customers/hooks/useCustomerVisits"
import { useCreateCustomerVisit } from "@/features/admin/customers/hooks/useCreateCustomerVisit"
import { useDeleteCustomerVisit } from "@/features/admin/customers/hooks/useDeleteCustomerVisit"
import { useUsers } from "@/features/admin/users/hooks/useUsers"
import { getUserDisplayName } from "@/lib/users/displayName"

type Props = {
    customerId: string
}

export function CustomerVisitsPageClient({ customerId }: Props) {
    const visitsQuery = useCustomerVisits(customerId)
    const usersQuery = useUsers({ params: { page: 1, limit: 500 } })
    const createMutation = useCreateCustomerVisit(customerId)
    const deleteMutation = useDeleteCustomerVisit(customerId)

    const salesUsers = useMemo(
        () => (usersQuery.data?.data ?? []).filter((user) => user.groups.includes("sales") || user.groups.includes("sales_director") || user.groups.includes("admin") || user.groups.includes("owner")),
        [usersQuery.data?.data],
    )

    const [form, setForm] = useState({
        ownerUserId: "",
        scheduledAt: "",
        title: "",
        note: "",
        status: "PLANNED" as "PLANNED" | "COMPLETED" | "CANCELED",
    })

    async function handleCreate() {
        if (!form.ownerUserId || !form.scheduledAt || !form.title.trim()) {
            toast.error("Ziyaret için tarih, başlık ve sorumlu seçin")
            return
        }

        try {
            await createMutation.mutateAsync({
                ownerUserId: form.ownerUserId,
                scheduledAt: new Date(form.scheduledAt).toISOString(),
                title: form.title.trim(),
                note: form.note.trim() || null,
                status: form.status,
            })
            toast.success("Ziyaret planı eklendi")
            setForm({
                ownerUserId: "",
                scheduledAt: "",
                title: "",
                note: "",
                status: "PLANNED",
            })
        } catch {
            toast.error("Ziyaret planı eklenemedi")
        }
    }

    async function handleDelete(id: string) {
        try {
            await deleteMutation.mutateAsync(id)
            toast.success("Ziyaret kaydı silindi")
        } catch {
            toast.error("Ziyaret kaydı silinemedi")
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-neutral-950">Ziyaret Planlama</h2>
                    <p className="mt-1 text-sm text-neutral-500">
                        Planlı müşteri ziyaretlerini ekleyin ve ekip takibini görünür tutun.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Sorumlu</Label>
                        <Select value={form.ownerUserId || "__none__"} onValueChange={(value) => setForm((prev) => ({ ...prev, ownerUserId: value === "__none__" ? "" : value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sorumlu seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Sorumlu seçin</SelectItem>
                                {salesUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>{getUserDisplayName(user) || user.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Tarih</Label>
                        <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Başlık</Label>
                        <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Durum</Label>
                        <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as "PLANNED" | "COMPLETED" | "CANCELED" }))}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PLANNED">Planlandı</SelectItem>
                                <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                                <SelectItem value="CANCELED">İptal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Not</Label>
                        <Textarea rows={4} value={form.note} onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))} />
                    </div>
                </div>

                <div className="mt-5">
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                        {createMutation.isPending ? "Ekleniyor..." : "Ziyaret Ekle"}
                    </Button>
                </div>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-950">Planlı ve Tamamlanan Ziyaretler</h3>
                    {visitsQuery.isFetching ? <Spinner className="size-4" /> : null}
                </div>

                <div className="space-y-3">
                    {(visitsQuery.data ?? []).map((visit) => (
                        <div key={visit.id} className="rounded-2xl border border-neutral-200 p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium text-neutral-950">{visit.title}</div>
                                        <Badge variant={visit.status === "COMPLETED" ? "default" : visit.status === "CANCELED" ? "destructive" : "secondary"}>
                                            {visit.status === "COMPLETED" ? "Tamamlandı" : visit.status === "CANCELED" ? "İptal" : "Planlandı"}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-neutral-500">
                                        {new Date(visit.scheduledAt).toLocaleString("tr-TR")}
                                    </div>
                                    <div className="text-sm text-neutral-500">
                                        Sorumlu: {visit.ownerUser ? (getUserDisplayName(visit.ownerUser) || visit.ownerUser.email) : "-"}
                                    </div>
                                    {visit.note ? <div className="pt-2 text-sm text-neutral-700">{visit.note}</div> : null}
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleDelete(visit.id)} disabled={deleteMutation.isPending}>
                                    Sil
                                </Button>
                            </div>
                        </div>
                    ))}

                    {visitsQuery.isLoading ? (
                        <div className="flex min-h-[120px] items-center justify-center">
                            <Spinner className="size-5" />
                        </div>
                    ) : null}

                    {!visitsQuery.isLoading && (visitsQuery.data ?? []).length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-6 text-sm text-neutral-500">
                            Henüz ziyaret kaydı bulunmuyor.
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
