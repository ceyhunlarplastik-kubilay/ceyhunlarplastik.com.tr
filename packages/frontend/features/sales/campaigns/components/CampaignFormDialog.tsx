"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

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
import {
    CampaignVariantPicker,
    type PickedVariant,
} from "@/features/sales/campaigns/components/CampaignVariantPicker"
import {
    campaignFormSchema,
    toDateTimeLocal,
    toIsoOrNull,
    type CampaignFormValues,
} from "@/features/sales/campaigns/schema/campaignFormSchema"
import { parseDiscountPercent } from "@/features/sales/campaigns/lib/campaignDiscount"
import { useCreateCampaign, useUpdateCampaign } from "@/features/sales/campaigns/hooks/useCampaigns"
import type { ProductVariantCampaign } from "@/features/sales/campaigns/api/types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Doluysa düzenleme, boşsa oluşturma. */
    campaign?: ProductVariantCampaign | null
}

const STATUS_LABELS: Record<CampaignFormValues["status"], string> = {
    DRAFT: "Taslak",
    ACTIVE: "Yayında",
    PAUSED: "Duraklatıldı",
    ENDED: "Sonlandırıldı",
}

function toPickedVariants(campaign: ProductVariantCampaign | null | undefined): PickedVariant[] {
    return (campaign?.items ?? []).map((item) => ({
        productVariantId: item.productVariantId,
        fullCode: item.productVariant?.fullCode ?? item.productVariantId,
        productName: item.productVariant?.product?.name ?? "",
        discountPercent: parseDiscountPercent(item.discountPercent),
    }))
}

export function CampaignFormDialog({ open, onOpenChange, campaign }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
                {/*
                  Gövde `key` ile taze mount edilir: form ve seçili varyantlar
                  ilk değerlerini prop'tan alır, dolayısıyla "açılışta sıfırla"
                  effect'ine gerek kalmaz (effect içinde senkron setState
                  cascading render'a yol açıyor ve lint hata veriyor).
                */}
                {open ? (
                    <CampaignFormBody
                        key={campaign?.id ?? "new"}
                        campaign={campaign}
                        onDone={() => onOpenChange(false)}
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    )
}

function CampaignFormBody({
    campaign,
    onDone,
}: {
    campaign?: ProductVariantCampaign | null
    onDone: () => void
}) {
    const isEdit = Boolean(campaign)
    const [variants, setVariants] = useState<PickedVariant[]>(() => toPickedVariants(campaign))
    const [variantError, setVariantError] = useState<string | null>(null)

    const createMutation = useCreateCampaign()
    const updateMutation = useUpdateCampaign()
    const isPending = createMutation.isPending || updateMutation.isPending

    const form = useForm<CampaignFormValues>({
        resolver: zodResolver(campaignFormSchema),
        defaultValues: {
            title: campaign?.title ?? "",
            description: campaign?.description ?? "",
            discountPercent: parseDiscountPercent(campaign?.discountPercent) ?? 0,
            validFrom: toDateTimeLocal(campaign?.validFrom),
            validUntil: toDateTimeLocal(campaign?.validUntil),
            status: campaign?.status ?? "DRAFT",
        },
    })

    const onSubmit = form.handleSubmit(async (values) => {
        if (variants.length === 0) {
            setVariantError("En az bir ürün varyantı seçmelisiniz")
            return
        }
        setVariantError(null)

        const items = variants.map((variant) => ({
            productVariantId: variant.productVariantId,
            discountPercent: variant.discountPercent,
        }))

        const payload = {
            title: values.title,
            description: values.description?.trim() ? values.description : null,
            discountPercent: values.discountPercent,
            validFrom: toIsoOrNull(values.validFrom),
            validUntil: toIsoOrNull(values.validUntil),
            status: values.status,
            items,
        }

        if (isEdit && campaign) {
            await updateMutation.mutateAsync({ id: campaign.id, input: payload })
        } else {
            await createMutation.mutateAsync(payload)
        }

        onDone()
    })

    return (
        <>
            <DialogHeader>
                    <DialogTitle>{isEdit ? "Kampanyayı Düzenle" : "Yeni Kampanya"}</DialogTitle>
                    <DialogDescription>
                        Kampanya tüm müşterilere aynı indirimi açar. Müşteriye özel fiyatı olan
                        varyantlarda o müşterinin özel fiyatı geçerli kalır.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Label htmlFor="campaign-title">Başlık</Label>
                            <Input id="campaign-title" {...form.register("title")} className="mt-1.5" />
                            {form.formState.errors.title ? (
                                <p className="mt-1 text-xs text-red-600">{form.formState.errors.title.message}</p>
                            ) : null}
                        </div>

                        <div className="sm:col-span-2">
                            <Label htmlFor="campaign-description">Açıklama</Label>
                            <Textarea
                                id="campaign-description"
                                rows={3}
                                {...form.register("description")}
                                className="mt-1.5"
                            />
                        </div>

                        <div>
                            <Label htmlFor="campaign-discount">İndirim Oranı (%)</Label>
                            <Input
                                id="campaign-discount"
                                inputMode="decimal"
                                {...form.register("discountPercent", { valueAsNumber: true })}
                                className="mt-1.5"
                            />
                            {form.formState.errors.discountPercent ? (
                                <p className="mt-1 text-xs text-red-600">
                                    {form.formState.errors.discountPercent.message}
                                </p>
                            ) : null}
                        </div>

                        <div>
                            <Label htmlFor="campaign-status">Durum</Label>
                            <Controller
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger id="campaign-status" className="mt-1.5 w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div>
                            <Label htmlFor="campaign-valid-from">Başlangıç</Label>
                            <Input
                                id="campaign-valid-from"
                                type="datetime-local"
                                {...form.register("validFrom")}
                                className="mt-1.5"
                            />
                        </div>

                        <div>
                            <Label htmlFor="campaign-valid-until">Bitiş</Label>
                            <Input
                                id="campaign-valid-until"
                                type="datetime-local"
                                {...form.register("validUntil")}
                                className="mt-1.5"
                            />
                            {form.formState.errors.validUntil ? (
                                <p className="mt-1 text-xs text-red-600">
                                    {form.formState.errors.validUntil.message}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="space-y-2 rounded-2xl border border-neutral-200 p-4">
                        <div className="text-sm font-medium text-neutral-900">Kampanyaya Dahil Varyantlar</div>
                        <CampaignVariantPicker value={variants} onChange={setVariants} />
                        {variantError ? <p className="text-xs text-red-600">{variantError}</p> : null}
                    </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onDone}>
                        Vazgeç
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isEdit ? "Kaydet" : "Kampanyayı Oluştur"}
                    </Button>
                </DialogFooter>
            </form>
        </>
    )
}
