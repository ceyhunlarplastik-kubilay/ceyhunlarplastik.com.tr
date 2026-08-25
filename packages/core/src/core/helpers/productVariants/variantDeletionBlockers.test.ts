import { describe, expect, it } from "vitest"

import {
    describeVariantDeletionBlockers,
    planVariantDeletion,
} from "./variantDeletionBlockers"

const empty = {
    orderItems: 0, requestItems: 0, customerSpecialPrices: 0,
    campaignItems: 0, assignedToCustomers: 0,
}

describe("describeVariantDeletionBlockers", () => {
    it("kullanım yoksa boş döner", () => {
        expect(describeVariantDeletionBlockers(empty)).toEqual([])
    })

    it("her kullanımı sayısıyla açıklar", () => {
        expect(describeVariantDeletionBlockers({ ...empty, orderItems: 2, campaignItems: 1 }))
            .toEqual(["2 sipariş kalemi", "1 kampanya kalemi"])
    })

    it("alan sırası sabit — mesaj kayıttan kayda değişmesin", () => {
        const all = { orderItems: 1, requestItems: 1, customerSpecialPrices: 1, campaignItems: 1, assignedToCustomers: 1 }
        expect(describeVariantDeletionBlockers(all)).toEqual([
            "1 sipariş kalemi", "1 iş talebi kalemi", "1 özel fiyat",
            "1 kampanya kalemi", "1 müşteri ataması",
        ])
    })
})

describe("planVariantDeletion", () => {
    it("silinebilirleri ve engellileri ayırır", () => {
        const plan = planVariantDeletion([
            { id: "a", fullCode: "10.5.1.V1", counts: empty },
            { id: "b", fullCode: "10.5.2.V1", counts: { ...empty, orderItems: 3 } },
            { id: "c", fullCode: "10.5.3.V1", counts: empty },
        ])

        expect(plan.deletableIds).toEqual(["a", "c"])
        expect(plan.blocked).toEqual([
            { id: "b", fullCode: "10.5.2.V1", reason: "3 sipariş kalemi" },
        ])
    })

    it("hepsi engelliyse silinecek bir şey kalmaz", () => {
        const plan = planVariantDeletion([
            { id: "a", fullCode: "10.5.1.V1", counts: { ...empty, requestItems: 1 } },
        ])
        expect(plan.deletableIds).toEqual([])
        expect(plan.blocked).toHaveLength(1)
    })

    it("boş girdide boş plan üretir", () => {
        expect(planVariantDeletion([])).toEqual({ deletableIds: [], blocked: [] })
    })
})
