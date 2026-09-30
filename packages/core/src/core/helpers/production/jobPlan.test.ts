import { describe, expect, it } from "vitest"

import { buildJobPlan, buildJobRescheduleWrite, formatLotNumber } from "./jobPlan"

const at = (iso: string) => new Date(iso)

describe("buildJobPlan", () => {
    const candidate = {
        machine: { id: "m-01", code: "M-01", name: "Arburg" },
        mold: { id: "k-1003", code: "K-1003", name: "Aile kalıbı" },
        shots: 100,
        cycleTimeSec: 16,
        setupMinutes: 40,
        setupStartAt: at("2026-10-05T05:00:00Z"),
        productionStartAt: at("2026-10-05T05:40:00Z"),
        endAt: at("2026-10-06T07:00:00Z"),
        lots: [
            { sequence: 1, workday: "2026-10-05", shiftCode: "A", startAt: at("2026-10-05T05:40:00Z"), endAt: at("2026-10-05T17:00:00Z"), shots: 60, quantity: 240 },
            { sequence: 2, workday: "2026-10-06", shiftCode: "A", startAt: at("2026-10-06T05:00:00Z"), endAt: at("2026-10-06T07:00:00Z"), shots: 40, quantity: 160 },
        ],
    }

    it("aile kalıbında emrin ölçüsü emre bağlanır, diğer göz yan üründür; lot adetleri göze göre", () => {
        let counter = 0
        const plan = buildJobPlan({
            candidate,
            efficiencyPercent: 85,
            moldOutputs: [
                { id: "o-round", productSizeId: "s-round", cavities: 4 },
                { id: "o-square", productSizeId: "s-square", cavities: 4 },
                { id: "o-closed", productSizeId: "s-x", cavities: 0 },
            ],
            order: { id: "order-1", productSizeId: "s-square" },
            versionSignature: "color:black|materials:pp",
            createdByUserId: null,
            newId: () => `id-${++counter}`,
        })

        expect(plan.job).toMatchObject({ id: "id-1", machineId: "m-01", moldId: "k-1003", plannedShots: 100, efficiencyPercent: 85 })
        expect(plan.outputs.map((output) => [output.moldOutputId, output.productionOrderId, output.plannedQuantity])).toEqual([
            ["o-round", null, 400],
            ["o-square", "order-1", 400],
        ])
        expect(plan.lots.map((lot) => [lot.sequence, lot.shiftDate, lot.plannedShots])).toEqual([[1, "2026-10-05", 60], [2, "2026-10-06", 40]])
        expect(plan.lotOutputs).toHaveLength(4)
        expect(plan.lotOutputs.reduce((sum, entry) => sum + entry.plannedQuantity, 0)).toBe(800)
        expect(new Set([plan.job.id, ...plan.outputs.map((o) => o.id), ...plan.lots.map((l) => l.id), ...plan.lotOutputs.map((l) => l.id)]).size).toBe(9)
    })

    it("takvime yerleşmemiş aday işe çevrilmez", () => {
        expect(() => buildJobPlan({
            candidate: { ...candidate, endAt: null },
            efficiencyPercent: 85,
            moldOutputs: [],
            order: { id: "o", productSizeId: "s" },
            versionSignature: "x",
            createdByUserId: null,
            newId: () => "x",
        })).toThrow()
        expect(formatLotNumber(1000, 2)).toBe("1000-2")
    })
})

describe("buildJobRescheduleWrite", () => {
    const planFor = (lotCount: number) => {
        let counter = 0
        return buildJobPlan({
            candidate: {
                machine: { id: "m-02", code: "M-02", name: "Engel" },
                mold: { id: "k", code: "K", name: "K" },
                shots: 10 * lotCount,
                cycleTimeSec: 20,
                setupMinutes: 30,
                setupStartAt: at("2026-10-05T05:00:00Z"),
                productionStartAt: at("2026-10-05T05:30:00Z"),
                endAt: at("2026-10-06T06:00:00Z"),
                lots: Array.from({ length: lotCount }, (_, index) => ({
                    sequence: index + 1,
                    workday: "2026-10-05",
                    shiftCode: ["A", "B", "C"][index % 3],
                    startAt: at(`2026-10-05T0${5 + index}:30:00Z`),
                    endAt: at(`2026-10-05T0${6 + index}:00:00Z`),
                    shots: 10,
                    quantity: 40,
                })),
            },
            efficiencyPercent: 80,
            moldOutputs: [{ id: "mo-1", productSizeId: "s", cavities: 4 }],
            order: { id: "order", productSizeId: "s" },
            versionSignature: "x",
            createdByUserId: "u",
            newId: () => `new-${++counter}`,
        })
    }
    const outputs = [{ id: "out-1", moldOutputId: "mo-1" }]
    const lot = (sequence: number, records: { notes?: number; operators?: number } = {}) => ({
        id: `lot-${sequence}`,
        sequence,
        noteCount: records.notes ?? 0,
        lotOperatorCount: records.operators ?? 0,
    })

    it("aynı sıradaki lot yerinde güncellenir (kimlik korunur); işin kimliği ve çıktıları kalır", () => {
        const write = buildJobRescheduleWrite(planFor(2), { jobId: "job-1", outputs, lots: [lot(1), lot(2)] })

        expect(write.job).toMatchObject({ machineId: "m-02", efficiencyPercent: 80 })
        expect(write.job).not.toHaveProperty("id")
        expect(write.job).not.toHaveProperty("createdByUserId")
        expect(write.lotUpdates.map((entry) => [entry.id, entry.shiftCode])).toEqual([["lot-1", "A"], ["lot-2", "B"]])
        expect(write.lotCreates).toEqual([])
        expect(write.lotDeleteIds).toEqual([])
        expect(write.lotOutputs.map((entry) => [entry.lotId, entry.jobOutputId, entry.plannedQuantity]))
            .toEqual([["lot-1", "out-1", 40], ["lot-2", "out-1", 40]])
        expect(write.outputQuantities).toEqual([{ id: "out-1", plannedQuantity: 80 }])
        expect(write.blockedLotSequences).toEqual([])
    })

    it("plan uzarsa yeni sıra eklenir; kısalırsa fazla lot silinir — kaydı olan silinecekse engellenir", () => {
        const longer = buildJobRescheduleWrite(planFor(3), { jobId: "job-1", outputs, lots: [lot(1), lot(2)] })
        expect(longer.lotCreates).toEqual([expect.objectContaining({ jobId: "job-1", sequence: 3 })])
        expect(longer.lotOutputs.find((entry) => entry.lotId === longer.lotCreates[0].id)).toBeDefined()

        const shorter = buildJobRescheduleWrite(planFor(1), {
            jobId: "job-1",
            outputs,
            lots: [lot(1, { notes: 2 }), lot(2), lot(3, { notes: 1 }), lot(4, { operators: 2 })],
        })
        expect(shorter.lotUpdates.map((entry) => entry.id)).toEqual(["lot-1"])
        expect(shorter.lotDeleteIds).toEqual(["lot-2", "lot-3", "lot-4"])
        // lot-1'in notu var ama yerinde kaldığı için engel değil.
        expect(shorter.blockedLotSequences).toEqual([3, 4])
    })

    it("eşleşmeyen göz veri tutarsızlığıdır", () => {
        expect(() => buildJobRescheduleWrite(planFor(1), { jobId: "job-1", outputs: [{ id: "out-9", moldOutputId: "other" }], lots: [] })).toThrow()
    })
})
