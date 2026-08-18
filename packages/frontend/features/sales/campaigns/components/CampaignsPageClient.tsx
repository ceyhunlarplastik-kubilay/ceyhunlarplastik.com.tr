"use client"

import { useState } from "react"
import { useQueryState } from "nuqs"
import { CalendarClock, Megaphone, Pencil, Plus, Search, Tag, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CampaignFormDialog } from "@/features/sales/campaigns/components/CampaignFormDialog"
import { AnnouncementComposerDialog } from "@/features/sales/campaignAnnouncements/components/AnnouncementComposerDialog"
import { useCampaigns, useDeleteCampaign } from "@/features/sales/campaigns/hooks/useCampaigns"
import {
    formatDiscountPercent,
    parseDiscountPercent,
    resolveCampaignValidity,
    resolveItemDiscountPercent,
} from "@/features/sales/campaigns/lib/campaignDiscount"
import type {
    ProductVariantCampaign,
    ProductVariantCampaignStatus,
} from "@/features/sales/campaigns/api/types"

const STATUS_LABELS: Record<ProductVariantCampaignStatus, string> = {
    DRAFT: "Taslak",
    ACTIVE: "Yayında",
    PAUSED: "Duraklatıldı",
    ENDED: "Sonlandırıldı",
}

const STATUS_STYLES: Record<ProductVariantCampaignStatus, string> = {
    DRAFT: "bg-neutral-100 text-neutral-700",
    ACTIVE: "bg-emerald-100 text-emerald-800",
    PAUSED: "bg-amber-100 text-amber-900",
    ENDED: "bg-neutral-200 text-neutral-600",
}

const VALIDITY_LABELS = {
    SCHEDULED: "Planlandı",
    CURRENT: "Süregelen",
    EXPIRED: "Süresi doldu",
} as const

function formatDate(value: string | null | undefined) {
    if (!value) return null
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return null

    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(date)
}

export function CampaignsPageClient() {
    const [search, setSearch] = useQueryState("q", { defaultValue: "" })
    const [status, setStatus] = useQueryState("durum", { defaultValue: "" })
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<ProductVariantCampaign | null>(null)
    const [announcing, setAnnouncing] = useState<ProductVariantCampaign | null>(null)

    const campaignsQuery = useCampaigns({
        page: 1,
        limit: 50,
        search: search || undefined,
        status: (status || undefined) as ProductVariantCampaignStatus | undefined,
    })
    const deleteMutation = useDeleteCampaign()

    const campaigns = campaignsQuery.data?.data ?? []

    const openCreate = () => {
        setEditing(null)
        setDialogOpen(true)
    }

    const openEdit = (campaign: ProductVariantCampaign) => {
        setEditing(campaign)
        setDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <div className="bg-linear-to-br from-neutral-950 via-neutral-900 to-brand px-5 py-6 text-white sm:px-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <Badge className="border-white/15 bg-white/10 text-white" variant="outline">
                                Satış
                            </Badge>
                            <h1 className="mt-4 flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                                <Megaphone className="h-6 w-6" />
                                Kampanyalı Ürün Varyantları
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-white/70">
                                Stok eritmek veya belirli varyantlarda satışı artırmak için kampanya tanımlayın.
                                Kampanya tüm müşterilere açıktır; müşteriye özel fiyatı olan varyantlarda o
                                müşterinin özel fiyatı geçerli kalır.
                            </p>
                        </div>

                        <Button type="button" onClick={openCreate} className="w-fit gap-2 bg-white text-neutral-950 hover:bg-white/90">
                            <Plus className="h-4 w-4" />
                            Yeni Kampanya
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 px-5 py-4 sm:px-7">
                    <div className="relative min-w-55 flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            value={search}
                            onChange={(event) => void setSearch(event.target.value || null)}
                            placeholder="Kampanya ara"
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={status || "ALL"}
                        onValueChange={(value) => void setStatus(value === "ALL" ? null : value)}
                    >
                        <SelectTrigger className="w-47.5">
                            <SelectValue placeholder="Durum" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tüm durumlar</SelectItem>
                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {campaignsQuery.isFetching ? <Spinner className="size-4" /> : null}
                </div>
            </section>

            {campaignsQuery.isLoading ? (
                <div className="flex min-h-70 items-center justify-center rounded-3xl border border-neutral-200 bg-white">
                    <Spinner className="size-5" />
                </div>
            ) : campaigns.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center shadow-sm">
                    <Tag className="mx-auto mb-3 h-8 w-8 text-neutral-400" />
                    <h2 className="text-base font-semibold text-neutral-950">Henüz kampanya yok</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                        Yeni kampanya oluşturup ürün varyantlarını ekleyin. Yayına almadan önce taslak
                        olarak bırakabilirsiniz.
                    </p>
                </div>
            ) : (
                <ul className="grid gap-4">
                    {campaigns.map((campaign) => {
                        const validity = resolveCampaignValidity(campaign.validFrom, campaign.validUntil)
                        const from = formatDate(campaign.validFrom)
                        const until = formatDate(campaign.validUntil)
                        const items = campaign.items ?? []

                        return (
                            <li
                                key={campaign.id}
                                className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge className={STATUS_STYLES[campaign.status]}>
                                                {STATUS_LABELS[campaign.status]}
                                            </Badge>
                                            <Badge variant="outline" className="gap-1.5">
                                                <Tag className="h-3.5 w-3.5" />
                                                {formatDiscountPercent(parseDiscountPercent(campaign.discountPercent))}
                                            </Badge>
                                            <Badge variant="outline">{VALIDITY_LABELS[validity]}</Badge>
                                            <Badge variant="secondary">{items.length} varyant</Badge>
                                        </div>

                                        <h2 className="mt-3 text-lg font-semibold text-neutral-950">
                                            {campaign.title}
                                        </h2>
                                        {campaign.description ? (
                                            <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
                                                {campaign.description}
                                            </p>
                                        ) : null}

                                        {from || until ? (
                                            <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
                                                <CalendarClock className="h-3.5 w-3.5" />
                                                {from ?? "Başlangıç yok"} — {until ?? "Bitiş yok"}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {campaign.status === "ACTIVE" ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="gap-1.5"
                                                onClick={() => setAnnouncing(campaign)}
                                            >
                                                <Megaphone className="h-3.5 w-3.5" />
                                                Duyur
                                            </Button>
                                        ) : null}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5"
                                            onClick={() => openEdit(campaign)}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Düzenle
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 text-red-700 hover:bg-red-50"
                                            disabled={deleteMutation.isPending}
                                            onClick={() => {
                                                if (!window.confirm(`"${campaign.title}" kampanyası silinsin mi?`)) return
                                                deleteMutation.mutate(campaign.id)
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Sil
                                        </Button>
                                    </div>
                                </div>

                                {items.length > 0 ? (
                                    <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
                                        {items.slice(0, 12).map((item) => {
                                            const percent = resolveItemDiscountPercent(
                                                campaign.discountPercent,
                                                item.discountPercent,
                                            )

                                            return (
                                                <span
                                                    key={item.id}
                                                    className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs"
                                                >
                                                    <span className="font-mono font-medium text-neutral-800">
                                                        {item.productVariant?.fullCode ?? item.productVariantId}
                                                    </span>
                                                    <span className="text-brand">{formatDiscountPercent(percent)}</span>
                                                </span>
                                            )
                                        })}
                                        {items.length > 12 ? (
                                            <span className="inline-flex items-center rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500">
                                                +{items.length - 12}
                                            </span>
                                        ) : null}
                                    </div>
                                ) : null}
                            </li>
                        )
                    })}
                </ul>
            )}

            <CampaignFormDialog open={dialogOpen} onOpenChange={setDialogOpen} campaign={editing} />

            <AnnouncementComposerDialog
                open={Boolean(announcing)}
                onOpenChange={(open) => { if (!open) setAnnouncing(null) }}
                campaign={announcing ? { id: announcing.id, title: announcing.title } : null}
            />
        </div>
    )
}
