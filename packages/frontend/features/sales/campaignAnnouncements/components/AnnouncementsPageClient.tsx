"use client"

import { useState } from "react"
import { useQueryState } from "nuqs"
import { CalendarClock, Megaphone, Plus, Search, Users } from "lucide-react"

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
import { useCampaignAnnouncements } from "@/features/sales/campaignAnnouncements/hooks/useCampaignAnnouncements"
import { AnnouncementRecipientRow } from "@/features/sales/campaignAnnouncements/components/AnnouncementRecipientRow"
import { AnnouncementComposerDialog } from "@/features/sales/campaignAnnouncements/components/AnnouncementComposerDialog"
import {
    STATUS_LABELS,
    summarizeAnnouncement,
} from "@/features/sales/campaignAnnouncements/lib/announcementLabels"
import { useCampaigns } from "@/features/sales/campaigns/hooks/useCampaigns"
import type { CampaignAnnouncementRecipientStatus } from "@/features/sales/campaignAnnouncements/api/types"

function formatDate(value: string) {
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return "-"
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

export function AnnouncementsPageClient() {
    const [campaignId, setCampaignId] = useQueryState("kampanya", { defaultValue: "" })
    const [status, setStatus] = useQueryState("durum", { defaultValue: "" })
    const [customerSearch, setCustomerSearch] = useState("")
    const [composerOpen, setComposerOpen] = useState(false)

    const campaignsQuery = useCampaigns({ page: 1, limit: 100 })
    const campaigns = campaignsQuery.data?.data ?? []

    const announcementsQuery = useCampaignAnnouncements({
        page: 1,
        limit: 50,
        campaignId: campaignId || undefined,
        status: (status || undefined) as CampaignAnnouncementRecipientStatus | undefined,
    })
    const announcements = announcementsQuery.data?.data ?? []

    // Müşteri araması istemcide: liste zaten temsilcinin kendi duyurularıyla
    // sınırlı ve sayfa başına 50 kayıt — sunucuya ek filtre taşımaya değmez.
    const normalizedSearch = customerSearch.trim().toLocaleLowerCase("tr")
    const visibleAnnouncements = normalizedSearch
        ? announcements.filter((announcement) =>
            (announcement.recipients ?? []).some((recipient) => {
                const name = recipient.customer?.companyName || recipient.customer?.fullName || ""
                return name.toLocaleLowerCase("tr").includes(normalizedSearch)
            }),
        )
        : announcements

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <div className="bg-linear-to-br from-neutral-950 via-neutral-900 to-brand px-5 py-6 text-white sm:px-7">
                    <Badge className="border-white/15 bg-white/10 text-white" variant="outline">
                        Satış
                    </Badge>
                    <h1 className="mt-4 flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                        <Megaphone className="h-6 w-6" />
                        Kampanya Duyuruları
                    </h1>
                    <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <p className="max-w-3xl text-sm leading-6 text-white/70">
                            Müşterilerinize ilettiğiniz kampanyaların takip listesi. Sistem otomatik ileti
                            göndermez; iletişimi siz kurar, sonucu ve görüşme notunu buraya işlersiniz.
                        </p>

                        <Button
                            type="button"
                            onClick={() => setComposerOpen(true)}
                            className="w-fit gap-2 bg-white text-neutral-950 hover:bg-white/90"
                        >
                            <Plus className="h-4 w-4" />
                            Yeni Duyuru
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 px-5 py-4 sm:px-7">
                    <Select
                        value={campaignId || "ALL"}
                        onValueChange={(value) => void setCampaignId(value === "ALL" ? null : value)}
                    >
                        <SelectTrigger className="w-60">
                            <SelectValue placeholder="Kampanya" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tüm kampanyalar</SelectItem>
                            {campaigns.map((campaign) => (
                                <SelectItem key={campaign.id} value={campaign.id}>
                                    {campaign.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={status || "ALL"}
                        onValueChange={(value) => void setStatus(value === "ALL" ? null : value)}
                    >
                        <SelectTrigger className="w-45">
                            <SelectValue placeholder="Durum" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tüm durumlar</SelectItem>
                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative min-w-50 flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            value={customerSearch}
                            onChange={(event) => setCustomerSearch(event.target.value)}
                            placeholder="Müşteri adına göre süz"
                            className="pl-9"
                        />
                    </div>

                    {announcementsQuery.isFetching ? <Spinner className="size-4" /> : null}
                </div>
            </section>

            {announcementsQuery.isLoading ? (
                <div className="flex min-h-70 items-center justify-center rounded-3xl border border-neutral-200 bg-white">
                    <Spinner className="size-5" />
                </div>
            ) : visibleAnnouncements.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center shadow-sm">
                    <Users className="mx-auto mb-3 h-8 w-8 text-neutral-400" />
                    <h2 className="text-base font-semibold text-neutral-950">Duyuru bulunamadı</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                        &quot;Yeni Duyuru&quot; ile yayındaki bir kampanyayı seçip müşterilerinize
                        duyuru listesi oluşturabilirsiniz.
                    </p>
                </div>
            ) : (
                <ul className="grid gap-4">
                    {visibleAnnouncements.map((announcement) => {
                        const progress = summarizeAnnouncement(announcement)

                        return (
                            <li
                                key={announcement.id}
                                className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                                    <div className="min-w-0">
                                        <h2 className="text-base font-semibold text-neutral-950">
                                            {announcement.campaign?.title ?? "Kampanya"}
                                        </h2>
                                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                                            <CalendarClock className="h-3.5 w-3.5" />
                                            {formatDate(announcement.createdAt)}
                                            {announcement.createdByUser ? (
                                                <>
                                                    <span>·</span>
                                                    <span>
                                                        {[announcement.createdByUser.firstName, announcement.createdByUser.lastName]
                                                            .filter(Boolean).join(" ") || announcement.createdByUser.identifier}
                                                    </span>
                                                </>
                                            ) : null}
                                        </p>
                                        {announcement.note ? (
                                            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                                                {announcement.note}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary">{progress.total} müşteri</Badge>
                                        <Badge variant="outline">%{progress.contactedPercent} temas</Badge>
                                        {progress.responded > 0 ? (
                                            <Badge className="bg-emerald-100 text-emerald-800">
                                                {progress.responded} yanıt
                                            </Badge>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="border-t border-neutral-100 bg-neutral-50/40">
                                    {(announcement.recipients ?? []).map((recipient) => (
                                        <AnnouncementRecipientRow
                                            key={recipient.id}
                                            announcementId={announcement.id}
                                            recipient={recipient}
                                        />
                                    ))}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}

            <AnnouncementComposerDialog open={composerOpen} onOpenChange={setComposerOpen} />
        </div>
    )
}
