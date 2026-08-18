"use client"

import { useState } from "react"
import { Check, Loader2, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useUpdateAnnouncementRecipient } from "@/features/sales/campaignAnnouncements/hooks/useCampaignAnnouncements"
import {
    CHANNEL_LABELS,
    STATUS_LABELS,
    STATUS_STYLES,
} from "@/features/sales/campaignAnnouncements/lib/announcementLabels"
import type {
    CampaignAnnouncementRecipient,
    CampaignAnnouncementRecipientStatus,
} from "@/features/sales/campaignAnnouncements/api/types"

type Props = {
    announcementId: string
    recipient: CampaignAnnouncementRecipient
}

export function AnnouncementRecipientRow({ announcementId, recipient }: Props) {
    const [noteOpen, setNoteOpen] = useState(false)
    const updateMutation = useUpdateAnnouncementRecipient()

    const customerName = recipient.customer?.companyName || recipient.customer?.fullName || "Müşteri"

    const changeStatus = (status: CampaignAnnouncementRecipientStatus) => {
        updateMutation.mutate({ announcementId, recipientId: recipient.id, status })
    }

    return (
        <div className="grid gap-3 border-t border-neutral-100 px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1.4fr)_140px_180px_auto] sm:items-center">
            <div className="min-w-0">
                <div className="truncate text-sm font-medium text-neutral-900">{customerName}</div>
                <div className="truncate text-xs text-neutral-500">
                    {recipient.customer?.email ?? recipient.customer?.phone ?? "-"}
                </div>
            </div>

            <Badge variant="outline" className="w-fit font-normal">
                {CHANNEL_LABELS[recipient.channel]}
            </Badge>

            <Select
                value={recipient.status}
                onValueChange={(value) => changeStatus(value as CampaignAnnouncementRecipientStatus)}
                disabled={updateMutation.isPending}
            >
                <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
                <Badge className={STATUS_STYLES[recipient.status]}>
                    {STATUS_LABELS[recipient.status]}
                </Badge>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${customerName} için görüşme notu`}
                    aria-expanded={noteOpen}
                    onClick={() => setNoteOpen((value) => !value)}
                >
                    {updateMutation.isPending
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Pencil className="h-3.5 w-3.5" />}
                </Button>
            </div>

            {noteOpen ? (
                <div className="sm:col-span-4">
                    <NoteEditor
                        announcementId={announcementId}
                        recipient={recipient}
                        onDone={() => setNoteOpen(false)}
                    />
                </div>
            ) : recipient.note ? (
                <p className="text-xs leading-5 text-neutral-600 sm:col-span-4">
                    <span className="font-medium text-neutral-500">Görüşme notu: </span>
                    {recipient.note}
                </p>
            ) : null}
        </div>
    )
}

function NoteEditor({
    announcementId,
    recipient,
    onDone,
}: {
    announcementId: string
    recipient: CampaignAnnouncementRecipient
    onDone: () => void
}) {
    // Taze mount edildiği için ilk değer prop'tan alınır; sıfırlama effect'i yok.
    const [value, setValue] = useState(recipient.note ?? "")
    const updateMutation = useUpdateAnnouncementRecipient()

    const save = async () => {
        await updateMutation.mutateAsync({
            announcementId,
            recipientId: recipient.id,
            note: value.trim() ? value.trim() : null,
        })
        onDone()
    }

    return (
        <div className="space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <Textarea
                rows={2}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Görüşmede konuşulanlar, müşterinin dönüşü..."
                aria-label="Görüşme notu"
                className="bg-white"
            />
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={onDone}>
                    Vazgeç
                </Button>
                <Button type="button" size="sm" onClick={save} disabled={updateMutation.isPending}>
                    {updateMutation.isPending
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Check className="h-3.5 w-3.5" />}
                    Kaydet
                </Button>
            </div>
        </div>
    )
}
