import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
    campaignAnnouncement: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
    },
    campaignAnnouncementRecipient: {
        findUnique: vi.fn(),
        update: vi.fn(),
    },
}))

vi.mock("@/core/db/prisma", () => ({ prisma: prismaMock }))

import { campaignAnnouncementRepository } from "./repository"

describe("campaignAnnouncementRepository", () => {
    beforeEach(() => {
        prismaMock.campaignAnnouncement.create.mockReset()
        prismaMock.campaignAnnouncement.findUnique.mockReset()
        prismaMock.campaignAnnouncement.findMany.mockReset()
        prismaMock.campaignAnnouncement.count.mockReset()
        prismaMock.campaignAnnouncementRecipient.update.mockReset()
        prismaMock.campaignAnnouncement.findMany.mockResolvedValue([])
        prismaMock.campaignAnnouncement.count.mockResolvedValue(0)
        prismaMock.campaignAnnouncement.findUnique.mockResolvedValue({ id: "ann-1" })
        prismaMock.campaignAnnouncement.create.mockResolvedValue({ id: "ann-1" })
    })

    it("alıcıları kanallarıyla birlikte yazar", async () => {
        await campaignAnnouncementRepository().createAnnouncement({
            campaignId: "camp-1",
            createdByUserId: "rep-1",
            recipients: [
                { customerId: "c1", channel: "MANUAL" },
                { customerId: "c2", channel: "EMAIL" },
            ],
        })

        const call = prismaMock.campaignAnnouncement.create.mock.calls[0][0]
        expect(call.data.recipients.create).toEqual([
            { customerId: "c1", channel: "MANUAL" },
            { customerId: "c2", channel: "EMAIL" },
        ])
    })

    it("aynı müşteri iki kez gelirse tekilleştirir", async () => {
        await campaignAnnouncementRepository().createAnnouncement({
            campaignId: "camp-1",
            createdByUserId: "rep-1",
            recipients: [
                { customerId: "c1", channel: "MANUAL" },
                { customerId: "c1", channel: "EMAIL" },
                { customerId: "c2", channel: "MANUAL" },
            ],
        })

        const call = prismaMock.campaignAnnouncement.create.mock.calls[0][0]
        expect(call.data.recipients.create.map((r: { customerId: string }) => r.customerId))
            .toEqual(["c1", "c2"])
    })

    it("müşteri filtresi alıcı satırları üzerinden uygulanır", async () => {
        await campaignAnnouncementRepository().listAnnouncements({ customerId: "c9" })

        const call = prismaMock.campaignAnnouncement.findMany.mock.calls[0][0]
        expect(call.where.recipients).toEqual({ some: { customerId: "c9" } })
    })

    it("durum filtresi alıcı satırları üzerinden uygulanır", async () => {
        await campaignAnnouncementRepository().listAnnouncements({ status: "RESPONDED" })

        const call = prismaMock.campaignAnnouncement.findMany.mock.calls[0][0]
        expect(call.where.recipients).toEqual({ some: { status: "RESPONDED" } })
    })

    it("müşteri ve durum birlikte tek alıcı satırında aranır", async () => {
        // İkisi ayrı `some` olsaydı "bu müşteri var VE (başka) bir yanıt var"
        // eşleşirdi; aynı satırda aranmalı.
        await campaignAnnouncementRepository().listAnnouncements({
            customerId: "c9",
            status: "RESPONDED",
        })

        const call = prismaMock.campaignAnnouncement.findMany.mock.calls[0][0]
        expect(call.where.recipients).toEqual({
            some: { customerId: "c9", status: "RESPONDED" },
        })
    })

    it("yöneticinin açık temsilci filtresi doğrudan uygulanır", async () => {
        await campaignAnnouncementRepository().listAnnouncements({ createdByUserId: "rep-1" })

        const call = prismaMock.campaignAnnouncement.findMany.mock.calls[0][0]
        expect(call.where.createdByUserId).toBe("rep-1")
    })

    it("temsilci kapsamı: kendi oluşturdukları VEYA kendi müşterilerini hedefleyenler", async () => {
        await campaignAnnouncementRepository().listAnnouncements({ salesScopeUserId: "rep-1" })

        const call = prismaMock.campaignAnnouncement.findMany.mock.calls[0][0]
        expect(call.where.OR).toEqual([
            { createdByUserId: "rep-1" },
            { recipients: { some: { customer: { assignedSalesUserId: "rep-1" } } } },
        ])
    })

    it("kapsam verilmezse OR üretilmez (yönetici tümünü görür)", async () => {
        await campaignAnnouncementRepository().listAnnouncements({})

        const call = prismaMock.campaignAnnouncement.findMany.mock.calls[0][0]
        expect(call.where.OR).toBeUndefined()
    })

    it("alıcı güncellemesi duyurunun tamamını geri döner", async () => {
        prismaMock.campaignAnnouncementRecipient.update.mockResolvedValueOnce({
            announcementId: "ann-1",
        })

        const result = await campaignAnnouncementRepository().updateRecipient("r1", {
            status: "REACHED",
        })

        expect(prismaMock.campaignAnnouncementRecipient.update).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: "r1" }, data: { status: "REACHED" } }),
        )
        expect(result).toEqual({ id: "ann-1" })
    })
})
