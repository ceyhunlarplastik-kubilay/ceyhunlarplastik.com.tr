import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

/**
 * ÜRÜN → MÜŞTERİ eşleşmesi — İKİ boundary'de birden yayınlanıyor:
 * `GET /sales/products/{id}/matched-customers` (ProtectedApi) ve
 * `GET /products/{id}/matched-customers` (AdminApi).
 *
 * Şemalar bu yüzden boundary'lerden birinin `validators/` klasöründe DEĞİL,
 * paylaşılan yerde duruyor: iki uç aynı sözleşmeyi konuşmalı, biri güncellenip
 * diğeri unutulmamalı. `validatorCompilation.test.ts` globu (validators klasörleri)
 * burayı da tarıyor.
 */
const productProfileReachLabelSchema = z.object({
    id: z.uuid(),
    name: z.string(),
}).loose()

const productMatchedCustomerSchema = z.object({
    id: z.uuid(),
    companyName: z.string().nullable(),
    fullName: z.string().nullable(),
    email: z.string(),
    phone: z.string(),
    status: z.enum(["LEAD", "CUSTOMER"]),
    createdAt: z.string(),
    sectorName: z.string().nullable(),
    productionGroupName: z.string().nullable(),
    assignedSalesUserName: z.string().nullable(),
    locationSummary: z.string().nullable(),
    address: z.object({
        id: z.uuid(),
        label: z.string(),
        summary: z.string(),
        latitude: z.number().nullable(),
        longitude: z.number().nullable(),
        isPrimary: z.boolean(),
        isShipping: z.boolean(),
    }).loose().nullable(),
    matchedLabels: z.array(z.string()),
}).loose()

export const listProductMatchedCustomersValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        queryStringParameters: z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            search: z.string().trim().max(200).optional(),
            sort: z.enum(["companyName", "fullName", "createdAt", "status"]).optional(),
            order: z.enum(["asc", "desc"]).optional(),
            status: z.enum(["LEAD", "CUSTOMER"]).optional(),
            assignedSalesUserId: z.uuid().optional(),
            // Adres filtresi — normalize FK'lar; query string olduğu için coerce.
            countryId: z.coerce.number().int().positive().optional(),
            stateId: z.coerce.number().int().positive().optional(),
            cityId: z.coerce.number().int().positive().optional(),
        }).optional(),
    }).loose(),
    {
        requiredRootFields: ["pathParameters"],
        requiredPathParametersFields: ["id"],
    },
)

export const productMatchedCustomersResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(productMatchedCustomerSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                }).loose(),
                counts: z.object({
                    all: z.number(),
                    lead: z.number(),
                    customer: z.number(),
                }).loose(),
                reach: z.object({
                    sectors: z.array(productProfileReachLabelSchema),
                    productionGroups: z.array(productProfileReachLabelSchema),
                    usageAreas: z.array(productProfileReachLabelSchema),
                }).loose(),
            }).loose(),
        }).loose(),
    }).loose(),
)
