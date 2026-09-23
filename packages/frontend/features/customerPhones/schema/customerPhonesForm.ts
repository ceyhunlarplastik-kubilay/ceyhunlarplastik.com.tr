import { z } from "zod"
import {
    CUSTOMER_ADDITIONAL_PHONE_LIMIT,
    CUSTOMER_PHONE_LABEL_MAX_LENGTH,
    customerPhoneKey,
    type CustomerAdditionalPhoneInput,
} from "@core/helpers/crm/customerPhones"
import type { CustomerPhone } from "@/features/customerPhones/types"

/**
 * Müşteri formlarındaki (admin/temsilci düzenleme + veri girişi) ek telefon
 * alanının şeması ve form ↔ API dönüşümleri. Birincil numara formun kendi
 * `phone` alanında kalır; burada yalnız EK numaralar var.
 *
 * Numarası BOŞ satır geçerlidir ve gönderilmez: "Telefon ekle"ye basıp boş
 * bırakmak kaydı engellememeli. Satır şemada süzülmez, payload'da atılır — aksi
 * hâlde hata mesajları yanlış satırın altında çıkardı (indeks kayması).
 */
export const additionalPhoneFormItemSchema = z.object({
    number: z.string().trim().max(50, "Telefon çok uzun"),
    label: z.string()
        .trim()
        .max(CUSTOMER_PHONE_LABEL_MAX_LENGTH, `Etiket en fazla ${CUSTOMER_PHONE_LABEL_MAX_LENGTH} karakter olabilir`),
}).superRefine((row, ctx) => {
    if (row.number && row.number.length < 5) {
        ctx.addIssue({ code: "custom", path: ["number"], message: "Telefon çok kısa" })
    }
    if (!row.number && row.label) {
        ctx.addIssue({ code: "custom", path: ["number"], message: "Etiketli satıra numara girin" })
    }
})

export const additionalPhonesFormSchema = z
    .array(additionalPhoneFormItemSchema)
    .max(CUSTOMER_ADDITIONAL_PHONE_LIMIT, `En fazla ${CUSTOMER_ADDITIONAL_PHONE_LIMIT} ek numara eklenebilir`)

export type AdditionalPhoneFormValue = z.input<typeof additionalPhoneFormItemSchema>

/** `CustomerPhonesField`'ın form bağlamından beklediği alanlar. */
export type CustomerPhonesFormFields = {
    phone: string
    additionalPhones: AdditionalPhoneFormValue[]
}

/**
 * Formun kök şemasına `superRefine` ile bağlanır (birincil numarayı da görmesi
 * gerektiği için satır şemasında olamaz). Anahtar sunucuyla AYNI
 * (`customerPhoneKey`): "0532 000 00 00" ile "+90 532 000 00 00" aynı hattır.
 * Sunucu tekrarı zaten sessizce atıyor; bu kontrol kullanıcıya NEDENİNİ gösterir.
 */
export function addDuplicatePhoneIssues(
    values: { phone: string; additionalPhones: ReadonlyArray<{ number: string }> },
    ctx: Pick<z.core.$RefinementCtx, "addIssue">,
) {
    const seenKeys = new Set<string>()
    const primary = values.phone.trim()
    if (primary) seenKeys.add(customerPhoneKey(primary))

    values.additionalPhones.forEach((row, index) => {
        const number = row.number.trim()
        if (!number) return

        const key = customerPhoneKey(number)
        if (seenKeys.has(key)) {
            ctx.addIssue({
                code: "custom",
                path: ["additionalPhones", index, "number"],
                message: "Bu numara zaten ekli",
            })
            return
        }

        seenKeys.add(key)
    })
}

export function toAdditionalPhoneFormValues(
    phones?: ReadonlyArray<Pick<CustomerPhone, "number" | "label">> | null,
): AdditionalPhoneFormValue[] {
    return (phones ?? []).map((phone) => ({
        number: phone.number,
        label: phone.label ?? "",
    }))
}

/** Boş satırlar atılır, boş etiket `null` olur; sıra korunur (sunucu `displayOrder` üretir). */
export function toAdditionalPhonesPayload(
    rows: ReadonlyArray<AdditionalPhoneFormValue>,
): CustomerAdditionalPhoneInput[] {
    return rows
        .map((row) => ({ number: row.number.trim(), label: row.label.trim() || null }))
        .filter((row) => row.number)
}
