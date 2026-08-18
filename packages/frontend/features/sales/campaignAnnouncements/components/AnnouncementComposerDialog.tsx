"use client"

import { useMemo, useState } from "react"
import { Check, Loader2, Search, Users, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import { useCampaigns } from "@/features/sales/campaigns/hooks/useCampaigns"
import { resolveCustomerDisplayName } from "@core/helpers/crm/customerDisplayName"
import { useCreateCampaignAnnouncement } from "@/features/sales/campaignAnnouncements/hooks/useCampaignAnnouncements"
import { CHANNEL_LABELS } from "@/features/sales/campaignAnnouncements/lib/announcementLabels"
import type { CampaignAnnouncementChannel } from "@/features/sales/campaignAnnouncements/api/types"
import { cn } from "@/lib/utils"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    /**
     * Kampanyalar sayfasından açıldığında kampanya bellidir. Duyurular
     * sayfasından açıldığında boş gelir ve dialog içinde seçilir — satış
     * temsilcisinin kampanya yönetim ekranına erişimi yok, duyuruyu buradan
     * başlatır.
     */
    campaign?: { id: string; title: string } | null
}

type PickedCustomer = {
    customerId: string
    name: string
    channel: CampaignAnnouncementChannel
}

export function AnnouncementComposerDialog({ open, onOpenChange, campaign }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
                {/* Gövde key ile taze mount edilir → "açılışta sıfırla" effect'i gerekmez. */}
                {open ? (
                    <ComposerBody
                        key={campaign?.id ?? "picker"}
                        presetCampaign={campaign ?? null}
                        onDone={() => onOpenChange(false)}
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    )
}

function ComposerBody({
    presetCampaign,
    onDone,
}: {
    presetCampaign: { id: string; title: string } | null
    onDone: () => void
}) {
    const [selectedCampaignId, setSelectedCampaignId] = useState(presetCampaign?.id ?? "")
    const [search, setSearch] = useState("")
    const [note, setNote] = useState("")
    const [defaultChannel, setDefaultChannel] = useState<CampaignAnnouncementChannel>("MANUAL")
    const [picked, setPicked] = useState<PickedCustomer[]>([])

    const createMutation = useCreateCampaignAnnouncement()

    // Kampanya seçici yalnız önceden belirlenmemişse gerekli; yayındakiler yeterli.
    const campaignsQuery = useCampaigns({ page: 1, limit: 100, status: "ACTIVE" })
    const campaigns = campaignsQuery.data?.data ?? []
    const campaignTitle = presetCampaign?.title
        ?? campaigns.find((item) => item.id === selectedCampaignId)?.title
        ?? ""

    // Uç zaten temsilcinin kendi portföyüyle sınırlı döner; ekstra filtre gerekmez.
    const customersQuery = useManagedCustomers({
        page: 1,
        limit: 100,
        search: search || undefined,
        status: "CUSTOMER",
    })
    const customers = customersQuery.data?.data ?? []

    const pickedIds = useMemo(
        () => new Set(picked.map((item) => item.customerId)),
        [picked],
    )

    const toggleCustomer = (customerId: string, name: string) => {
        if (pickedIds.has(customerId)) {
            setPicked(picked.filter((item) => item.customerId !== customerId))
            return
        }
        setPicked([...picked, { customerId, name, channel: defaultChannel }])
    }

    const submit = async () => {
        if (picked.length === 0 || !selectedCampaignId) return

        await createMutation.mutateAsync({
            campaignId: selectedCampaignId,
            note: note.trim() ? note.trim() : null,
            recipients: picked.map((item) => ({
                customerId: item.customerId,
                channel: item.channel,
            })),
        })

        onDone()
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Kampanya Duyurusu</DialogTitle>
                <DialogDescription>
                    {campaignTitle ? (
                        <>
                            <span className="font-medium text-neutral-900">{campaignTitle}</span> kampanyasını
                            hangi müşterilerinize duyuracağınızı seçin.{" "}
                        </>
                    ) : null}
                    Sistem otomatik ileti göndermez; liste oluşur, iletişimi siz kurup sonucu
                    buradan işaretlersiniz.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
                {!presetCampaign ? (
                    <div>
                        <Label htmlFor="announcement-campaign">Kampanya</Label>
                        <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                            <SelectTrigger id="announcement-campaign" className="mt-1.5 w-full">
                                <SelectValue placeholder="Yayındaki bir kampanya seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {campaigns.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Müşteri ara"
                            className="pl-9"
                        />
                    </div>

                    <div>
                        <Select
                            value={defaultChannel}
                            onValueChange={(value) => setDefaultChannel(value as CampaignAnnouncementChannel)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <ScrollArea className="h-65 rounded-2xl border border-neutral-200">
                    {customersQuery.isLoading ? (
                        <div className="flex h-65 items-center justify-center">
                            <Spinner className="size-4" />
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="flex h-65 flex-col items-center justify-center gap-2 text-sm text-neutral-500">
                            <Users className="h-7 w-7 text-neutral-400" />
                            Size atanmış müşteri bulunamadı
                        </div>
                    ) : (
                        <ul className="divide-y divide-neutral-100">
                            {customers.map((customer) => {
                                const isPicked = pickedIds.has(customer.id)
                                const name = resolveCustomerDisplayName(customer)

                                return (
                                    <li key={customer.id}>
                                        <button
                                            type="button"
                                            onClick={() => toggleCustomer(customer.id, name)}
                                            aria-pressed={isPicked}
                                            className={cn(
                                                "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition",
                                                isPicked ? "bg-brand/10" : "hover:bg-neutral-50",
                                            )}
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium text-neutral-900">
                                                    {name}
                                                </span>
                                                <span className="block truncate text-[11px] text-neutral-500">
                                                    {customer.email ?? customer.phone ?? "-"}
                                                </span>
                                            </span>
                                            <span
                                                className={cn(
                                                    "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                                                    isPicked
                                                        ? "border-brand bg-brand text-white"
                                                        : "border-neutral-300 bg-white",
                                                )}
                                            >
                                                {isPicked ? <Check className="h-3.5 w-3.5" /> : null}
                                            </span>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </ScrollArea>

                {picked.length > 0 ? (
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                                Seçilenler
                            </span>
                            <Badge variant="outline">{picked.length} müşteri</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {picked.map((item) => (
                                <div
                                    key={item.customerId}
                                    className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-1.5"
                                >
                                    <span className="max-w-40 truncate text-xs font-medium text-neutral-800">
                                        {item.name}
                                    </span>
                                    <Select
                                        value={item.channel}
                                        onValueChange={(value) =>
                                            setPicked(picked.map((candidate) =>
                                                candidate.customerId === item.customerId
                                                    ? { ...candidate, channel: value as CampaignAnnouncementChannel }
                                                    : candidate,
                                            ))
                                        }
                                    >
                                        <SelectTrigger className="h-7 w-33 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label={`${item.name} müşterisini çıkar`}
                                        onClick={() =>
                                            setPicked(picked.filter((c) => c.customerId !== item.customerId))
                                        }
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                <div>
                    <Label htmlFor="announcement-note">Duyuru Notu</Label>
                    <Textarea
                        id="announcement-note"
                        rows={2}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Bu duyuruda anlatılacaklar, hedef vb."
                        className="mt-1.5"
                    />
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onDone}>
                    Vazgeç
                </Button>
                <Button
                    type="button"
                    onClick={submit}
                    disabled={picked.length === 0 || !selectedCampaignId || createMutation.isPending}
                >
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Duyuru Listesi Oluştur
                </Button>
            </DialogFooter>
        </>
    )
}
