import { z } from "zod"

/**
 * Kampanya formu. Tarihler `datetime-local` girdisinden geldiği için metin
 * tutulur, gönderimden hemen önce ISO'ya çevrilir.
 */
export const campaignFormSchema = z.object({
    title: z.string().trim().min(2, "Başlık en az 2 karakter olmalı").max(255),
    description: z.string().trim().max(5000).optional(),
    discountPercent: z
        .number({ message: "İndirim oranı zorunlu" })
        .min(0, "Oran 0'dan küçük olamaz")
        .max(100, "Oran 100'den büyük olamaz"),
    validFrom: z.string().optional(),
    validUntil: z.string().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ENDED"]),
}).superRefine((values, ctx) => {
    if (!values.validFrom || !values.validUntil) return

    if (new Date(values.validFrom) > new Date(values.validUntil)) {
        ctx.addIssue({
            code: "custom",
            path: ["validUntil"],
            message: "Bitiş tarihi başlangıçtan önce olamaz",
        })
    }
})

export type CampaignFormValues = z.infer<typeof campaignFormSchema>

/** `datetime-local` metnini ISO'ya çevirir; boş metin null olur. */
export function toIsoOrNull(value: string | undefined): string | null {
    if (!value?.trim()) return null

    const date = new Date(value)
    return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

/** ISO'yu `datetime-local` girdisinin beklediği biçime çevirir. */
export function toDateTimeLocal(value: string | null | undefined): string {
    if (!value) return ""

    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return ""

    const pad = (input: number) => String(input).padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
