import { z } from "zod"
import type {
    CustomerVariantPaymentScheduleStep,
    CustomerVariantSpecialPrice,
} from "@/features/admin/customers/api/types"
import type { CustomerVariantSpecialPriceInput } from "@/features/admin/customers/api/customerVariantSpecialPrices"
import { PRICE_CURRENCY_OPTIONS } from "@/lib/pricing/currencies"

export type PaymentScheduleFormStep = {
    percentage: string
    paymentTermDays: string
    label: string
    note: string
}

export type CustomerSpecialPriceFormState = {
    productId: string
    productVariantId: string
    price: string
    currency: string
    minOrderQuantity: string
    maxOrderQuantity: string
    paymentPreset: "none" | "cash" | "30" | "60" | "custom"
    paymentTermDays: string
    paymentTermLabel: string
    paymentSchedule: PaymentScheduleFormStep[]
    validFrom: string
    validUntil: string
    taxIncluded: boolean
    deliveryTerm: string
    contractReference: string
    note: string
    internalNote: string
    isActive: boolean
}

export const emptyCustomerSpecialPriceForm: CustomerSpecialPriceFormState = {
    productId: "",
    productVariantId: "",
    price: "",
    currency: "TRY",
    minOrderQuantity: "",
    maxOrderQuantity: "",
    paymentPreset: "none",
    paymentTermDays: "",
    paymentTermLabel: "",
    paymentSchedule: [],
    validFrom: "",
    validUntil: "",
    taxIncluded: false,
    deliveryTerm: "",
    contractReference: "",
    note: "",
    internalNote: "",
    isActive: true,
}

export const defaultSplitPaymentSchedule: PaymentScheduleFormStep[] = [
    { percentage: "50", paymentTermDays: "0", label: "Peşin", note: "" },
    { percentage: "50", paymentTermDays: "30", label: "30 Gün", note: "" },
]

export function sanitizeIntegerInput(value: string) {
    return value.replace(/\D/g, "")
}

export function sanitizeDecimalInput(value: string) {
    const numeric = value.replace(/[^\d.,]/g, "")
    const separator = numeric.match(/[.,]/)?.[0]
    if (!separator) return numeric

    const [wholePart, ...decimalParts] = numeric.split(/[.,]/)
    return `${wholePart}${separator}${decimalParts.join("")}`
}

const currencyValues = PRICE_CURRENCY_OPTIONS.map((currency) => currency.value) as [string, ...string[]]

const paymentScheduleFormStepSchema = z.object({
    percentage: z.string(),
    paymentTermDays: z.string(),
    label: z.string(),
    note: z.string(),
})

function hasPaymentScheduleStepInput(step: PaymentScheduleFormStep) {
    return step.percentage.trim() || step.paymentTermDays.trim() || step.label.trim() || step.note.trim()
}

export const customerSpecialPriceFormSchema = z.object({
    productId: z.string(),
    productVariantId: z.string().min(1, "Ürün varyantı seçmelisiniz."),
    price: z.string().min(1, "Özel fiyat zorunludur."),
    currency: z.enum(currencyValues),
    minOrderQuantity: z.string(),
    maxOrderQuantity: z.string(),
    paymentPreset: z.enum(["none", "cash", "30", "60", "custom"]),
    paymentTermDays: z.string(),
    paymentTermLabel: z.string(),
    paymentSchedule: z.array(paymentScheduleFormStepSchema),
    validFrom: z.string(),
    validUntil: z.string(),
    taxIncluded: z.boolean(),
    deliveryTerm: z.string(),
    contractReference: z.string(),
    note: z.string(),
    internalNote: z.string(),
    isActive: z.boolean(),
}).superRefine((values, ctx) => {
    const price = parsePositiveNumber(values.price)
    if (!price) {
        ctx.addIssue({
            code: "custom",
            path: ["price"],
            message: "Özel fiyat 0'dan büyük olmalı.",
        })
    }

    const minOrderQuantity = parseOptionalInt(values.minOrderQuantity)
    const maxOrderQuantity = parseOptionalInt(values.maxOrderQuantity)
    if (values.minOrderQuantity.trim() && minOrderQuantity === null) {
        ctx.addIssue({
            code: "custom",
            path: ["minOrderQuantity"],
            message: "Minimum sipariş adedi pozitif tam sayı olmalı.",
        })
    }
    if (values.maxOrderQuantity.trim() && maxOrderQuantity === null) {
        ctx.addIssue({
            code: "custom",
            path: ["maxOrderQuantity"],
            message: "Maksimum sipariş adedi pozitif tam sayı olmalı.",
        })
    }
    if (minOrderQuantity && maxOrderQuantity && maxOrderQuantity < minOrderQuantity) {
        ctx.addIssue({
            code: "custom",
            path: ["maxOrderQuantity"],
            message: "Maksimum sipariş adedi minimumdan küçük olamaz.",
        })
    }

    const paymentTermDays = parseOptionalNonNegativeInt(values.paymentTermDays)
    if (values.paymentTermDays.trim() && paymentTermDays === null) {
        ctx.addIssue({
            code: "custom",
            path: ["paymentTermDays"],
            message: "Vade günü 0 veya pozitif tam sayı olmalı.",
        })
    }

    const paymentSchedule = values.paymentSchedule.filter(hasPaymentScheduleStepInput)
    if (paymentSchedule.length > 0) {
        const parsed = parseCustomerSpecialPricePaymentSchedule(paymentSchedule)
        if (parsed.error) {
            ctx.addIssue({
                code: "custom",
                path: ["paymentSchedule"],
                message: parsed.error,
            })
        }
    }

    if (values.validFrom && Number.isNaN(new Date(values.validFrom).getTime())) {
        ctx.addIssue({
            code: "custom",
            path: ["validFrom"],
            message: "Geçerlilik başlangıç tarihi geçerli değil.",
        })
    }
    if (values.validUntil && Number.isNaN(new Date(values.validUntil).getTime())) {
        ctx.addIssue({
            code: "custom",
            path: ["validUntil"],
            message: "Geçerlilik bitiş tarihi geçerli değil.",
        })
    }
    if (values.validFrom && values.validUntil) {
        const validFrom = new Date(values.validFrom)
        const validUntil = new Date(values.validUntil)
        if (
            !Number.isNaN(validFrom.getTime())
            && !Number.isNaN(validUntil.getTime())
            && validUntil.getTime() < validFrom.getTime()
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["validUntil"],
                message: "Geçerlilik bitiş tarihi başlangıçtan önce olamaz.",
            })
        }
    }
})

export type CustomerSpecialPriceFormValues = z.infer<typeof customerSpecialPriceFormSchema>

function toDateInput(value?: string | null) {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    return date.toISOString().slice(0, 10)
}

function toNumberInput(value?: number | null) {
    return value === null || value === undefined ? "" : String(value)
}

function resolvePaymentPreset(
    days?: number | null,
    label?: string | null,
): CustomerSpecialPriceFormState["paymentPreset"] {
    if (days === 0) return "cash"
    if (days === 30 && (!label || label === "30 Gün")) return "30"
    if (days === 60 && (!label || label === "60 Gün")) return "60"
    if (days !== null && days !== undefined) return "custom"
    return "none"
}

export function customerSpecialPriceFormFromRecord(
    specialPrice: CustomerVariantSpecialPrice,
): CustomerSpecialPriceFormState {
    const productId = specialPrice.productVariant?.productId ?? specialPrice.productVariant?.product?.id ?? ""

    return {
        productId,
        productVariantId: specialPrice.productVariantId,
        price: toNumberInput(specialPrice.price),
        currency: specialPrice.currency ?? "TRY",
        minOrderQuantity: toNumberInput(specialPrice.minOrderQuantity),
        maxOrderQuantity: toNumberInput(specialPrice.maxOrderQuantity),
        paymentPreset: resolvePaymentPreset(specialPrice.paymentTermDays, specialPrice.paymentTermLabel),
        paymentTermDays: toNumberInput(specialPrice.paymentTermDays),
        paymentTermLabel: specialPrice.paymentTermLabel ?? "",
        paymentSchedule: (specialPrice.paymentSchedule ?? []).map((step) => ({
            percentage: toNumberInput(step.percentage),
            paymentTermDays: toNumberInput(step.paymentTermDays),
            label: step.label,
            note: step.note ?? "",
        })),
        validFrom: toDateInput(specialPrice.validFrom),
        validUntil: toDateInput(specialPrice.validUntil),
        taxIncluded: specialPrice.taxIncluded,
        deliveryTerm: specialPrice.deliveryTerm ?? "",
        contractReference: specialPrice.contractReference ?? "",
        note: specialPrice.note ?? "",
        internalNote: specialPrice.internalNote ?? "",
        isActive: specialPrice.isActive,
    }
}

export function formatCustomerSpecialPriceDate(value?: string | null) {
    if (!value) return "Süresiz"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Süresiz"
    return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
}

export function formatCustomerSpecialPricePaymentTerm(days?: number | null, label?: string | null) {
    if (label) return label
    if (days === 0) return "Peşin"
    if (days === null || days === undefined) return "Vade yok"
    return `${days} Gün`
}

export function formatCustomerSpecialPricePaymentSchedule(specialPrice: CustomerVariantSpecialPrice) {
    if (!specialPrice.paymentSchedule?.length) {
        return formatCustomerSpecialPricePaymentTerm(specialPrice.paymentTermDays, specialPrice.paymentTermLabel)
    }

    return specialPrice.paymentSchedule
        .map((step) => `%${step.percentage.toLocaleString("tr-TR", {
            maximumFractionDigits: 2,
        })} ${step.label}`)
        .join(" + ")
}

export function primaryCustomerSpecialPriceProductImage(specialPrice: CustomerVariantSpecialPrice) {
    const productAssets = specialPrice.productVariant?.product?.assets ?? []
    return productAssets.find((asset) => asset.role === "PRIMARY")?.url
        ?? productAssets.find((asset) => asset.type === "IMAGE")?.url
        ?? "/placeholder.webp"
}

export function customerSpecialPriceVariantSubtitle(specialPrice: CustomerVariantSpecialPrice) {
    const variant = specialPrice.productVariant
    if (!variant) return "-"

    const color = variant.color?.name
    const measurements = (variant.measurements ?? [])
        .map((measurement) => `${measurement.measurementType.code}: ${measurement.value}${measurement.measurementType.baseUnit ? ` ${measurement.measurementType.baseUnit}` : ""}`)
        .join(" / ")

    return [color, measurements].filter(Boolean).join(" - ") || variant.name || "-"
}

export function parsePositiveNumber(value: string) {
    const parsed = Number(value.replace(",", "."))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function parseOptionalInt(value: string) {
    if (!value.trim()) return null
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null
}

export function parseOptionalNonNegativeInt(value: string) {
    if (!value.trim()) return null
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null
}

export function parseCustomerSpecialPricePaymentSchedule(
    steps: PaymentScheduleFormStep[],
): { paymentSchedule: CustomerVariantPaymentScheduleStep[] | null; error: string | null } {
    const filledSteps = steps.filter((step) =>
        step.percentage.trim() || step.paymentTermDays.trim() || step.label.trim() || step.note.trim()
    )
    if (filledSteps.length === 0) return { paymentSchedule: null, error: null }

    const paymentSchedule: CustomerVariantPaymentScheduleStep[] = []

    for (const [index, step] of filledSteps.entries()) {
        const percentage = Number(step.percentage.replace(",", "."))
        const paymentTermDays = Number(step.paymentTermDays)
        const label = step.label.trim()

        if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
            return { paymentSchedule: null, error: `${index + 1}. ödeme adımı için yüzde 0-100 aralığında olmalı.` }
        }
        if (!Number.isInteger(paymentTermDays) || paymentTermDays < 0) {
            return { paymentSchedule: null, error: `${index + 1}. ödeme adımı için vade günü 0 veya pozitif tam sayı olmalı.` }
        }
        if (!label) {
            return { paymentSchedule: null, error: `${index + 1}. ödeme adımı için etiket gerekli.` }
        }

        paymentSchedule.push({
            percentage,
            paymentTermDays,
            label,
            note: step.note.trim() || null,
        })
    }

    const total = paymentSchedule.reduce((sum, step) => sum + step.percentage, 0)
    if (Math.abs(total - 100) > 0.01) {
        return { paymentSchedule: null, error: "Ödeme planı adımlarının yüzde toplamı 100 olmalı." }
    }

    return { paymentSchedule, error: null }
}

export function buildCustomerSpecialPricePayload(
    values: CustomerSpecialPriceFormValues,
): CustomerVariantSpecialPriceInput & { productVariantId: string; price: number } {
    const paymentScheduleResult = parseCustomerSpecialPricePaymentSchedule(values.paymentSchedule)
    const hasPaymentSchedule = Boolean(paymentScheduleResult.paymentSchedule?.length)

    return {
        productVariantId: values.productVariantId,
        price: parsePositiveNumber(values.price) ?? 0,
        currency: values.currency,
        minOrderQuantity: parseOptionalInt(values.minOrderQuantity),
        maxOrderQuantity: parseOptionalInt(values.maxOrderQuantity),
        paymentTermDays: hasPaymentSchedule ? null : parseOptionalNonNegativeInt(values.paymentTermDays),
        paymentTermLabel: hasPaymentSchedule ? null : values.paymentTermLabel.trim() || null,
        paymentSchedule: paymentScheduleResult.paymentSchedule,
        validFrom: values.validFrom || null,
        validUntil: values.validUntil || null,
        taxIncluded: values.taxIncluded,
        deliveryTerm: values.deliveryTerm.trim() || null,
        contractReference: values.contractReference.trim() || null,
        note: values.note.trim() || null,
        internalNote: values.internalNote.trim() || null,
        isActive: values.isActive,
    }
}
