import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const prismaDecimalSchema = z.object({
    s: z.number(),
    e: z.number(),
    d: z.array(z.number()),
}).loose()

const decimalLike = z.union([z.number(), z.string(), prismaDecimalSchema]).nullable().optional()

/**
 * Matris satırındaki tedarikçi girdisi.
 *
 * Marj alanları (operationalCostRate / netCost / profitRate / listPrice) şemada
 * OPSİYONEL kalır — kapı rolde: `content_editor` gönderirse handler bunları
 * sessizce düşürür (bkz. supplierFieldVisibility.ts). Şemadan tamamen çıkarmak,
 * admin'in aynı uçtan marj yazmasını da engellerdi.
 */
const matrixRowSupplierSchema = z.object({
    supplierId: z.uuid(),
    isActive: z.boolean().optional(),
    price: z.number().nonnegative().optional(),
    operationalCostRate: z.number().min(0).max(1000).optional(),
    netCost: z.number().nonnegative().optional(),
    profitRate: z.number().min(0).max(1000).optional(),
    listPrice: z.number().nonnegative().optional(),
    paymentTermDays: z.number().int().min(0).max(3650).optional(),
    supplierVariantCode: z.string().max(120).optional(),
    supplierNote: z.string().max(2000).optional(),
    minOrderQty: z.number().int().min(0).optional(),
    stockQty: z.number().int().min(0).optional(),
    currency: z.string().min(3).max(3).optional(),
    hasSupplierLogo: z.boolean().optional(),
    unitsPerPackage: z.number().int().min(0).optional(),
    packageLengthMm: z.number().nonnegative().optional(),
    packageWidthMm: z.number().nonnegative().optional(),
    packageHeightMm: z.number().nonnegative().optional(),
    packageWeightKg: z.number().nonnegative().optional(),
    minLeadTimeDays: z.number().int().min(0).max(3650).optional(),
})

export const saveVariantMatrixValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            // Operatör katalogdan toplu giriş yapar; üst sınır tek isteğin
            // transaction bütçesini aşmaması için.
            rows: z.array(z.object({
                name: z.string().min(1).max(240),
                measurements: z.array(z.object({
                    requirementId: z.uuid(),
                    value: z.number(),
                })).min(1).max(24),
                colorId: z.uuid().optional(),
                materialIds: z.array(z.uuid()).max(12).optional(),
                supplier: matrixRowSupplierSchema.optional(),
            })).min(1).max(500),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["rows"],
    }
)

export const setVariantCodeLockValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            locked: z.boolean(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["locked"],
    }
)

/** Yıkıcı işlem: istemci niyetini açıkça bildirmeli. */
export const renumberVariantCodesValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            confirm: z.literal(true),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["confirm"],
    }
)

export const idValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

const matrixSchema = z.object({
    product: z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        variantCodesLockedAt: z.string().nullable(),
    }).loose(),
    requirements: z.array(z.object({
        id: z.string(),
        measurementTypeId: z.string(),
        measurementCode: z.string(),
        label: z.string(),
        unit: z.string().nullable(),
        isRequired: z.boolean(),
        sortPriority: z.number(),
        displayOrder: z.number(),
    }).loose()),
    sizes: z.array(z.object({
        id: z.string(),
        code: z.number(),
        values: z.array(z.object({
            requirementId: z.string(),
            value: z.number(),
        }).loose()),
    }).loose()),
    versions: z.array(z.object({
        id: z.string(),
        code: z.string(),
        colorId: z.string().nullable(),
        materialIds: z.array(z.string()),
    }).loose()),
    supplierCodes: z.array(z.object({
        id: z.string(),
        supplierId: z.string(),
        supplierName: z.string(),
        code: z.string(),
    }).loose()),
    versionDictionary: z.array(z.object({
        id: z.string(),
        code: z.number(),
        colorId: z.string().nullable(),
        materialIds: z.array(z.string()),
    }).loose()),
    rows: z.array(z.object({
        variantId: z.string(),
        fullCode: z.string(),
        name: z.string(),
        sizeId: z.string(),
        versionId: z.string(),
        suppliers: z.array(z.object({
            id: z.string(),
            supplierId: z.string(),
            supplierCode: z.string().nullable(),
            fullCode: z.string().nullable(),
            isActive: z.boolean(),
            price: decimalLike,
            // Marj alanları operatörde HİÇ dönmez; bu yüzden hepsi opsiyonel.
            operationalCostRate: decimalLike,
            netCost: decimalLike,
            profitRate: decimalLike,
            listPrice: decimalLike,
            packageLengthMm: decimalLike,
            packageWidthMm: decimalLike,
            packageHeightMm: decimalLike,
            packageWeightKg: decimalLike,
        }).loose()),
    }).loose()),
}).loose()

export const variantMatrixResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                matrix: matrixSchema,
            }),
        }),
    }).loose()
)

export const saveVariantMatrixResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                result: z.object({
                    productId: z.string(),
                    isLocked: z.boolean(),
                    affectedVariantIds: z.array(z.string()),
                    createdSizes: z.number(),
                    createdSupplierCodes: z.number(),
                    createdVariants: z.number(),
                    createdVariantSuppliers: z.number(),
                    rewrittenCodes: z.number(),
                }).loose(),
                matrix: matrixSchema.nullable(),
            }),
        }),
    }).loose()
)

export const variantCodeLockResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                product: z.object({
                    id: z.string(),
                    variantCodesLockedAt: z.string().nullable(),
                    variantCodesLockedByUserId: z.string().nullable(),
                }).loose(),
            }),
        }),
    }).loose()
)

export const renumberVariantCodesResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                result: z.object({
                    productId: z.string(),
                    isLocked: z.boolean(),
                    resortedSizes: z.number(),
                    rewrittenCodes: z.number(),
                }).loose(),
            }),
        }),
    }).loose()
)

export const variantMatrixReferencesResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                colors: z.array(z.object({
                    id: z.string(),
                    code: z.string(),
                    name: z.string(),
                    hex: z.string(),
                    system: z.string(),
                }).loose()),
                materials: z.array(z.object({
                    id: z.string(),
                    code: z.string().nullable(),
                    name: z.string(),
                }).loose()),
                suppliers: z.array(z.object({
                    id: z.string(),
                    name: z.string(),
                }).loose()),
                measurementTypes: z.array(z.object({
                    id: z.string(),
                    code: z.string(),
                    name: z.string(),
                    baseUnit: z.string(),
                    displayOrder: z.number(),
                }).loose()),
            }),
        }),
    }).loose()
)

/**
 * Tedarikçi satırı güncelleme. Ölçü/renk/hammadde/tedarikçi kimliği şemada YOK:
 * bunlar varyantın kodunu belirler, değişimleri satırı silip yeniden girmeyi gerektirir.
 * Marj alanları şemada opsiyonel; kapı rolde (content_editor'da handler düşürür).
 */
export const updateVariantMatrixSupplierValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
            supplierRowId: z.uuid(),
        }),
        body: z.object({
            price: z.number().nonnegative().optional(),
            operationalCostRate: z.number().min(0).max(1000).optional(),
            netCost: z.number().nonnegative().optional(),
            profitRate: z.number().min(0).max(1000).optional(),
            listPrice: z.number().nonnegative().optional(),
            paymentTermDays: z.number().int().min(0).max(3650).optional(),
            supplierVariantCode: z.string().max(120).optional(),
            supplierNote: z.string().max(2000).optional(),
            minOrderQty: z.number().int().min(0).optional(),
            stockQty: z.number().int().min(0).optional(),
            currency: z.string().min(3).max(3).optional(),
            hasSupplierLogo: z.boolean().optional(),
            unitsPerPackage: z.number().int().min(0).optional(),
            packageLengthMm: z.number().nonnegative().optional(),
            packageWidthMm: z.number().nonnegative().optional(),
            packageHeightMm: z.number().nonnegative().optional(),
            packageWeightKg: z.number().nonnegative().optional(),
            minLeadTimeDays: z.number().int().min(0).max(3650).optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    }
)

export const variantMatrixSupplierRowValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
            supplierRowId: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const variantMatrixVariantValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
            variantId: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const updateVariantMatrixSupplierResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                supplier: z.object({ id: z.string() }).loose(),
            }),
        }),
    }).loose()
)

export const deleteVariantMatrixRowResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({ deletedId: z.string() }).loose(),
        }),
    }).loose()
)
