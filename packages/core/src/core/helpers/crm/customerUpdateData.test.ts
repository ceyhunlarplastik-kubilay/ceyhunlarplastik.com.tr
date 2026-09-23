import { describe, expect, it } from "vitest"

import type { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { buildCustomerUpdateData } from "./customerUpdateData"

// Profil alanları (sektör/üretim grubu/kullanım alanı) gönderilmediğinde
// `resolveCustomerAttributeAssignments` repository'ye hiç dokunmaz; ek telefon
// yazımı bu yüzden veritabanısız sınanabilir.
const repository = {} as IPrismaProductAttributeValueRepository

describe("buildCustomerUpdateData — ek telefonlar", () => {
    it("ek telefon gönderilmezse ilişkiye dokunmaz (eski istemciler)", async () => {
        const data = await buildCustomerUpdateData(repository, { phone: "0532 000 00 00" })

        expect(data).not.toHaveProperty("additionalPhones")
    })

    it("tam değişim yazar: eskileri siler, yenileri tek createMany ile ekler", async () => {
        const data = await buildCustomerUpdateData(repository, {
            phone: "0532 000 00 00",
            additionalPhones: [
                // Birincil numarayla aynı hat → ek numara olarak yazılmaz.
                { number: "+90 532 000 00 00", label: "Cep" },
                { number: "0232 111 22 33", label: " Muhasebe " },
            ],
        })

        expect(data.additionalPhones).toEqual({
            deleteMany: {},
            createMany: {
                data: [{ number: "0232 111 22 33", label: "Muhasebe", displayOrder: 0 }],
            },
        })
    })

    it("istek birincil numara taşımıyorsa kayıttakiyle karşılaştırır", async () => {
        const data = await buildCustomerUpdateData(
            repository,
            { additionalPhones: [{ number: "05320000000" }, { number: "0232 111 22 33" }] },
            { currentPhone: "0532 000 00 00" },
        )

        expect(data.additionalPhones).toEqual({
            deleteMany: {},
            createMany: {
                data: [{ number: "0232 111 22 33", label: null, displayOrder: 0 }],
            },
        })
    })

    it("boş liste yalnız siler", async () => {
        const data = await buildCustomerUpdateData(repository, { additionalPhones: [] })

        expect(data.additionalPhones).toEqual({ deleteMany: {} })
    })
})
