import { describe, expect, it } from "vitest"

import { negateProductVariantCodes } from "./writeProductVariantCodes"
import type { ProductVariantCodePlan } from "./assignProductVariantCodes"

/** `$executeRaw` çağrılarını yakalayan sahte transaction. */
function fakeTx() {
    const calls: Array<{ sql: string; values: unknown[] }> = []
    return {
        calls,
        tx: {
            $executeRaw: (strings: TemplateStringsArray, ...values: unknown[]) => {
                calls.push({ sql: strings.join("?").replace(/\s+/g, " ").trim(), values })
                return Promise.resolve(0)
            },
        } as any,
    }
}

function plan(overrides: Partial<ProductVariantCodePlan> = {}): ProductVariantCodePlan {
    return {
        sizeCodeUpdates: [],
        supplierCodeUpdates: [],
        variantCodeUpdates: [],
        variantSupplierCodeUpdates: [],
        requiresSizeRenumber: false,
        stats: { sizes: 0, versions: 0, supplierCodes: 0, variants: 0, variantSuppliers: 0 },
        ...overrides,
    }
}

describe("negateProductVariantCodes", () => {
    it("YALNIZ mevcut kodu olan (güncellenecek) satırları park eder", () => {
        // Regresyon: park etme kapsamı bir kez ürünün TÜM satırlarıydı. Değişmeyen
        // bir satır da park edilip faz 2'de geri yazılmadığı için kodu kalıcı olarak
        // negatif kalıyordu.
        const { tx, calls } = fakeTx()

        return negateProductVariantCodes(tx, plan({
            sizeCodeUpdates: [
                { id: "size-existing", code: 3, previousCode: 2 },
                { id: "size-new", code: 1, previousCode: null },
            ],
        })).then(() => {
            expect(calls).toHaveLength(1)
            expect(calls[0].sql).toContain('UPDATE "ProductSize" SET "code" = -"code"')
            expect(calls[0].values[0]).toEqual(["size-existing"])
        })
    })

    it("değişecek satır yoksa hiç sorgu çalıştırmaz", async () => {
        const { tx, calls } = fakeTx()
        await negateProductVariantCodes(tx, plan())
        expect(calls).toHaveLength(0)
    })

    it("fullCode'u negatifleyemeyeceği için ön ekle park eder", async () => {
        // fullCode metin ve GLOBAL unique; taslakta araya ölçü girdiğinde yeni
        // varyantın alacağı kod hâlâ mevcut bir varyantın üzerindedir.
        const { tx, calls } = fakeTx()

        await negateProductVariantCodes(tx, plan({
            variantCodeUpdates: [
                { id: "variant-existing", fullCode: "10.5.3.V1", previousFullCode: "10.5.2.V1" },
                { id: "variant-new", fullCode: "10.5.2.V1", previousFullCode: null },
            ],
            variantSupplierCodeUpdates: [
                { id: "vs-existing", supplierCode: "A", fullCode: "10.5.3.V1.A", previousFullCode: "10.5.2.V1.A" },
                { id: "vs-new", supplierCode: "A", fullCode: "10.5.2.V1.A", previousFullCode: null },
            ],
        }))

        expect(calls).toHaveLength(2)
        expect(calls[0].sql).toContain('UPDATE "ProductVariant" SET "fullCode" = ?')
        expect(calls[0].values[0]).toBe("~")
        expect(calls[0].values[1]).toEqual(["variant-existing"])
        expect(calls[1].sql).toContain('UPDATE "ProductVariantSupplier"')
        expect(calls[1].values[1]).toEqual(["vs-existing"])
    })

    it("VERSİYON kodlarına hiç dokunmaz", async () => {
        // Versiyon sözlükte append-only; yeniden numaralandırılmadığı için
        // park etmeye de gerek yok.
        const { tx, calls } = fakeTx()

        await negateProductVariantCodes(tx, plan({
            sizeCodeUpdates: [{ id: "s1", code: 2, previousCode: 1 }],
        }))

        expect(calls).toHaveLength(1)
        expect(calls[0].sql).toContain('"ProductSize"')
        expect(calls.some((call) => call.sql.includes("Version"))).toBe(false)
    })
})
