import { describe, expect, it, vi } from "vitest"

import {
    createProductionLotNoteHandler,
    deleteProductionLotNoteHandler,
    listProductionLotsHandler,
    replaceProductionLotOperatorsHandler,
} from "./index"
import type {
    ICreateProductionLotNoteEvent,
    IDeleteProductionLotNoteEvent,
    IListProductionLotsEvent,
    IReplaceProductionLotOperatorsEvent,
} from "@/functions/ProtectedApi/types/productionLots"

const ACTIVE = { id: "op-1", firstName: "Ahmet", lastName: "Yılmaz", employeeNo: null, isActive: true }
const PASSIVE = { id: "op-2", firstName: "Veli", lastName: "Kaya", employeeNo: null, isActive: false }

function buildDeps() {
    return {
        productionLotRepository: {
            listLots: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } }),
            getLotRef: vi.fn().mockResolvedValue({ id: "lot-1", lotNumber: "1000-2", machineId: "m1", shiftDate: "2026-09-28", shiftCode: "A", lotOperatorIds: ["op-2"] }),
            replaceLotOperators: vi.fn(),
            createNote: vi.fn().mockImplementation(async (input) => ({ id: "n1", createdAt: new Date(), author: null, operator: null, ...input })),
            getNote: vi.fn().mockResolvedValue({ id: "n1", lotId: "lot-1", authorUserId: "u1" }),
            deleteNote: vi.fn(),
        },
        productionShiftAssignmentRepository: { listForCells: vi.fn().mockResolvedValue([]) },
        productionOperatorRepository: {
            listOperators: vi.fn().mockResolvedValue([ACTIVE, PASSIVE]),
            getOperator: vi.fn().mockResolvedValue(ACTIVE),
        },
    }
}

describe("listProductionLotsHandler", () => {
    it("tarih yoksa bugün + 6 gün; arama varsa tarih süzgeci uygulanmaz", async () => {
        const deps = buildDeps()
        await listProductionLotsHandler(deps as never)({ queryStringParameters: {} } as unknown as IListProductionLotsEvent)
        const [first] = deps.productionLotRepository.listLots.mock.calls[0]
        expect(first.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(first.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)

        await listProductionLotsHandler(deps as never)({ queryStringParameters: { q: " 1000-2 ", from: "2026-01-01" } } as unknown as IListProductionLotsEvent)
        const [second] = deps.productionLotRepository.listLots.mock.calls[1]
        expect(second).toMatchObject({ search: "1000-2" })
        expect(second.from).toBeUndefined()
    })

    it("ters aralık 400", async () => {
        await expect(listProductionLotsHandler(buildDeps() as never)({ queryStringParameters: { from: "2026-10-05", to: "2026-10-01" } } as unknown as IListProductionLotsEvent))
            .rejects.toMatchObject({ statusCode: 400 })
    })
})

describe("lota özel ekip", () => {
    const event = (operatorIds: string[]) => ({ pathParameters: { lotNumber: "1000-2" }, body: { operatorIds } }) as unknown as IReplaceProductionLotOperatorsEvent

    it("zaten seçili pasif operatör kalabilir; yeni pasif seçilemez; boş liste vardiya ekibine döner", async () => {
        const deps = buildDeps()
        await replaceProductionLotOperatorsHandler(deps as never)(event(["op-1", "op-2"]))
        expect(deps.productionLotRepository.replaceLotOperators).toHaveBeenCalledWith("lot-1", ["op-1", "op-2"])

        deps.productionLotRepository.getLotRef.mockResolvedValue({ id: "lot-1", lotNumber: "1000-2", machineId: "m1", shiftDate: "2026-09-28", shiftCode: "A", lotOperatorIds: [] })
        await expect(replaceProductionLotOperatorsHandler(deps as never)(event(["op-2"]))).rejects.toMatchObject({ statusCode: 400 })

        deps.productionShiftAssignmentRepository.listForCells.mockResolvedValue([{ machineId: "m1", shiftDate: "2026-09-28", shiftCode: "A", operator: ACTIVE }])
        const response = await replaceProductionLotOperatorsHandler(deps as never)(event([]))
        expect((response.body as unknown as { payload: { operators: { source: string } } }).payload.operators.source).toBe("roster")
    })

    it("olmayan lot 404", async () => {
        const deps = buildDeps()
        deps.productionLotRepository.getLotRef.mockResolvedValue(null)
        await expect(replaceProductionLotOperatorsHandler(deps as never)(event([]))).rejects.toMatchObject({ statusCode: 404 })
    })
})

describe("lot notları", () => {
    const createEvent = (body: Record<string, unknown>) => ({
        pathParameters: { lotNumber: "1000-2" },
        body: { category: "QUALITY", ...body },
        user: { id: "u1", isAdmin: false, isOwner: false },
    }) as unknown as ICreateProductionLotNoteEvent

    it("metin kırpılır, yazar ve operatör atfı yazılır; boş not 400; olmayan operatör 400", async () => {
        const deps = buildDeps()
        const response = await createProductionLotNoteHandler(deps as never)(createEvent({ body: "  Renk açık.  ", operatorId: "op-1" }))
        expect(response.statusCode).toBe(201)
        expect(deps.productionLotRepository.createNote).toHaveBeenCalledWith({
            lotId: "lot-1", category: "QUALITY", body: "Renk açık.", authorUserId: "u1", operatorId: "op-1",
        })
        await expect(createProductionLotNoteHandler(deps as never)(createEvent({ body: "   " }))).rejects.toMatchObject({ statusCode: 400 })
        deps.productionOperatorRepository.getOperator.mockResolvedValue(null)
        await expect(createProductionLotNoteHandler(deps as never)(createEvent({ body: "x", operatorId: "op-9" }))).rejects.toMatchObject({ statusCode: 400 })
    })

    it("notu yazan ya da yönetici siler; başkası 403", async () => {
        const deleteEvent = (user: Record<string, unknown>) => ({ pathParameters: { id: "n1" }, user }) as unknown as IDeleteProductionLotNoteEvent
        const deps = buildDeps()
        await expect(deleteProductionLotNoteHandler(deps as never)(deleteEvent({ id: "u2", isAdmin: false, isOwner: false })))
            .rejects.toMatchObject({ statusCode: 403 })
        await deleteProductionLotNoteHandler(deps as never)(deleteEvent({ id: "u2", isAdmin: true, isOwner: false }))
        await deleteProductionLotNoteHandler(deps as never)(deleteEvent({ id: "u1", isAdmin: false, isOwner: false }))
        expect(deps.productionLotRepository.deleteNote).toHaveBeenCalledTimes(2)
    })
})
