import { describe, expect, it, vi } from "vitest"
import { Prisma } from "@/prisma/generated/prisma/client"

import {
    createProductionOperatorHandler,
    deleteProductionOperatorHandler,
    updateProductionOperatorHandler,
} from "./index"
import type {
    ICreateProductionOperatorEvent,
    IDeleteProductionOperatorEvent,
    IUpdateProductionOperatorEvent,
} from "@/functions/ProtectedApi/types/productionOperators"

const OPERATOR_ID = "55555555-5555-4555-8555-555555555555"

function buildDeps(existing: Record<string, unknown> | null = null) {
    return {
        productionOperatorRepository: {
            listOperators: vi.fn(),
            getOperator: vi.fn().mockResolvedValue(existing),
            createOperator: vi.fn().mockImplementation(async (input) => ({ id: OPERATOR_ID, ...input })),
            updateOperator: vi.fn().mockImplementation(async (id, input) => ({ id, ...input })),
            deleteOperator: vi.fn(),
        },
    }
}

describe("createProductionOperatorHandler", () => {
    it("sicil numarasını kod gibi normalleştirir, varsayılanları uygular", async () => {
        const deps = buildDeps()

        await createProductionOperatorHandler(deps as never)({
            body: { firstName: " Ahmet ", lastName: "Yılmaz", employeeNo: " cp-0123 " },
        } as unknown as ICreateProductionOperatorEvent)

        expect(deps.productionOperatorRepository.createOperator).toHaveBeenCalledWith({
            firstName: "Ahmet",
            lastName: "Yılmaz",
            employeeNo: "CP-0123",
            phone: null,
            isActive: true,
            notes: null,
        })
    })

    it("aynı sicil numarasını 409'a çevirir", async () => {
        const deps = buildDeps()
        deps.productionOperatorRepository.createOperator.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "7" }),
        )

        await expect(createProductionOperatorHandler(deps as never)({
            body: { firstName: "Ahmet", lastName: "Yılmaz", employeeNo: "CP-0123" },
        } as unknown as ICreateProductionOperatorEvent)).rejects.toMatchObject({ statusCode: 409 })
    })

    it("boş ad 400 döner (ajv kırpmadan uzunluğu denetler)", async () => {
        await expect(createProductionOperatorHandler(buildDeps() as never)({
            body: { firstName: "   ", lastName: "Yılmaz" },
        } as unknown as ICreateProductionOperatorEvent)).rejects.toMatchObject({ statusCode: 400 })
    })
})

describe("updateProductionOperatorHandler", () => {
    it("boş sicil numarası alanı temizler, gönderilmeyen alana dokunmaz", async () => {
        const deps = buildDeps({ id: OPERATOR_ID, employeeNo: "CP-0123" })

        await updateProductionOperatorHandler(deps as never)({
            pathParameters: { id: OPERATOR_ID },
            body: { employeeNo: "", isActive: false },
        } as unknown as IUpdateProductionOperatorEvent)

        expect(deps.productionOperatorRepository.updateOperator).toHaveBeenCalledWith(OPERATOR_ID, {
            employeeNo: null,
            isActive: false,
        })
    })
})

describe("deleteProductionOperatorHandler", () => {
    it("olmayan operatör 404", async () => {
        const deps = buildDeps(null)

        await expect(deleteProductionOperatorHandler(deps as never)({
            pathParameters: { id: OPERATOR_ID },
        } as unknown as IDeleteProductionOperatorEvent)).rejects.toMatchObject({ statusCode: 404 })
        expect(deps.productionOperatorRepository.deleteOperator).not.toHaveBeenCalled()
    })
})
