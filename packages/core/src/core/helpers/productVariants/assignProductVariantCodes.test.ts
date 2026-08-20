import { describe, expect, it } from "vitest"

import {
    assignProductVariantCodes,
    type PlannerSize,
    type PlannerVersion,
    type ProductVariantCodePlanInput,
} from "./assignProductVariantCodes"

/**
 * Kullanıcının uçtan uca senaryosu: "10.5" ürün modeli, tek ölçü (Uzunluk),
 * tek versiyon (siyah PP), iki tedarikçi.
 */
const black: PlannerVersion["color"] = { id: "color-black", system: "RAL", code: "9005" }
const white: PlannerVersion["color"] = { id: "color-white", system: "RAL", code: "9010" }
const polypropylene = { id: "mat-pp", code: "PP", name: "Polipropilen" }
const polyethylene = { id: "mat-pe", code: "PE", name: "Polietilen" }

function size(id: string, lengthCm: number, code: number | null = null): PlannerSize {
    // Tek ölçülü şablonda sortKey doğrudan uzunluktan türer; gerçek anahtar
    // üretimi sizeSignature.test.ts'te ayrıca test ediliyor.
    return {
        id,
        signature: `L#Uzunluk=${lengthCm.toFixed(4)}`,
        sortKey: `1${String(Math.round((lengthCm + 100_000) * 10_000)).padStart(10, "0")}`,
        code,
    }
}

function version(id: string, color: PlannerVersion["color"], materials: PlannerVersion["materials"], code: number | null = null): PlannerVersion {
    return {
        id,
        signature: `color:${color?.id ?? "none"}|materials:${materials.map((m) => m.id).sort().join(",")}`,
        code,
        color,
        materials,
    }
}

function baseInput(overrides: Partial<ProductVariantCodePlanInput> = {}): ProductVariantCodePlanInput {
    return {
        productCode: "10.5",
        isLocked: false,
        sizes: [],
        versions: [],
        supplierCodes: [],
        variants: [],
        ...overrides,
    }
}

describe("assignProductVariantCodes — taslak modu", () => {
    it("ölçüleri küçükten büyüğe 1..N numaralar", () => {
        const plan = assignProductVariantCodes(baseInput({
            sizes: [size("s-30", 30), size("s-10", 10), size("s-12", 12)],
        }))

        expect(plan.sizeCodeUpdates).toEqual([
            { id: "s-10", code: 1, previousCode: null },
            { id: "s-12", code: 2, previousCode: null },
            { id: "s-30", code: 3, previousCode: null },
        ])
    })

    it("araya giren ölçüde mevcut kodları YENİDEN sıralar", () => {
        // 10/12/30 girilmiş (1/2/3), sonra 11 cm ekleniyor.
        const plan = assignProductVariantCodes(baseInput({
            sizes: [size("s-10", 10, 1), size("s-12", 12, 2), size("s-30", 30, 3), size("s-11", 11)],
        }))

        const byId = Object.fromEntries(plan.sizeCodeUpdates.map((u) => [u.id, u.code]))
        expect(byId).toEqual({ "s-11": 2, "s-12": 3, "s-30": 4 })
        // 10 cm zaten 1'di — değişmediği için plana HİÇ girmez.
        expect(byId["s-10"]).toBeUndefined()
        expect(plan.requiresSizeRenumber).toBe(true)
    })

    it("hiçbir şey değişmiyorsa boş plan üretir", () => {
        const plan = assignProductVariantCodes(baseInput({
            sizes: [size("s-10", 10, 1), size("s-12", 12, 2)],
            versions: [version("v-1", black, [polypropylene], 1)],
        }))

        expect(plan.sizeCodeUpdates).toEqual([])
        expect(plan.versionCodeUpdates).toEqual([])
        expect(plan.requiresSizeRenumber).toBe(false)
    })

    it("versiyonları renk kodu, sonra hammadde kodu sırasına göre numaralar", () => {
        const plan = assignProductVariantCodes(baseInput({
            versions: [
                version("v-white-pp", white, [polypropylene]),
                version("v-black-pp", black, [polypropylene]),
                version("v-black-pe", black, [polyethylene]),
            ],
        }))

        expect(plan.versionCodeUpdates.map((u) => u.id)).toEqual(["v-black-pe", "v-black-pp", "v-white-pp"])
        expect(plan.versionCodeUpdates.map((u) => u.code)).toEqual([1, 2, 3])
    })
})

describe("assignProductVariantCodes — kilitli mod", () => {
    it("yeni ölçüyü SONA ekler, mevcut kodlara dokunmaz", () => {
        // Kilitten sonra 11 cm ekleniyor: araya girmez, 4 numarasını alır.
        const plan = assignProductVariantCodes(baseInput({
            isLocked: true,
            sizes: [size("s-10", 10, 1), size("s-12", 12, 2), size("s-30", 30, 3), size("s-11", 11)],
        }))

        expect(plan.sizeCodeUpdates).toEqual([{ id: "s-11", code: 4, previousCode: null }])
        expect(plan.requiresSizeRenumber).toBe(false)
    })

    it("kod boşluğunu doldurmaz", () => {
        const plan = assignProductVariantCodes(baseInput({
            isLocked: true,
            sizes: [size("s-10", 10, 1), size("s-30", 30, 5), size("s-40", 40)],
        }))

        expect(plan.sizeCodeUpdates).toEqual([{ id: "s-40", code: 6, previousCode: null }])
    })

    it("yeni versiyonu da sona ekler", () => {
        const plan = assignProductVariantCodes(baseInput({
            isLocked: true,
            versions: [version("v-white-pp", white, [polypropylene], 1), version("v-black-pp", black, [polypropylene])],
        }))

        expect(plan.versionCodeUpdates).toEqual([{ id: "v-black-pp", code: 2, previousCode: null }])
    })
})

describe("assignProductVariantCodes — tedarikçi harfleri", () => {
    it("ilk kullanım sırasına göre A, B, C verir", () => {
        const plan = assignProductVariantCodes(baseInput({
            supplierCodes: [
                { id: "psc-2", supplierId: "sup-y", code: null, sequence: 2 },
                { id: "psc-1", supplierId: "sup-x", code: null, sequence: 1 },
            ],
        }))

        expect(plan.supplierCodeUpdates).toEqual([
            { id: "psc-1", code: "A" },
            { id: "psc-2", code: "B" },
        ])
    })

    it("kilit AÇIKKEN bile mevcut harfi değiştirmez", () => {
        const plan = assignProductVariantCodes(baseInput({
            isLocked: false,
            supplierCodes: [
                { id: "psc-1", supplierId: "sup-x", code: "B", sequence: 1 },
                { id: "psc-2", supplierId: "sup-y", code: null, sequence: 2 },
            ],
        }))

        expect(plan.supplierCodeUpdates).toEqual([{ id: "psc-2", code: "C" }])
    })
})

describe("assignProductVariantCodes — varyant kodları", () => {
    const scenario = (isLocked: boolean) =>
        baseInput({
            isLocked,
            sizes: [size("s-10", 10, 1), size("s-12", 12, 2)],
            versions: [version("v-1", black, [polypropylene], 1)],
            supplierCodes: [
                { id: "psc-1", supplierId: "sup-x", code: "A", sequence: 1 },
                { id: "psc-2", supplierId: "sup-y", code: "B", sequence: 2 },
            ],
            variants: [
                {
                    id: "var-10",
                    sizeId: "s-10",
                    versionId: "v-1",
                    fullCode: null,
                    suppliers: [
                        { id: "vs-10-x", supplierId: "sup-x", fullCode: null, supplierCode: null },
                        { id: "vs-10-y", supplierId: "sup-y", fullCode: null, supplierCode: null },
                    ],
                },
                {
                    id: "var-12",
                    sizeId: "s-12",
                    versionId: "v-1",
                    fullCode: null,
                    suppliers: [{ id: "vs-12-x", supplierId: "sup-x", fullCode: null, supplierCode: null }],
                },
            ],
        })

    it("yeni biçimde kod üretir", () => {
        const plan = assignProductVariantCodes(scenario(true))

        expect(plan.variantCodeUpdates).toEqual([
            { id: "var-10", fullCode: "10.5.1.V1", previousFullCode: null },
            { id: "var-12", fullCode: "10.5.2.V1", previousFullCode: null },
        ])
    })

    it("aynı ölçüyü paylaşan iki tedarikçi TEK ölçü kodu alır, yalnız harf değişir", () => {
        const plan = assignProductVariantCodes(scenario(true))

        expect(plan.variantSupplierCodeUpdates).toEqual([
            { id: "vs-10-x", supplierCode: "A", fullCode: "10.5.1.V1.A", previousFullCode: null },
            { id: "vs-10-y", supplierCode: "B", fullCode: "10.5.1.V1.B", previousFullCode: null },
            { id: "vs-12-x", supplierCode: "A", fullCode: "10.5.2.V1.A", previousFullCode: null },
        ])
    })

    it("stats sayımları doğrudur", () => {
        expect(assignProductVariantCodes(scenario(true)).stats).toEqual({
            sizes: 2,
            versions: 1,
            supplierCodes: 2,
            variants: 2,
            variantSuppliers: 3,
        })
    })
})

describe("assignProductVariantCodes — tutarsız girdi", () => {
    it("bilinmeyen ölçü referansını reddeder", () => {
        expect(() =>
            assignProductVariantCodes(baseInput({
                versions: [version("v-1", black, [polypropylene], 1)],
                variants: [{ id: "var-1", sizeId: "yok", versionId: "v-1", fullCode: null, suppliers: [] }],
            })),
        ).toThrow(/unknown size/)
    })

    it("harfsiz tedarikçiyle varyant kodunu üretmeye kalkmaz", () => {
        expect(() =>
            assignProductVariantCodes(baseInput({
                isLocked: true,
                sizes: [size("s-10", 10, 1)],
                versions: [version("v-1", black, [polypropylene], 1)],
                variants: [{
                    id: "var-1",
                    sizeId: "s-10",
                    versionId: "v-1",
                    fullCode: null,
                    suppliers: [{ id: "vs-1", supplierId: "sup-z", fullCode: null, supplierCode: null }],
                }],
            })),
        ).toThrow(/without a product code/)
    })

    it("çakışan mevcut ölçü kodunu reddeder", () => {
        expect(() =>
            assignProductVariantCodes(baseInput({
                isLocked: true,
                sizes: [size("s-10", 10, 1), size("s-12", 12, 1)],
            })),
        ).toThrow(/duplicate size code/)
    })

    it("çakışan mevcut tedarikçi harfini reddeder", () => {
        expect(() =>
            assignProductVariantCodes(baseInput({
                supplierCodes: [
                    { id: "psc-1", supplierId: "sup-x", code: "A", sequence: 1 },
                    { id: "psc-2", supplierId: "sup-y", code: "A", sequence: 2 },
                ],
            })),
        ).toThrow(/duplicate supplier code/)
    })

    it("boş ürün kodunu reddeder", () => {
        expect(() => assignProductVariantCodes(baseInput({ productCode: "  " }))).toThrow(RangeError)
    })
})
