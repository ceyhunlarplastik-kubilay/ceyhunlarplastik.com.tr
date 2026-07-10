import { z } from "zod"
import { assetTypeEnum, assetRoleEnum } from "@/functions/PublicApi/validators/products"

// Response Validators
// PublicApi list, repository çıktısını ham döndürüyor (AdminApi'den farklı olarak
// asset'lere `url` eklemiyor) → loose, ileride eklenirse de kırılmaz.
const pavAssetSchema = z.object({
    id: z.uuid(),
    key: z.string(),
    mimeType: z.string(),
    type: assetTypeEnum,
    role: assetRoleEnum,
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

// listValues include { parentValue, assets } → parentValue loose ile tolere edilir.
const pavWithRelationsSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    slug: z.string(),
    attributeId: z.uuid(),
    parentValueId: z.uuid().nullish(),
    displayOrder: z.number(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    assets: z.array(pavAssetSchema),
}).loose()

// listProductAttributeValues: handler attributeId yoksa 400 + { message },
// aksi halde 200 + { data }. İKİ BRANCH DE geçerli response → union şart.
// attributeId ?attributeId= query string'inden okunur (route path parametresi taşımaz).
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
