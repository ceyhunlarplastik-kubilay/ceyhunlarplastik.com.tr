import { describe, expect, it } from "vitest"

import type { CampaignAnnouncement } from "@/features/sales/campaignAnnouncements/api/types"
import { summarizeAnnouncement } from "./announcementLabels"

function announcement(statuses: string[]): CampaignAnnouncement {
    return {
        id: "a1",
        campaignId: "c1",
        createdByUserId: "rep",
        createdAt: "",
        updatedAt: "",
        recipients: statuses.map((status, index) => ({
            id: `r${index}`,
            announcementId: "a1",
            customerId: `cu${index}`,
            channel: "MANUAL",
            status,
            createdAt: "",
            updatedAt: "",
        })),
    } as CampaignAnnouncement
}

describe("summarizeAnnouncement", () => {
    it("durumları sayar", () => {
        const result = summarizeAnnouncement(
            announcement(["PENDING", "REACHED", "RESPONDED", "RESPONDED"]),
        )

        expect(result.total).toBe(4)
        expect(result.pending).toBe(1)
        expect(result.reached).toBe(1)
        expect(result.responded).toBe(2)
    })

    it("temas oranı beklemede OLMAYAN satırlardan hesaplanır", () => {
        // İlgilenmiyor ve ulaşılamadı da bir sonuçtur; temsilci o satırı işlemiştir.
        const result = summarizeAnnouncement(
            announcement(["PENDING", "NOT_INTERESTED", "UNREACHABLE", "RESPONDED"]),
        )

        expect(result.contactedPercent).toBe(75)
    })

    it("hepsi beklemedeyse oran sıfırdır", () => {
        expect(summarizeAnnouncement(announcement(["PENDING", "PENDING"])).contactedPercent).toBe(0)
    })

    it("alıcısı olmayan duyuruda sıfıra bölme yapmaz", () => {
        const result = summarizeAnnouncement(announcement([]))

        expect(result.total).toBe(0)
        expect(result.contactedPercent).toBe(0)
    })
})
