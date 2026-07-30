import { describe, expect, it } from "vitest"

import { productFormSchema } from "@/features/admin/products/schema/productFormSchema"
import type { ProductFormValues } from "@/features/admin/products/schema/productFormSchema"
import {
    buildProductUpdatePayload,
    serializeIndustrialUsages,
    serializeTranslations,
    serializeVideoUrl,
} from "./serializeProductPayload"

describe("serializeIndustrialUsages", () => {
    it("keeps locale-specific imageKey and drops preview-only imageUrl", () => {
        const [row] = serializeIndustrialUsages([
            {
                id: "usage-1",
                sectorValueId: null,
                productionGroupValueId: null,
                usageAreaValueId: null,
                usageFunction: "Türkçe açıklama",
                imageKey: "default.png",
                imageUrl: "https://cdn.example/default.png",
                displayOrder: 0,
                translations: [
                    {
                        locale: "en",
                        usageFunction: null,
                        imageKey: "products/x/industrial-usages/en/a.png",
                        imageUrl: "https://cdn.example/en/a.png",
                    },
                ],
            },
        ]) ?? []

        expect(row).not.toHaveProperty("imageUrl")
        expect(row.imageKey).toBe("default.png")
        expect(row.translations).toEqual([
            {
                locale: "en",
                usageFunction: null,
                imageKey: "products/x/industrial-usages/en/a.png",
            },
        ])
    })
})

describe("productFormSchema", () => {
    it("preserves industrial usage translation imageKey through validation", () => {
        // zodResolver submit'te değerleri bu şemadan geçiriyor; şemada beyan
        // edilmeyen her alan sessizce düşer, o yüzden burada açıkça doğrulanır.
        const parsed = productFormSchema.parse({
            name: "Ürün",
            code: "10.5",
            categoryId: "a8584ebc-67b9-4dc4-b7f3-bad75e93d073",
            industrialUsages: [
                {
                    id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                    usageFunction: "Türkçe açıklama",
                    imageKey: "default.png",
                    imageUrl: "https://cdn.example/default.png",
                    translations: [
                        {
                            locale: "en",
                            imageKey: "products/x/industrial-usages/en/a.png",
                            imageUrl: "https://cdn.example/en/a.png",
                        },
                    ],
                },
            ],
        })

        expect(parsed.industrialUsages?.[0].translations?.[0].imageKey).toBe(
            "products/x/industrial-usages/en/a.png",
        )
    })
})

describe("serializeTranslations", () => {
    it("drops empty target-locale translations but keeps Turkish", () => {
        expect(serializeTranslations([
            { locale: "tr", name: "Ürün" },
            { locale: "en", name: "   " },
        ])).toEqual([{ locale: "tr", name: "Ürün" }])
    })
})

describe("serializeVideoUrl", () => {
    it("turns blank input into null so the backend clears the column", () => {
        expect(serializeVideoUrl("   ")).toBeNull()
        expect(serializeVideoUrl("")).toBeNull()
    })

    it("leaves an omitted field undefined so a partial update cannot wipe it", () => {
        // Kritik: dirty-only gövdede gönderilmeyen alan null'a düşerse backend
        // kolonu temizler. undefined kalmalı ki JSON.stringify anahtarı atsın.
        expect(serializeVideoUrl(undefined)).toBeUndefined()
        expect(JSON.stringify({ assemblyVideoUrl: serializeVideoUrl(undefined) })).toBe("{}")
    })

    it("trims a provided url", () => {
        expect(serializeVideoUrl(" https://youtu.be/dQw4w9WgXcQ ")).toBe("https://youtu.be/dQw4w9WgXcQ")
    })
})

describe("buildProductUpdatePayload", () => {
    const data: ProductFormValues = {
        name: "Ürün",
        code: "10.5",
        description: "açıklama",
        categoryId: "a8584ebc-67b9-4dc4-b7f3-bad75e93d073",
        assemblyVideoUrl: "https://youtu.be/dQw4w9WgXcQ",
        promoVideoUrl: "",
        attributeValueIds: ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
        industrialUsages: [],
        translations: [],
    }

    it("sends only the video field when that is all the user touched", () => {
        expect(buildProductUpdatePayload(data, { assemblyVideoUrl: true })).toEqual({
            assemblyVideoUrl: "https://youtu.be/dQw4w9WgXcQ",
        })
    })

    it("carries whole arrays when anything inside them changed", () => {
        // RHF diziler için iç yapı verir (ör. [{ usageFunction: true }]); dizi
        // kısmi gönderilemediği için tamamı taşınır.
        const payload = buildProductUpdatePayload(data, {
            industrialUsages: [{ usageFunction: true }],
        })

        expect(payload).toEqual({ industrialUsages: [] })
    })

    it("falls back to the full payload when nothing looks dirty", () => {
        // Güvenlik ağı: kirli-alan takibi bir kez sessizce boş kalmıştı (RHF
        // formState Proxy aboneliği) ve istek 200 dönüp hiçbir şeyi değiştirmemişti.
        // Boş gövde göndermek yerine tam veri gönderilir.
        expect(buildProductUpdatePayload(data, {})).toEqual(data)
    })
})
