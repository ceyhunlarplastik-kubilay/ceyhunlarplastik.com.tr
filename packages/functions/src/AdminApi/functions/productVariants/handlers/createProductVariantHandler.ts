import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { prisma } from "@/core/db/prisma"
import { upsertProductVariantRows } from "@/core/helpers/productVariants/productVariantWriter"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantDependencies, ICreateProductVariantEvent } from "@/functions/AdminApi/types/productVariants"

/**
 * Tek varyant satırı oluşturur.
 *
 * Kod alanları (`versionCode`/`supplierCode`/`variantIndex`) ARTIK İSTEK GÖVDESİNDE
 * YOK: ölçü kodu ölçünün kendisinden, versiyon renk+hammadde kombinasyonundan,
 * tedarikçi harfi de ürün modeli içindeki ilk kullanım sırasından türetilir.
 * Tüm iş `upsertProductVariantRows`'ta — Dilim 3'teki toplu matris endpoint'i de
 * aynı yolu kullanacak.
 */
export const createProductVariantHandler = ({ productVariantRepository }: IProductVariantDependencies) => {
    return async (event: ICreateProductVariantEvent) => {
        const { productId, name, colorId, materialIds, measurements, supplier } = event.body

        try {
            const result = await prisma.$transaction(
                async (tx) => {
                    const written = await upsertProductVariantRows(tx, {
                        productId,
                        rows: [{
                            name,
                            measurements,
                            colorId: colorId ?? null,
                            materialIds: materialIds ?? [],
                            supplier: supplier ?? null,
                        }],
                    })
                    return written
                },
                { timeout: 15_000, maxWait: 10_000 },
            )

            // Aynı ölçü+versiyon zaten varsa YENİ varyant oluşmaz; bu bir hata
            // değildir — mevcut varyanta ikinci bir tedarikçi eklemek geçerli bir
            // işlemdir. Her iki durumda da etkilenen satır döndürülür.
            const [variantId] = result.affectedVariantIds
            if (!variantId) {
                throw new createError.BadRequest("No variant row was produced for the given input")
            }

            // Yazma sonrası kodlar nihai; satırı yeniden okuyup döndür.
            const [variant] = await productVariantRepository.listProductVariantsByIds([variantId])

            return apiResponseDTO({
                statusCode: result.createdVariants > 0 ? 201 : 200,
                payload: { productVariant: variant ?? null },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("Variant identifier (code) already exists");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to create product variant");
        }
    }
}
