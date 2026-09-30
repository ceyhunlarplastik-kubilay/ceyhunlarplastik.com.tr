import { describe, expect, it, vi } from "vitest"

import { createSupplierHandler } from "./createSupplierHandler"
import { updateSupplierHandler } from "./updateSupplierHandler"

const SUPPLIER_ID = "11111111-1111-4111-8111-111111111111"

function buildDeps(current: { id: string; name: string } | null = null) {
    return {
        supplierRepository: {
            findInHouseProductionSupplier: vi.fn().mockResolvedValue(current),
            createSupplier: vi.fn().mockImplementation(async (data) => ({ id: SUPPLIER_ID, ...data })),
            updateSupplier: vi.fn().mockImplementation(async (id, data) => ({ id, ...data })),
        },
    }
}

describe("iç üretim tedarikçisi tek olmalı", () => {
    it("başka bir tedarikçi işaretliyken yenisi 409 alır ve yazılmaz", async () => {
        const deps = buildDeps({ id: "other", name: "Ceyhunlar Üretim" })
        await expect(createSupplierHandler(deps as never)({ body: { name: "Yeni", isInHouseProduction: true } } as never))
            .rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("Ceyhunlar Üretim") })
        expect(deps.supplierRepository.createSupplier).not.toHaveBeenCalled()

        await expect(updateSupplierHandler(deps as never)({ pathParameters: { id: SUPPLIER_ID }, body: { isInHouseProduction: true } } as never))
            .rejects.toMatchObject({ statusCode: 409 })
        expect(deps.supplierRepository.updateSupplier).not.toHaveBeenCalled()
    })

    it("güncellemede tedarikçinin KENDİSİ hariç aranır; işaretli değilken yazılır", async () => {
        const deps = buildDeps(null)
        await updateSupplierHandler(deps as never)({ pathParameters: { id: SUPPLIER_ID }, body: { isInHouseProduction: true } } as never)
        expect(deps.supplierRepository.findInHouseProductionSupplier).toHaveBeenCalledWith(SUPPLIER_ID)
        expect(deps.supplierRepository.updateSupplier).toHaveBeenCalledWith(SUPPLIER_ID, { isInHouseProduction: true })
    })

    it("işareti kaldırmak ya da alana hiç dokunmamak kontrol gerektirmez", async () => {
        const deps = buildDeps({ id: "other", name: "Ceyhunlar Üretim" })
        await updateSupplierHandler(deps as never)({ pathParameters: { id: SUPPLIER_ID }, body: { isInHouseProduction: false } } as never)
        await updateSupplierHandler(deps as never)({ pathParameters: { id: SUPPLIER_ID }, body: { name: "Ad" } } as never)
        await createSupplierHandler(deps as never)({ body: { name: "Yeni" } } as never)
        expect(deps.supplierRepository.findInHouseProductionSupplier).not.toHaveBeenCalled()
        expect(deps.supplierRepository.updateSupplier).toHaveBeenCalledTimes(2)
    })
})
