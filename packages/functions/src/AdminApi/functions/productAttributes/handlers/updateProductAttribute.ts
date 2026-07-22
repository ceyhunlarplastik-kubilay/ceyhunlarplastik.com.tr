import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductAttributeDependencies, IUpdateProductAttributeEvent } from "@/functions/AdminApi/types/productAttributes"
import { isSystemCustomerAssignableAttributeCode } from "@/core/helpers/productAttributes/customerAssignableAttributes"
import {
    ProductAttributeTranslationInputError,
    normalizeProductAttributeTranslations,
} from "@/core/helpers/productAttributes/productAttributeTranslations"
import { DEFAULT_LOCALE } from "@/core/i18n/locales"

export const updateProductAttributeHandler = ({ productAttributeRepository }: IProductAttributeDependencies) => {
    return async (event: IUpdateProductAttributeEvent) => {
        const { id } = event.pathParameters;
        const body = event.body;

        try {
            const existing = await productAttributeRepository.getProductAttribute(id);
            if (!existing) throw new createError.NotFound("Product attribute not found");

            if (
                isSystemCustomerAssignableAttributeCode(existing.code) &&
                body.code &&
                body.code !== existing.code
            ) {
                throw new createError.Conflict("Sistem müşteri profil alanının kodu değiştirilemez")
            }

            const nextCode = body.code ?? existing.code
            const {
                code,
                name,
                translations,
                removeTranslationLocales,
                displayOrder,
                isCustomerAssignable,
            } = body
            const removableLocales = new Set<string>(removeTranslationLocales ?? [])
            const conflictingLocales = translations
                ?.map((translation) => translation.locale)
                .filter((locale) => removableLocales.has(locale)) ?? []

            if (conflictingLocales.length > 0) {
                throw new createError.BadRequest(
                    `Cannot update and remove the same translation locale: ${conflictingLocales.join(", ")}`
                )
            }

            const normalized = normalizeProductAttributeTranslations({
                legacyName: name,
                translations,
            })
            const translationWrites = normalized.translations.length > 0 || removeTranslationLocales?.length
                ? {
                    ...(normalized.translations.length > 0 && {
                        upsert: normalized.translations.map((translation) => ({
                            where: {
                                productAttributeId_locale: {
                                    productAttributeId: id,
                                    locale: translation.locale,
                                },
                            },
                            create: translation,
                            update: {
                                name: translation.name,
                            },
                        })),
                    }),
                    ...(removeTranslationLocales?.length && {
                        deleteMany: {
                            locale: {
                                in: removeTranslationLocales.filter((locale) => locale !== DEFAULT_LOCALE),
                            },
                        },
                    }),
                }
                : undefined
            const updated = await productAttributeRepository.updateProductAttribute(id, {
                ...(code !== undefined && { code }),
                ...(normalized.turkish && { name: normalized.turkish.name }),
                ...(displayOrder !== undefined && { displayOrder }),
                ...(isCustomerAssignable !== undefined && { isCustomerAssignable }),
                ...(translationWrites && { translations: translationWrites }),
                ...(isSystemCustomerAssignableAttributeCode(nextCode) && {
                    isCustomerAssignable: true,
                }),
            });

            return apiResponseDTO({
                statusCode: 200,
                payload: { attribute: updated },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof ProductAttributeTranslationInputError) {
                throw new createError.BadRequest(err.message)
            }
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("Product attribute code or translation already exists");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to update product attribute");
        }
    }
}
