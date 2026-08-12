import { z } from "zod"

import type {
    LeadCustomer,
    LeadCustomerProfileInput,
} from "@/features/admin/leadCustomers/api/types"

/**
 * Veri girişi panelinin potansiyel müşteri formu.
 *
 * Ticari alanlar (iskonto, kredi limiti, vade, satış temsilcisi) ve `status`
 * BİLİNÇLİ olarak yok: bu yüzeyin işi kimlik + endüstriyel profil. Backend
 * şeması da onları tanımıyor, iki taraf aynı daralmayı paylaşır.
 */
export const leadCustomerFormSchema = z.object({
    companyName: z.string().trim().max(255).optional().transform((value) => value || ""),
    fullName: z.string().trim().min(2, "Yetkili adı en az 2 karakter olmalıdır").max(255),
    phone: z.string().trim().min(5, "Telefon çok kısa").max(50),
    email: z.email("Geçerli bir e-posta adresi girin"),
    note: z.string().trim().max(5000).optional().transform((value) => value || ""),
    sectorValueId: z.string().trim().optional().transform((value) => value || ""),
    productionGroupValueId: z.string().trim().optional().transform((value) => value || ""),
    usageAreaValueIds: z.array(z.string().trim()).default([]),
})

export type LeadCustomerFormInput = z.input<typeof leadCustomerFormSchema>
export type LeadCustomerFormValues = z.output<typeof leadCustomerFormSchema>

export function createLeadCustomerFormDefaults(
    customer?: LeadCustomer | null,
): LeadCustomerFormInput {
    return {
        companyName: customer?.companyName ?? "",
        fullName: customer?.fullName ?? "",
        phone: customer?.phone ?? "",
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
        companyName: values.companyName || null,
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        note: values.note || null,
        sectorValueId: values.sectorValueId || null,
        productionGroupValueId: values.productionGroupValueId || null,
        usageAreaValueIds: values.usageAreaValueIds,
    }
}
