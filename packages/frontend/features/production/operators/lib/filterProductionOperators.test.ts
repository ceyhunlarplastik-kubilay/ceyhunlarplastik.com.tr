import { describe, expect, it } from "vitest"

import type { ProductionOperator } from "@/features/production/operators/api/types"
import { buildProductionOperatorPayload } from "@/features/production/operators/schema/productionOperatorForm"
import { filterProductionOperators } from "./filterProductionOperators"

const operator = (overrides: Partial<ProductionOperator>) => ({
    id: "o",
    firstName: "Ahmet",
    lastName: "Yılmaz",
    employeeNo: null,
    phone: null,
    isActive: true,
    notes: null,
    ...overrides,
}) as ProductionOperator

const operators = [
    operator({ id: "demir", firstName: "Ali", lastName: "Demir", employeeNo: "CP-0007" }),
    operator({ id: "celik", firstName: "Şükrü", lastName: "Çelik", phone: "0532 111 22 33" }),
    operator({ id: "cengiz", firstName: "İsmail", lastName: "Cengiz", isActive: false }),
    operator({ id: "cakir", firstName: "Oya", lastName: "Cakır" }),
]

const ids = (list: ProductionOperator[]) => list.map((entry) => entry.id)

describe("filterProductionOperators", () => {
    it("aktifleri önce, sonra soyadını Türkçe harf sırasıyla dizer (C < Ç < D)", () => {
        expect(ids(filterProductionOperators(operators, { search: "", status: "" }))).toEqual([
            "cakir",
            "celik",
            "demir",
            "cengiz",
        ])
    })

    it("duruma göre daraltır", () => {
        expect(ids(filterProductionOperators(operators, { search: "", status: "pasif" }))).toEqual(["cengiz"])
        expect(ids(filterProductionOperators(operators, { search: "", status: "aktif" }))).not.toContain("cengiz")
    })

    it("Türkçe büyük/küçük harfle ad, sicil no ve biçimsiz telefonla arar", () => {
        expect(ids(filterProductionOperators(operators, { search: "ŞÜKRÜ", status: "" }))).toEqual(["celik"])
        expect(ids(filterProductionOperators(operators, { search: "ismail", status: "" }))).toEqual(["cengiz"])
        expect(ids(filterProductionOperators(operators, { search: "cp-0007", status: "" }))).toEqual(["demir"])
        expect(ids(filterProductionOperators(operators, { search: "05321112233", status: "" }))).toEqual(["celik"])
    })
})

describe("buildProductionOperatorPayload", () => {
    it("boş opsiyonel alanları null gönderir (alanı temizler)", () => {
        expect(buildProductionOperatorPayload({
            firstName: "Ahmet",
            lastName: "Yılmaz",
            employeeNo: "",
            phone: "",
            isActive: true,
            notes: "",
        })).toEqual({
            firstName: "Ahmet",
            lastName: "Yılmaz",
            employeeNo: null,
            phone: null,
            isActive: true,
            notes: null,
        })
    })
})
