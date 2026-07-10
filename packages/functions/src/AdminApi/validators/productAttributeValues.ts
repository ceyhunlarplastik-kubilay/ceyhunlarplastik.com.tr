import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { assetTypeEnum, assetRoleEnum } from "@/functions/PublicApi/validators/products"

export const createProductAttributeValueValidator = validatorWrapper(
    z.object({
        body: z.object({
            name: z.string().min(1),
            attributeId: z.uuid(),
            displayOrder: z.number().optional(),
            parentValueId: z.uuid().nullable().optional(),
            assetType: assetTypeEnum.optional(),
            assetRole: assetRoleEnum.optional(),
            assetKey: z.string().optional(),
            mimeType: z.string().optional(),
        })
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["name", "attributeId"]
    }
)

export const updateProductAttributeValueValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid()
        }),
        body: z.object({
            name: z.string().optional(),
            displayOrder: z.number().optional(),
            parentValueId: z.uuid().nullable().optional(),
            assetType: assetTypeEnum.optional(),
            assetRole: assetRoleEnum.optional(),
            assetKey: z.string().optional(),
            mimeType: z.string().optional(),
        })
    }),
    {
        requiredRootFields: ["pathParameters", "body"]
    }
)

export const idValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid()
        })
    }),
    {
        requiredRootFields: ["pathParameters"]
    }
)

export const createProductAttributeValueAssetUploadValidator = validatorWrapper(
    z.object({
        body: z.object({
            productAttributeValueId: z.uuid(),
            assetRole: z.enum([
                "PRIMARY",
                "ANIMATION",
                "GALLERY",
                "DOCUMENT",
                "TECHNICAL_DRAWING",
                "MODEL_3D",
                "ASSEMBLY_VIDEO",
                "CERTIFICATE",
            ]),
            fileName: z.string(),
            contentType: z.string(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["productAttributeValueId", "assetRole", "fileName", "contentType"],
    }
)

// Response Validators
// AdminApi list, asset'lere buildAssetUrl ile `url` ekliyor; PublicApi eklemiyor
// → loose, iki varyantı da kabul eder.
const pavAssetSchema = z.object({
    id: z.uuid(),
    key: z.string(),
    mimeType: z.string(),
    type: assetTypeEnum,
    role: assetRoleEnum,
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

const pavBaseShape = {
    id: z.uuid(),
    name: z.string(),
    slug: z.string(),
    attributeId: z.uuid(),
    parentValueId: z.uuid().nullish(),
    displayOrder: z.number(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
}

// createValue/updateValue/deleteValue include KULLANMIYOR → bare scalar'lar.
const pavBaseSchema = z.object(pavBaseShape).loose()

// listValues include { parentValue, assets } → parentValue loose sayesinde tolere edilir.
const pavWithRelationsSchema = z.object({
    ...pavBaseShape,
    assets: z.array(pavAssetSchema),
}).loose()

// createProductAttributeValue / updateProductAttributeValue → payload: { value }
export const productAttributeValueResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                value: pavBaseSchema,
            }),
        }),
    }).loose()
)

// deleteProductAttributeValue → payload: { success, value }
export const deleteProductAttributeValueResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                success: z.boolean(),
                value: pavBaseSchema,
            }),
        }),
    }).loose()
)

// list / get (alias): handler attributeId yoksa 400 + { message } döndürüyor,
// aksi halde 200 + { data }. İKİ BRANCH DE geçerli response → union şart,
// yoksa 400 yolu response validation ile 500'e dönerdi.
export const listProductAttributeValueResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.union([
                z.object({ data: z.array(pavWithRelationsSchema) }),
                z.object({ message: z.string() }),
            ]),
        }),
    }).loose()
)
