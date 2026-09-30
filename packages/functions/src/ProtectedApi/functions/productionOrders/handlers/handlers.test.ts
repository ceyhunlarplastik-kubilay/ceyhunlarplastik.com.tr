import { describe, expect, it, vi } from "vitest"

import {
    createProductionOrderHandler,
    deleteProductionOrderHandler,
    listProductionOrdersHandler,
    updateProductionOrderHandler,
} from "./index"
import type {
    ICreateProductionOrderEvent,
    IDeleteProductionOrderEvent,
    IListProductionOrdersEvent,
    IUpdateProductionOrderEvent,
} from "@/functions/ProtectedApi/types/productionOrders"

const ORDER_ID = "11111111-1111-4111-8111-111111111111"
const VARIANT_ID = "22222222-2222-4222-8222-222222222222"
const CUSTOMER_ID = "33333333-3333-4333-8333-333333333333"
const USER_ID = "44444444-4444-4444-8444-444444444444"

const existingOrder = {
    id: ORDER_ID,
    orderNumber: 1001,
    productVariantId: VARIANT_ID,
    variantCode: "10.1.3.V1",
    quantity: 10_000,
    dueDate: "2026-10-15",
    priority: "NORMAL",
    source: "MANUAL",
    customerId: null,
    cycleTimeOverrideSec: null,
    status: "DRAFT",
}

function buildDeps(options: { usableMoldCount?: number; isInHouse?: boolean; order?: Record<string, unknown> | null; customerExists?: boolean } = {}) {
    const { usableMoldCount = 1, isInHouse = true, order = existingOrder, customerExists = true } = options
    return {
        productionOrderRepository: {
            listOrders: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } }),
            getOrder: vi.fn().mockResolvedValue(order),
            createOrder: vi.fn().mockImplementation(async (input) => ({ id: ORDER_ID, orderNumber: 1001, ...input })),
            updateOrder: vi.fn().mockImplementation(async (id, input) => ({ ...existingOrder, id, ...input })),
            deleteOrder: vi.fn(),
        },
        productionReferenceRepository: {
            getVariantForOrder: vi.fn().mockResolvedValue({
                id: VARIANT_ID,
                fullCode: "10.1.3.V1",
                productSizeId: "s",
                usableMoldCount,
                isInHouse,
            }),
            customerExists: vi.fn().mockResolvedValue(customerExists),
        },
    }
}

const createEvent = (body: Record<string, unknown>) =>
    ({ body, user: { id: USER_ID } }) as unknown as ICreateProductionOrderEvent
const updateEvent = (body: Record<string, unknown>) =>
    ({ body, pathParameters: { id: ORDER_ID } }) as unknown as IUpdateProductionOrderEvent

describe("createProductionOrderHandler", () => {
    it("taslak olarak açar, varyant kodunu kopyalar, varsayılanları uygular", async () => {
        const deps = buildDeps()

        const response = await createProductionOrderHandler(deps as never)(createEvent({
            productVariantId: VARIANT_ID,
            quantity: 100_000,
            dueDate: "2026-10-15",
            notes: "  Acil  ",
        }))

        expect(response.statusCode).toBe(201)
        expect(deps.productionOrderRepository.createOrder).toHaveBeenCalledWith({
            productVariantId: VARIANT_ID,
            variantCode: "10.1.3.V1",
            quantity: 100_000,
            dueDate: "2026-10-15",
            priority: "NORMAL",
            source: "MANUAL",
            customerId: null,
            cycleTimeOverrideSec: null,
            status: "DRAFT",
            notes: "Acil",
            createdByUserId: USER_ID,
        })
    })

    it("kalıbı olmayan ölçüye emir açılmaz (tedarikçiden alınan ürün)", async () => {
        await expect(createProductionOrderHandler(buildDeps({ usableMoldCount: 0 }) as never)(createEvent({
            productVariantId: VARIANT_ID,
            quantity: 100,
        }))).rejects.toMatchObject({ statusCode: 400 })
    })

    it("iç üretim tedarikçisine bağlı olmayan varyanta emir açılmaz (kalıbı olsa da)", async () => {
        const deps = buildDeps({ isInHouse: false })
        await expect(createProductionOrderHandler(deps as never)(createEvent({
            productVariantId: VARIANT_ID,
            quantity: 100,
        }))).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining("iç üretim") })
        expect(deps.productionOrderRepository.createOrder).not.toHaveBeenCalled()
    })

    it("müşteri siparişinde müşteri zorunlu; bilinmeyen müşteri 404", async () => {
        const deps = buildDeps({ customerExists: false })

        await expect(createProductionOrderHandler(deps as never)(createEvent({
            productVariantId: VARIANT_ID,
            quantity: 100,
            source: "CUSTOMER_ORDER",
        }))).rejects.toMatchObject({ statusCode: 400 })
        expect(deps.productionReferenceRepository.getVariantForOrder).not.toHaveBeenCalled()

        await expect(createProductionOrderHandler(deps as never)(createEvent({
            productVariantId: VARIANT_ID,
            quantity: 100,
            source: "CUSTOMER_ORDER",
            customerId: CUSTOMER_ID,
        }))).rejects.toMatchObject({ statusCode: 404 })
    })
})

describe("updateProductionOrderHandler", () => {
    it("elle yalnız taslak / beklemede / iptal arasında geçilir", async () => {
        await expect(updateProductionOrderHandler(buildDeps() as never)(updateEvent({ status: "COMPLETED" })))
            .rejects.toMatchObject({ statusCode: 409 })

        const deps = buildDeps()
        await updateProductionOrderHandler(deps as never)(updateEvent({ status: "ON_HOLD" }))
        expect(deps.productionOrderRepository.updateOrder).toHaveBeenCalledWith(ORDER_ID, { status: "ON_HOLD" })
    })

    it("iptal edilmiş emrin içeriği değişmez; taslağa alınırken değişebilir", async () => {
        const cancelled = { ...existingOrder, status: "CANCELLED" }

        await expect(updateProductionOrderHandler(buildDeps({ order: cancelled }) as never)(updateEvent({ quantity: 5 })))
            .rejects.toMatchObject({ statusCode: 409 })

        const deps = buildDeps({ order: cancelled })
        await updateProductionOrderHandler(deps as never)(updateEvent({ status: "DRAFT", quantity: 5 }))
        expect(deps.productionOrderRepository.updateOrder).toHaveBeenCalledWith(ORDER_ID, { status: "DRAFT", quantity: 5 })
    })

    it("kaynak müşteri siparişine çekilince kayıttaki müşteriyle birlikte denetlenir", async () => {
        await expect(updateProductionOrderHandler(buildDeps() as never)(updateEvent({ source: "CUSTOMER_ORDER" })))
            .rejects.toMatchObject({ statusCode: 400 })
    })

    it("varyant değişince kod yeniden kopyalanır", async () => {
        const deps = buildDeps()
        const otherVariant = "55555555-5555-4555-8555-555555555555"
        deps.productionReferenceRepository.getVariantForOrder.mockResolvedValue({
            id: otherVariant,
            fullCode: "10.1.4.V2",
            productSizeId: "s2",
            usableMoldCount: 2,
            isInHouse: true,
        })

        await updateProductionOrderHandler(deps as never)(updateEvent({ productVariantId: otherVariant }))
        expect(deps.productionOrderRepository.updateOrder).toHaveBeenCalledWith(ORDER_ID, {
            productVariantId: otherVariant,
            variantCode: "10.1.4.V2",
        })
    })
})

describe("deleteProductionOrderHandler ve liste", () => {
    it("yalnız taslak silinir", async () => {
        const deps = buildDeps({ order: { ...existingOrder, status: "ON_HOLD" } })
        await expect(deleteProductionOrderHandler(deps as never)(
            { pathParameters: { id: ORDER_ID } } as unknown as IDeleteProductionOrderEvent,
        )).rejects.toMatchObject({ statusCode: 409 })
        expect(deps.productionOrderRepository.deleteOrder).not.toHaveBeenCalled()
    })

    it("varsayılan liste kapanmamış emirlerdir; sayfa boyutu sınırlanır", async () => {
        const deps = buildDeps()
        await listProductionOrdersHandler(deps as never)(
            { queryStringParameters: { page: "2", limit: "500", q: "UE-1001" } } as unknown as IListProductionOrdersEvent,
        )
        expect(deps.productionOrderRepository.listOrders).toHaveBeenCalledWith({
            page: 2,
            limit: 100,
            search: "UE-1001",
            statuses: ["DRAFT", "PLANNED", "RELEASED", "IN_PROGRESS", "ON_HOLD"],
        })
    })
})
