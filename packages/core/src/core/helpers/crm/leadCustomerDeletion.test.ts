import { describe, expect, it } from "vitest"

import {
    describeLeadCustomerDeletionBlockers,
    planLeadCustomerDeletion,
} from "./leadCustomerDeletion"

const clean = { orders: 0, portalUsers: 0, businessRequests: 0 }
const lead = (id: string, name: string, counts = clean, isLead = true) =>
    ({ id, name, isLead, counts })

describe("describeLeadCustomerDeletionBlockers", () => {
    it("kullanım yoksa boş döner", () => {
        expect(describeLeadCustomerDeletionBlockers(clean)).toEqual([])
    })

    it("her kullanımı sayısıyla açıklar", () => {
        expect(describeLeadCustomerDeletionBlockers({ ...clean, orders: 2, portalUsers: 1 }))
            .toEqual(["2 sipariş", "1 portal kullanıcısı"])
    })

    it("alan sırası sabit — mesaj kayıttan kayda değişmesin", () => {
        expect(describeLeadCustomerDeletionBlockers({ orders: 1, portalUsers: 1, businessRequests: 1 }))
            .toEqual(["1 sipariş", "1 portal kullanıcısı", "1 iş talebi"])
    })
})

describe("planLeadCustomerDeletion", () => {
    it("temiz kayıtları siler, kullanımdakileri engeller", () => {
        const plan = planLeadCustomerDeletion([
            lead("a", "Aday A"),
            lead("b", "Aday B", { ...clean, orders: 3 }),
            lead("c", "Aday C"),
        ])

        expect(plan.deletableIds).toEqual(["a", "c"])
        expect(plan.blocked).toEqual([{ id: "b", name: "Aday B", reason: "3 sipariş" }])
    })

    it("cari müşteriye dönüşmüş kaydı bu yüzeyden SİLMEZ", () => {
        // LEAD sınırı: bu uç yalnız potansiyel müşterilere dokunur.
        const plan = planLeadCustomerDeletion([lead("x", "Cari X", clean, false)])
        expect(plan.deletableIds).toEqual([])
        expect(plan.blocked[0].reason).toBe("cari müşteriye dönüştürülmüş")
    })

    it("portal kullanıcısı olan aday engellenir — bağ SetNull ile sessizce kopardı", () => {
        const plan = planLeadCustomerDeletion([lead("p", "Aday P", { ...clean, portalUsers: 1 })])
        expect(plan.deletableIds).toEqual([])
        expect(plan.blocked[0].reason).toBe("1 portal kullanıcısı")
    })

    it("boş girdide boş plan üretir", () => {
        expect(planLeadCustomerDeletion([])).toEqual({ deletableIds: [], blocked: [] })
    })
})
