import { describe, expect, it } from "vitest"

import { previewVariantCodes } from "./previewVariantCodes"
import type { MatrixRequirement, MatrixRow, MatrixSize, MatrixVersion } from "../api/types"

const req: MatrixRequirement = {
    id: "req-l", measurementTypeId: "mt-l", measurementCode: "L",
    label: "Uzunluk", unit: "cm", isRequired: true, sortPriority: 0, displayOrder: 0,
}

/** Ürünün sözlüğü: Siyah+PP bu ürün modelinde V1 olarak tanımlanmış. */
const versionDictionary = [
    { id: "v-1", code: 1, colorId: "color-black", materialIds: ["mat-pp"] },
]

const sizes: MatrixSize[] = [
    { id: "s-10", code: 1, values: [{ requirementId: "req-l", value: 10 }] },
    { id: "s-30", code: 2, values: [{ requirementId: "req-l", value: 30 }] },
]
const versions: MatrixVersion[] = [
    { id: "v-1", code: "V1", colorId: "color-black", materialIds: ["mat-pp"] },
]
const supplierCodes = [
    { id: "psc-a", supplierId: "sup-x", supplierName: "X", code: "A" },
]
const rows: MatrixRow[] = [
    { variantId: "var-10", fullCode: "10.5.1.V1", name: "", sizeId: "s-10", versionId: "v-1",
      suppliers: [{ id: "vs-1", supplierId: "sup-x", supplierCode: "A", fullCode: "10.5.1.V1.A", isActive: true }] },
    { variantId: "var-30", fullCode: "10.5.2.V1", name: "", sizeId: "s-30", versionId: "v-1", suppliers: [] },
]

function preview(draftRows: Parameters<typeof previewVariantCodes>[0]["draftRows"]) {
    return previewVariantCodes({
        productCode: "10.5",
        requirements: [req],
        sizes, versions, supplierCodes, rows,
        draftRows,
        versionDictionary,
    })
}

const draft = (value: number, supplierId?: string) => ({
    name: "x",
    measurements: [{ requirementId: "req-l", value }],
    colorId: "color-black",
    materialIds: ["mat-pp"],
    ...(supplierId ? { supplier: { supplierId } } : {}),
})

describe("previewVariantCodes", () => {
    it("taslak yoksa boş döner", () => {
        expect(preview([])).toEqual([])
    })

    it("kilitli üründe yeni ölçüyü sona ekler", () => {
        expect(preview([draft(40)])[0].fullCode).toBe("10.5.3.V1")
    })

    it("araya giren ölçü SONA eklenir, mevcut kodlar kaymaz", () => {
        // 10 (kod 1) ve 30 (kod 2) var; 20 araya girse de sıradaki numarayı alır.
        // Kod ile ölçü büyüklüğü arasında bağ YOK — sıralama sortKey ile yapılır.
        expect(preview([draft(20)])[0].fullCode).toBe("10.5.3.V1")
    })

    it("mevcut ölçüyü tekrar girince YENİ kod üretmez", () => {
        expect(preview([draft(10)])[0].fullCode).toBe("10.5.1.V1")
    })

    it("tedarikçili tam kodu üretir", () => {
        expect(preview([draft(40, "sup-x")])[0].supplierFullCode).toBe("10.5.3.V1.A")
    })

    it("yeni tedarikçiye sıradaki harfi verir", () => {
        expect(preview([draft(40, "sup-y")])[0].supplierFullCode).toBe("10.5.3.V1.B")
    })

    it("tedarikçi seçilmemişse tedarikçili kod null", () => {
        expect(preview([draft(40)])[0].supplierFullCode).toBeNull()
    })

    it("aynı ölçüyü iki tedarikçiyle girince ölçü kodu paylaşılır", () => {
        const result = preview([draft(40, "sup-x"), draft(40, "sup-y")])
        expect(result[0].fullCode).toBe("10.5.3.V1")
        expect(result[1].fullCode).toBe("10.5.3.V1")
        expect(result[0].supplierFullCode).toBe("10.5.3.V1.A")
        expect(result[1].supplierFullCode).toBe("10.5.3.V1.B")
    })

    it("sözlükte OLMAYAN kombinasyon için numara UYDURMAZ", () => {
        // Önce tanımlanmalı: numara burada uydurulursa sunucu satırı reddettiğinde
        // önizleme ile sonuç ayrışırdı. Kod üretilmez ve satır işaretlenir.
        const result = preview([{
            name: "x",
            measurements: [{ requirementId: "req-l", value: 10 }],
            colorId: undefined,
            materialIds: [],
        }])
        expect(result[0]).toEqual({ fullCode: null, supplierFullCode: null, versionDefined: false })
    })

    it("tanımsız satır, aynı yığındaki tanımlı satırların kodunu bozmaz", () => {
        const result = preview(
            [
                { name: "tanımsız", measurements: [{ requirementId: "req-l", value: 10 }], colorId: undefined, materialIds: [] },
                draft(20, "sup-x"),
            ],
        )
        expect(result[0].versionDefined).toBe(false)
        expect(result[1]).toMatchObject({ fullCode: "10.5.3.V1", supplierFullCode: "10.5.3.V1.A", versionDefined: true })
    })

    it("TANIMLI ama henüz kullanılmayan kombinasyonu tanımsız saymaz", () => {
        // Ürünün sözlüğünde Siyah+PP = V1. Hiçbir varyant onu kullanmıyor olsa
        // bile önizleme V1 demeli ve satır kaydedilebilir olmalı.
        const result = previewVariantCodes({
            productCode: "10.5",
            requirements: [req],
            sizes: [],
            versions: [],
            supplierCodes: [],
            rows: [],
            draftRows: [draft(10)],
            versionDictionary,
        })
        expect(result[0].fullCode).toBe("10.5.1.V1")
    })

    it("sözlük numaraları SEYREK olsa da olduğu gibi kullanılır", () => {
        // Silinen numara yeniden kullanılmadığı için boşluk kalabilir; önizleme
        // numarayı 1..N'e sıkıştırmaz, sözlükte ne yazıyorsa onu kullanır.
        const result = previewVariantCodes({
            productCode: "10.5",
            requirements: [req],
            sizes: [],
            versions: [],
            supplierCodes: [],
            rows: [],
            draftRows: [draft(10)],
            versionDictionary: [{ id: "v-23", code: 23, colorId: "color-black", materialIds: ["mat-pp"] }],
        })
        expect(result[0].fullCode).toBe("10.5.1.V23")
    })

    it("şablon yoksa sessizce null döner", () => {
        const result = previewVariantCodes({
            productCode: "10.5", requirements: [],
            sizes: [], versions: [], supplierCodes: [], rows: [],
            draftRows: [draft(10)], versionDictionary: [],
        })
        expect(result).toEqual([{ fullCode: null, supplierFullCode: null, versionDefined: true }])
    })

    it("tutarsız girdide çökmez", () => {
        const result = preview([{ name: "x", measurements: [{ requirementId: "yok", value: 1 }], materialIds: [] }])
        expect(result).toEqual([{ fullCode: null, supplierFullCode: null, versionDefined: true }])
    })
})

describe("previewVariantCodes — zorunlu ölçü grubu (1.23 senaryosu)", () => {
    // "1.23" modeli: R/D/H1 ZORUNLU, H2 (Civata Uzunluğu) OPSİYONEL.
    const r: MatrixRequirement = { id: "r", measurementTypeId: "mt-r", measurementCode: "R", label: "Elcik Çapı", unit: "mm", isRequired: true, sortPriority: 0, displayOrder: 0 }
    const d: MatrixRequirement = { id: "d", measurementTypeId: "mt-d", measurementCode: "D", label: "Burç Metriği", unit: "mm", isRequired: true, sortPriority: 1, displayOrder: 1 }
    const h1: MatrixRequirement = { id: "h1", measurementTypeId: "mt-h1", measurementCode: "H1", label: "Elcik Yüksekliği", unit: "mm", isRequired: true, sortPriority: 2, displayOrder: 2 }
    const h2: MatrixRequirement = { id: "h2", measurementTypeId: "mt-h2", measurementCode: "H2", label: "Civata Uzunluğu", unit: "mm", isRequired: false, sortPriority: 3, displayOrder: 3 }

    const dict = [{ id: "v-1", code: 1, colorId: "c-black", materialIds: ["m-bakalit"] }]

    function run(draftRows: Parameters<typeof previewVariantCodes>[0]["draftRows"]) {
        return previewVariantCodes({
            productCode: "1.23",
            requirements: [r, d, h1, h2],
            sizes: [],
            versions: [],
            supplierCodes: [],
            rows: [],
            draftRows,
            versionDictionary: dict,
        })
    }

    const row = (measurements: Array<{ requirementId: string; value: number }>, supplierId: string) => ({
        name: "x",
        measurements,
        colorId: "c-black",
        materialIds: ["m-bakalit"],
        supplier: { supplierId },
    })

    const required = [
        { requirementId: "r", value: 20 },
        { requirementId: "d", value: 5 },
        { requirementId: "h1", value: 16 },
    ]

    it("zorunlu ölçüleri aynı üç tedarikçi TEK ölçü kodu alır (1.23.1.V1.A/.B/.C)", () => {
        const result = run([
            row([...required, { requirementId: "h2", value: 11 }], "sup-a"), // Sanay Bakalit
            row([...required, { requirementId: "h2", value: 11 }], "sup-b"), // Özgen Plastik
            row([...required], "sup-c"), // Esersan — H2 girilmedi
        ])

        expect(result.map((entry) => entry.fullCode)).toEqual(["1.23.1.V1", "1.23.1.V1", "1.23.1.V1"])
        expect(result.map((entry) => entry.supplierFullCode)).toEqual([
            "1.23.1.V1.A",
            "1.23.1.V1.B",
            "1.23.1.V1.C",
        ])
    })

    it("opsiyonel ölçü FARKLI olsa da kod paylaşılır", () => {
        const result = run([
            row([...required, { requirementId: "h2", value: 11 }], "sup-a"),
            row([...required, { requirementId: "h2", value: 99 }], "sup-b"),
        ])
        expect(result[0].fullCode).toBe("1.23.1.V1")
        expect(result[1].fullCode).toBe("1.23.1.V1")
    })

    it("ZORUNLU ölçü farklıysa ayrı kod alır", () => {
        const result = run([
            row([...required], "sup-a"),
            row([{ requirementId: "r", value: 20 }, { requirementId: "d", value: 6 }, { requirementId: "h1", value: 16 }], "sup-b"),
        ])
        expect(result[0].fullCode).toBe("1.23.1.V1")
        expect(result[1].fullCode).toBe("1.23.2.V1")
    })
})
