import { describe, expect, it } from "vitest"

import {
    canSetProductionOrderStatusManually,
    describeProductionOrderDueDate,
    findProductionOrderIssues,
    formatProductionOrderNumber,
    isProductionOrderContentEditable,
    isProductionOrderDeletable,
    parseProductionOrderNumber,
} from "./productionOrders"

describe("emir numarası", () => {
    it("UE- önekiyle yazılır, önekli ya da öneksiz aranır", () => {
        expect(formatProductionOrderNumber(1001)).toBe("UE-1001")
        expect(parseProductionOrderNumber("UE-1001")).toBe(1001)
        expect(parseProductionOrderNumber(" ue1001 ")).toBe(1001)
        expect(parseProductionOrderNumber("1001")).toBe(1001)
        expect(parseProductionOrderNumber("10.5.8")).toBeNull()
    })
})

describe("durum kuralları", () => {
    it("elle yalnız taslak / beklemede / iptal arasında geçilir", () => {
        expect(canSetProductionOrderStatusManually("DRAFT", "ON_HOLD")).toBe(true)
        expect(canSetProductionOrderStatusManually("CANCELLED", "DRAFT")).toBe(true)
        expect(canSetProductionOrderStatusManually("DRAFT", "COMPLETED")).toBe(false)
        expect(canSetProductionOrderStatusManually("PLANNED", "CANCELLED")).toBe(false)
        expect(canSetProductionOrderStatusManually("DRAFT", "DRAFT")).toBe(false)
    })

    it("içerik yalnız taslak ve beklemedeyken değişir, yalnız taslak silinir", () => {
        expect(isProductionOrderContentEditable("ON_HOLD")).toBe(true)
        expect(isProductionOrderContentEditable("CANCELLED")).toBe(false)
        expect(isProductionOrderDeletable("DRAFT")).toBe(true)
        expect(isProductionOrderDeletable("CANCELLED")).toBe(false)
    })
})

describe("findProductionOrderIssues", () => {
    const valid = { quantity: 100_000, source: "MANUAL" as const }

    it("geçerli emri kabul eder", () => {
        expect(findProductionOrderIssues({ ...valid, dueDate: "2026-10-15", cycleTimeOverrideSec: 17.5 })).toEqual([])
    })

    it("adet, termin, müşteri ve elle çevrim kurallarını ilgili alanda verir", () => {
        expect(findProductionOrderIssues({
            quantity: 0,
            dueDate: "2026-02-30",
            source: "CUSTOMER_ORDER",
            customerId: null,
            cycleTimeOverrideSec: 0,
        }).map((issue) => issue.field)).toEqual(["quantity", "dueDate", "customerId", "cycleTimeOverrideSec"])
    })
})

describe("describeProductionOrderDueDate", () => {
    it("bugüne göre kalan / geciken günü yazar", () => {
        expect(describeProductionOrderDueDate("2026-09-30", "2026-09-25")).toMatchObject({ label: "5 gün kaldı", tone: "ok" })
        expect(describeProductionOrderDueDate("2026-09-27", "2026-09-25")).toMatchObject({ label: "2 gün kaldı", tone: "soon" })
        expect(describeProductionOrderDueDate("2026-09-26", "2026-09-25")).toMatchObject({ label: "Yarın" })
        expect(describeProductionOrderDueDate("2026-09-25", "2026-09-25")).toMatchObject({ label: "Bugün" })
        expect(describeProductionOrderDueDate("2026-09-23", "2026-09-25")).toMatchObject({ label: "2 gün gecikti", tone: "overdue", date: "23.09.2026" })
        expect(describeProductionOrderDueDate(null, "2026-09-25")).toBeNull()
    })
})
