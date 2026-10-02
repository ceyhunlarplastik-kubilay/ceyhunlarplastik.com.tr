import { describe, expect, it } from "vitest"

import { applyDraftPins, buildDraftsFromSelection, draftIdentityKey, type BulkCopyOptions } from "./buildDraftsFromSelection"
import { createEmptyDraftRow } from "../schema/variantMatrixSchema"
import type { MatrixRow, MatrixRowSupplier, MatrixSize } from "../api/types"

// Ürün 10.5: Kol çapı (r1) 10 / 12 / 15 ve 10*30 bileşik; V1 = Siyah + Bakalit kayıtlı.
const sizes: MatrixSize[] = [
    { id: "s10", code: 1, values: [{ requirementId: "r1", value: 10 }] },
    { id: "s12", code: 2, values: [{ requirementId: "r1", value: 12 }] },
    { id: "s15", code: 3, values: [{ requirementId: "r1", value: 15 }] },
    { id: "sComp", code: 4, values: [{ requirementId: "r1", value: 10, rawValue: "10-30" }] },
]

const ozgen = (overrides: Partial<MatrixRowSupplier> = {}): MatrixRowSupplier => ({
    id: "link-a",
    supplierId: "supA",
    supplierCode: "A",
    fullCode: null,
    isActive: true,
    supplierVariantCode: "AS231",
    hasSupplierLogo: true,
    price: 12.5,
    minOrderQty: 500,
    unitsPerPackage: 100,
    minLeadTimeDays: 14,
    ...overrides,
})

const row = (sizeId: string, versionId: string, suppliers: MatrixRowSupplier[] = [ozgen()]): MatrixRow => ({
    variantId: `var-${sizeId}-${versionId}`,
    fullCode: `10.5.x.${versionId}`,
    name: "Kol",
    sizeId,
    versionId,
    suppliers,
})

const v1Rows = [row("s10", "V1"), row("s12", "V1"), row("s15", "V1")]

const options = (overrides: Partial<BulkCopyOptions> = {}): BulkCopyOptions => ({
    targetVersionIds: ["V2"],
    supplierMode: { kind: "rowSuppliers" },
    copyCommercial: true,
    ...overrides,
})

const build = (input: {
    selectedRows?: MatrixRow[]
    allRows?: MatrixRow[]
    currentDrafts?: ReturnType<typeof createEmptyDraftRow>[]
    options?: Partial<BulkCopyOptions>
} = {}) =>
    buildDraftsFromSelection({
        selectedRows: input.selectedRows ?? v1Rows,
        allRows: input.allRows ?? v1Rows,
        sizes,
        currentDrafts: input.currentDrafts ?? [],
        options: options(input.options),
    })

describe("buildDraftsFromSelection", () => {
    it("seçili ölçüleri hedef versiyona taşır: ölçü metni, tedarikçi ve ticari bilgi", () => {
        const { drafts, skippedExisting, skippedDuplicate } = build()

        expect(drafts.map((draft) => [draft.measurements.r1, draft.versionId, draft.supplierId])).toEqual([
            ["10", "V2", "supA"],
            ["12", "V2", "supA"],
            ["15", "V2", "supA"],
        ])
        expect(drafts[0]).toMatchObject({
            price: "12.5",
            minOrderQty: "500",
            unitsPerPackage: "100",
            minLeadTimeDays: "14",
            hasSupplierLogo: true,
        })
        expect(skippedExisting).toBe(0)
        expect(skippedDuplicate).toBe(0)
    })

    it("tedarikçinin kendi ürün kodunu taşımaz — versiyona özgü", () => {
        const { drafts } = build()
        expect(drafts.every((draft) => draft.supplierVariantCode === undefined)).toBe(true)
    })

    it("bileşik ölçüyü yazıldığı gibi taşır", () => {
        const compound = row("sComp", "V1")
        const { drafts } = build({ selectedRows: [compound], allRows: [compound] })
        expect(drafts[0].measurements).toEqual({ r1: "10-30" })
    })

    it("birden çok hedef versiyon: önce versiyon, sonra satır sırası", () => {
        const { drafts } = build({ selectedRows: v1Rows.slice(0, 2), options: { targetVersionIds: ["V2", "V3"] } })
        expect(drafts.map((draft) => `${draft.measurements.r1}/${draft.versionId}`)).toEqual([
            "10/V2", "12/V2", "10/V3", "12/V3",
        ])
    })

    it("aynı ölçü + versiyon + tedarikçi kayıtlıysa atlar; tedarikçi farklıysa bağlantı eklenir", () => {
        const allRows = [...v1Rows, row("s10", "V2"), row("s12", "V2", [ozgen({ id: "link-b", supplierId: "supB" })])]
        const { drafts, skippedExisting } = build({ allRows })

        // s10/V2/supA kayıtlı → atlandı; s12/V2 kayıtlı ama supA bağlantısı yok → taslak (bağlantı eklenecek).
        expect(drafts.map((draft) => draft.measurements.r1)).toEqual(["12", "15"])
        expect(skippedExisting).toBe(1)
    })

    it("tedarikçisiz kopyada varyantın kayıtlı olması yeter", () => {
        const allRows = [...v1Rows, row("s10", "V2", [])]
        const { drafts, skippedExisting } = build({ allRows, options: { supplierMode: { kind: "none" } } })

        expect(drafts.map((draft) => [draft.measurements.r1, draft.supplierId])).toEqual([["12", undefined], ["15", undefined]])
        expect(drafts[0].price).toBeUndefined()
        expect(skippedExisting).toBe(1)
    })

    it("zaten taslakta olanı ve aynı kopyada ikinci kez üretileni atlar", () => {
        const existingDraft = createEmptyDraftRow({ measurements: { r1: "10" }, versionId: "V2", supplierId: "supA" })
        // s10'un V1 ve V3 satırları birlikte seçildi: ikisi de V2'ye aynı taslağı üretir.
        const selectedRows = [row("s10", "V1"), row("s10", "V3"), row("s12", "V1")]
        const { drafts, skippedDuplicate } = build({
            selectedRows,
            allRows: selectedRows,
            currentDrafts: [createEmptyDraftRow({ measurements: { r1: "12" }, versionId: "V2", supplierId: "supA" }), existingDraft],
        })

        expect(drafts).toEqual([])
        expect(skippedDuplicate).toBe(3)
    })

    it("aynı ölçünün farklı versiyonları birlikte seçilince hedefte bir kez üretir", () => {
        const selectedRows = [row("s10", "V1"), row("s10", "V3")]
        const { drafts, skippedDuplicate } = build({ selectedRows, allRows: selectedRows })

        expect(drafts.map((draft) => `${draft.measurements.r1}/${draft.versionId}`)).toEqual(["10/V2"])
        expect(skippedDuplicate).toBe(1)
    })

    it("satırdaki AKTİF her tedarikçi ayrı taslak; pasif bağlantı taşınmaz", () => {
        const multi = row("s10", "V1", [
            ozgen(),
            ozgen({ id: "link-b", supplierId: "supB", price: 9 }),
            ozgen({ id: "link-c", supplierId: "supC", isActive: false }),
        ])
        const { drafts } = build({ selectedRows: [multi], allRows: [multi] })

        expect(drafts.map((draft) => [draft.supplierId, draft.price])).toEqual([["supA", "12.5"], ["supB", "9"]])
    })

    it("aktif tedarikçisi olmayan satır tedarikçisiz kopyalanır", () => {
        const inactiveOnly = row("s10", "V1", [ozgen({ isActive: false })])
        const { drafts } = build({ selectedRows: [inactiveOnly], allRows: [inactiveOnly] })

        expect(drafts).toHaveLength(1)
        expect(drafts[0].supplierId).toBeUndefined()
    })

    it("belirli tedarikçi: ticari bilgi yalnız satırda o tedarikçinin bağlantısı varsa taşınır", () => {
        const withB = row("s10", "V1", [ozgen(), ozgen({ id: "link-b", supplierId: "supB", price: 9 })])
        const onlyA = row("s12", "V1")
        const { drafts } = build({
            selectedRows: [withB, onlyA],
            allRows: [withB, onlyA],
            options: { supplierMode: { kind: "supplier", supplierId: "supB" } },
        })

        expect(drafts.map((draft) => [draft.measurements.r1, draft.supplierId, draft.price])).toEqual([
            ["10", "supB", "9"],
            ["12", "supB", undefined],
        ])
    })

    it("ticari bilgi kapalıysa yalnız ölçü, versiyon ve tedarikçi taşınır", () => {
        const { drafts } = build({ options: { copyCommercial: false } })
        expect(drafts[0]).toMatchObject({ supplierId: "supA", price: undefined, minOrderQty: undefined, hasSupplierLogo: false })
    })

    it("hedef versiyon yoksa taslak üretmez", () => {
        expect(build({ options: { targetVersionIds: [] } }).drafts).toEqual([])
    })
})

describe("draftIdentityKey", () => {
    it("boş ölçüyü ve sırayı yok sayar, boşlukları kırpar", () => {
        const a = createEmptyDraftRow({ measurements: { r2: "4", r1: " 10 ", r3: "" }, versionId: "V2", supplierId: "supA" })
        const b = createEmptyDraftRow({ measurements: { r1: "10", r2: "4" }, versionId: "V2", supplierId: "supA" })
        expect(draftIdentityKey(a)).toBe(draftIdentityKey(b))
    })

    it("versiyon ya da tedarikçi farkı ayrı kimliktir", () => {
        const base = { measurements: { r1: "10" } }
        expect(draftIdentityKey(createEmptyDraftRow({ ...base, versionId: "V2" })))
            .not.toBe(draftIdentityKey(createEmptyDraftRow({ ...base, versionId: "V3" })))
        expect(draftIdentityKey(createEmptyDraftRow({ ...base, versionId: "V2", supplierId: "supA" })))
            .not.toBe(draftIdentityKey(createEmptyDraftRow({ ...base, versionId: "V2" })))
    })
})

describe("applyDraftPins", () => {
    const drafts = [
        createEmptyDraftRow({ measurements: { r1: "10" }, versionId: "V1", supplierId: "supA", price: "12" }),
        createEmptyDraftRow({ measurements: { r1: "12" }, versionId: "V3" }),
    ]

    it("sabit versiyonu ve tedarikçiyi tüm taslaklara uygular; diğer alanlara dokunmaz", () => {
        const pinned = applyDraftPins(drafts, { versionId: "V2", supplierId: "supB" })
        expect(pinned.map((draft) => [draft.versionId, draft.supplierId, draft.price])).toEqual([
            ["V2", "supB", "12"],
            ["V2", "supB", undefined],
        ])
    })

    it("yalnız sabitlenen alanı değiştirir; sabit yoksa aynen döner", () => {
        expect(applyDraftPins(drafts, { versionId: "V2" }).map((draft) => draft.supplierId)).toEqual(["supA", undefined])
        expect(applyDraftPins(drafts, {})).toEqual(drafts)
    })
})
