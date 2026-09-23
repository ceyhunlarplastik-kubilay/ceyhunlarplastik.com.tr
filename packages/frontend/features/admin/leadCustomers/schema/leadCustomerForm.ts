import { z } from "zod"

import type {
    LeadCustomer,
    LeadCustomerProfileInput,
} from "@/features/admin/leadCustomers/api/types"
import {
    addDuplicatePhoneIssues,
    additionalPhonesFormSchema,
    toAdditionalPhoneFormValues,
    toAdditionalPhonesPayload,
} from "@/features/customerPhones/schema/customerPhonesForm"

/**
 * Veri girişi panelinin potansiyel müşteri formu.
 *
 * Ticari alanlar (iskonto, kredi limiti, vade, satış temsilcisi) ve `status`
 * BİLİNÇLİ olarak yok: bu yüzeyin işi kimlik + endüstriyel profil. Backend
 * şeması da onları tanımıyor, iki taraf aynı daralmayı paylaşır.
 */
export const leadCustomerFormSchema = z.object({
    // Kaydedilen şey bir FİRMA: firma adı zorunlu, yetkili sonradan öğrenilebilir.
    // Aynı unvanla birden çok firma olabilir; tekillik kontrolü YOK (bkz.
    // core/helpers/crm/customerDisplayName.ts).
    companyName: z.string().trim().min(2, "Firma adı en az 2 karakter olmalıdır").max(255),
    fullName: z.string().trim().max(255).optional().transform((value) => value || ""),
    // Doğrulama ve kanonikleştirme sunucuda (core/helpers/crm/customerWebsite.ts);
    // burada yalnız uzunluk sınırı var ki kural iki yerde ayrışmasın.
    websiteUrl: z.string().trim().max(500).optional().transform((value) => value || ""),
    phone: z.string().trim().min(5, "Telefon çok kısa").max(50),
    additionalPhones: additionalPhonesFormSchema,
    email: z.string()
        .trim()
        .max(320)
        .refine(
            (value) => !value || z.email().safeParse(value).success,
            "Geçerli bir e-posta adresi girin",
        ),
    note: z.string().trim().max(5000).optional().transform((value) => value || ""),
    sectorValueId: z.string().trim().optional().transform((value) => value || ""),
    productionGroupValueId: z.string().trim().optional().transform((value) => value || ""),
    usageAreaValueIds: z.array(z.string().trim()).default([]),
}).superRefine((values, ctx) => addDuplicatePhoneIssues(values, ctx))

export type LeadCustomerFormInput = z.input<typeof leadCustomerFormSchema>
export type LeadCustomerFormValues = z.output<typeof leadCustomerFormSchema>

export function createLeadCustomerFormDefaults(
    customer?: LeadCustomer | null,
): LeadCustomerFormInput {
    return {
        companyName: customer?.companyName ?? "",
        fullName: customer?.fullName ?? "",
        websiteUrl: customer?.websiteUrl ?? "",
        phone: customer?.phone ?? "",
        additionalPhones: toAdditionalPhoneFormValues(customer?.additionalPhones),
        email: customer?.email ?? "",
        note: customer?.note ?? "",
        sectorValueId: customer?.sectorValue?.id ?? "",
        productionGroupValueId: customer?.productionGroupValue?.id ?? "",
        usageAreaValueIds: customer?.usageAreaValues.map((value) => value.id) ?? [],
    }
}

export function buildLeadCustomerPayload(
    values: LeadCustomerFormValues,
): LeadCustomerProfileInput {
    return {
        companyName: values.companyName,
        // Boş bırakıldıysa null yazılır; şema artık nullable.
        fullName: values.fullName || null,
        websiteUrl: values.websiteUrl || null,
        phone: values.phone,
        // Formdaki TÜM ek numaralar gönderilir (tam değişim): silinen satır sunucuda da silinir.
        additionalPhones: toAdditionalPhonesPayload(values.additionalPhones),
        email: values.email || null,
        note: values.note || null,
        sectorValueId: values.sectorValueId || null,
        productionGroupValueId: values.productionGroupValueId || null,
        usageAreaValueIds: values.usageAreaValueIds,
    }
}
