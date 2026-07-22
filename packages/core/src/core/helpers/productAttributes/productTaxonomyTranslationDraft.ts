import { z } from "zod"

import {
    TRANSLATION_DRAFT_SCHEMA_VERSION,
    createTranslationSourceFingerprint,
} from "@/core/i18n/translationDraft"
import { normalizeProductAttributeValueTranslations } from "./productAttributeTranslations"

const SOURCE_LOCALE = "tr" as const
const TARGET_LOCALE = "en" as const
const DEEPL_TARGET_LANGUAGE = "en-GB" as const

const sourceSchema = z.object({
    name: z.string().min(2),
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()

const attributeEntrySchema = z.object({
    entity: z.literal("productAttribute"),
    productAttributeId: z.string().min(1),
    productAttributeCode: z.string().min(1),
    source: sourceSchema,
    target: z.object({
        name: z.string().min(2),
    }).strict(),
}).strict()

const valueEntrySchema = z.object({
    entity: z.literal("productAttributeValue"),
    productAttributeValueId: z.string().min(1),
    attributeId: z.string().min(1),
    attributeCode: z.string().min(1),
    source: sourceSchema,
    target: z.object({
        name: z.string().min(2),
        slug: z.string().min(1),
    }).strict(),
}).strict()

const productTaxonomyTranslationDraftSchema = z.object({
    schemaVersion: z.literal(TRANSLATION_DRAFT_SCHEMA_VERSION),
    provider: z.literal("deepl"),
    entity: z.literal("productTaxonomy"),
    sourceLocale: z.literal(SOURCE_LOCALE),
    targetLocale: z.literal(TARGET_LOCALE),
    deeplTargetLanguage: z.literal(DEEPL_TARGET_LANGUAGE),
    generatedAt: z.string().min(1),
    glossaryId: z.string().trim().min(1).nullable(),
    estimatedCharacters: z.number().int().nonnegative(),
    billedCharacters: z.number().int().nonnegative(),
    entries: z.array(z.discriminatedUnion("entity", [
        attributeEntrySchema,
        valueEntrySchema,
    ])),
}).strict().superRefine((draft, context) => {
    const attributeIds = new Set<string>()
    const valueIds = new Set<string>()

    for (const [index, entry] of draft.entries.entries()) {
        if (entry.entity === "productAttribute") {
            if (attributeIds.has(entry.productAttributeId)) {
                context.addIssue({
                    code: "custom",
                    message: `Duplicate productAttributeId: ${entry.productAttributeId}`,
                    path: ["entries", index, "productAttributeId"],
                })
            }
            attributeIds.add(entry.productAttributeId)
            continue
        }

        if (valueIds.has(entry.productAttributeValueId)) {
            context.addIssue({
                code: "custom",
                message: `Duplicate productAttributeValueId: ${entry.productAttributeValueId}`,
                path: ["entries", index, "productAttributeValueId"],
            })
        }
        valueIds.add(entry.productAttributeValueId)
    }
})

export type ProductTaxonomyTranslationDraft = z.infer<typeof productTaxonomyTranslationDraftSchema>
export type ProductTaxonomyTranslationDraftEntry = ProductTaxonomyTranslationDraft["entries"][number]

export type ProductAttributeTranslationState = {
    id: string
    code: string
    translations: Array<{
        locale: string
        name: string
    }>
}

export type ProductAttributeValueTranslationState = {
    id: string
    attributeId: string
    attribute: {
        code: string
    }
    translations: Array<{
        locale: string
        name: string
        slug: string
    }>
}

export type ProductAttributeTranslationWrite = {
    productAttributeId: string
    locale: typeof TARGET_LOCALE
    name: string
}

export type ProductAttributeValueTranslationWrite = {
    productAttributeValueId: string
    attributeId: string
    locale: typeof TARGET_LOCALE
    name: string
    slug: string
}

export type ProductTaxonomyTranslationDraftStore = {
    loadAttributes(attributeIds: string[]): Promise<ProductAttributeTranslationState[]>
    loadValues(valueIds: string[]): Promise<ProductAttributeValueTranslationState[]>
    findValueSlugOwners(locale: typeof TARGET_LOCALE, slugs: Array<{
        attributeId: string
        slug: string
    }>): Promise<Array<{
        productAttributeValueId: string
        attributeId: string
        slug: string
    }>>
    createManyAtomically(
        writes: {
            attributes: ProductAttributeTranslationWrite[]
            values: ProductAttributeValueTranslationWrite[]
        },
        draft: ProductTaxonomyTranslationDraft,
    ): Promise<{ attributes: number; values: number }>
}

export class ProductTaxonomyTranslationDraftError extends Error {}

function sourceFingerprint({
    entityId,
    sourceName,
}: {
    entityId: string
    sourceName: string
}) {
    return createTranslationSourceFingerprint({
        entityId,
        sourceLocale: SOURCE_LOCALE,
        fields: { name: sourceName },
    })
}

export function parseProductTaxonomyTranslationDraft(input: unknown) {
    const result = productTaxonomyTranslationDraftSchema.safeParse(input)
    if (!result.success) {
        const details = result.error.issues
            .map((issue) => `${issue.path.join(".") || "draft"}: ${issue.message}`)
            .join("; ")
        throw new ProductTaxonomyTranslationDraftError(
            `Invalid product taxonomy translation draft: ${details}`,
        )
    }

    if (Number.isNaN(Date.parse(result.data.generatedAt))) {
        throw new ProductTaxonomyTranslationDraftError(
            "Invalid product taxonomy translation draft: generatedAt is not a date",
        )
    }

    return result.data
}

export function createProductTaxonomyTranslationDraft({
    candidates,
    translatedNames,
    generatedAt = new Date(),
    glossaryId,
    estimatedCharacters,
    billedCharacters,
}: {
    candidates: Array<
        | {
            entity: "productAttribute"
            productAttributeId: string
            productAttributeCode: string
            sourceName: string
        }
        | {
            entity: "productAttributeValue"
            productAttributeValueId: string
            attributeId: string
            attributeCode: string
            sourceName: string
        }
    >
    translatedNames: string[]
    generatedAt?: Date
    glossaryId?: string
    estimatedCharacters: number
    billedCharacters: number
}): ProductTaxonomyTranslationDraft {
    if (candidates.length !== translatedNames.length) {
        throw new ProductTaxonomyTranslationDraftError(
            `Expected ${candidates.length} translations, received ${translatedNames.length}`,
        )
    }

    return parseProductTaxonomyTranslationDraft({
        schemaVersion: TRANSLATION_DRAFT_SCHEMA_VERSION,
        provider: "deepl",
        entity: "productTaxonomy",
        sourceLocale: SOURCE_LOCALE,
        targetLocale: TARGET_LOCALE,
        deeplTargetLanguage: DEEPL_TARGET_LANGUAGE,
        generatedAt: generatedAt.toISOString(),
        glossaryId: glossaryId?.trim() || null,
        estimatedCharacters,
        billedCharacters,
        entries: candidates.map((candidate, index) => {
            const translatedName = translatedNames[index]
            const entityId = candidate.entity === "productAttribute"
                ? candidate.productAttributeId
                : candidate.productAttributeValueId

            if (candidate.entity === "productAttribute") {
                return {
                    entity: candidate.entity,
                    productAttributeId: candidate.productAttributeId,
                    productAttributeCode: candidate.productAttributeCode,
                    source: {
                        name: candidate.sourceName,
                        fingerprint: sourceFingerprint({
                            entityId,
                            sourceName: candidate.sourceName,
                        }),
                    },
                    target: {
                        name: translatedName.trim(),
                    },
                }
            }

            const normalized = normalizeProductAttributeValueTranslations({
                translations: [{
                    locale: TARGET_LOCALE,
                    name: translatedName,
                }],
            }).translations[0]

            return {
                entity: candidate.entity,
                productAttributeValueId: candidate.productAttributeValueId,
                attributeId: candidate.attributeId,
                attributeCode: candidate.attributeCode,
                source: {
                    name: candidate.sourceName,
                    fingerprint: sourceFingerprint({
                        entityId,
                        sourceName: candidate.sourceName,
                    }),
                },
                target: {
                    name: normalized.name,
                    slug: normalized.slug,
                },
            }
        }),
    })
}

export function buildProductTaxonomyTranslationWrites({
    draft,
    attributes,
    values,
}: {
    draft: ProductTaxonomyTranslationDraft
    attributes: ProductAttributeTranslationState[]
    values: ProductAttributeValueTranslationState[]
}) {
    const attributesById = new Map(attributes.map((attribute) => [attribute.id, attribute]))
    const valuesById = new Map(values.map((value) => [value.id, value]))
    const valueSlugOwners = new Map<string, string>()
    const writes = {
        attributes: [] as ProductAttributeTranslationWrite[],
        values: [] as ProductAttributeValueTranslationWrite[],
    }
    const errors: string[] = []

    for (const entry of draft.entries) {
        if (entry.entity === "productAttribute") {
            const attribute = attributesById.get(entry.productAttributeId)
            if (!attribute) {
                errors.push(`ProductAttribute ${entry.productAttributeCode} no longer exists`)
                continue
            }
            if (attribute.code !== entry.productAttributeCode) {
                errors.push(
                    `ProductAttribute ${entry.productAttributeId} code changed from ${entry.productAttributeCode} to ${attribute.code}`,
                )
            }

            const source = attribute.translations.find(({ locale }) => locale === draft.sourceLocale)
            const target = attribute.translations.find(({ locale }) => locale === draft.targetLocale)

            if (!source) {
                errors.push(`ProductAttribute ${entry.productAttributeCode} has no ${draft.sourceLocale} translation`)
                continue
            }
            if (target) {
                errors.push(`ProductAttribute ${entry.productAttributeCode} already has an ${draft.targetLocale} translation`)
                continue
            }

            const currentFingerprint = sourceFingerprint({
                entityId: attribute.id,
                sourceName: source.name,
            })
            if (
                source.name !== entry.source.name ||
                currentFingerprint !== entry.source.fingerprint
            ) {
                errors.push(`ProductAttribute ${entry.productAttributeCode} source translation changed after draft generation`)
                continue
            }

            const name = entry.target.name.trim()
            if (name.length < 2) {
                errors.push(`ProductAttribute ${entry.productAttributeCode} target name must be at least 2 characters`)
                continue
            }

            writes.attributes.push({
                productAttributeId: attribute.id,
                locale: TARGET_LOCALE,
                name,
            })
            continue
        }

        const value = valuesById.get(entry.productAttributeValueId)
        if (!value) {
            errors.push(`ProductAttributeValue ${entry.productAttributeValueId} no longer exists`)
            continue
        }
        if (value.attributeId !== entry.attributeId) {
            errors.push(`ProductAttributeValue ${entry.productAttributeValueId} attribute changed after draft generation`)
        }
        if (value.attribute.code !== entry.attributeCode) {
            errors.push(
                `ProductAttributeValue ${entry.productAttributeValueId} attribute code changed from ${entry.attributeCode} to ${value.attribute.code}`,
            )
        }

        const source = value.translations.find(({ locale }) => locale === draft.sourceLocale)
        const target = value.translations.find(({ locale }) => locale === draft.targetLocale)

        if (!source) {
            errors.push(`ProductAttributeValue ${entry.productAttributeValueId} has no ${draft.sourceLocale} translation`)
            continue
        }
        if (target) {
            errors.push(`ProductAttributeValue ${entry.productAttributeValueId} already has an ${draft.targetLocale} translation`)
            continue
        }

        const currentFingerprint = sourceFingerprint({
            entityId: value.id,
            sourceName: source.name,
        })
        if (
            source.name !== entry.source.name ||
            currentFingerprint !== entry.source.fingerprint
        ) {
            errors.push(`ProductAttributeValue ${entry.productAttributeValueId} source translation changed after draft generation`)
            continue
        }

        try {
            const normalized = normalizeProductAttributeValueTranslations({
                translations: [{
                    locale: TARGET_LOCALE,
                    name: entry.target.name,
                    slug: entry.target.slug,
                }],
            }).translations[0]
            const slugKey = `${value.attributeId}:${normalized.slug}`
            const existingDraftOwner = valueSlugOwners.get(slugKey)

            if (existingDraftOwner) {
                errors.push(
                    `Target slug "${normalized.slug}" is duplicated for attribute ${entry.attributeCode} by values ${existingDraftOwner} and ${entry.productAttributeValueId}`,
                )
                continue
            }

            valueSlugOwners.set(slugKey, entry.productAttributeValueId)
            writes.values.push({
                productAttributeValueId: value.id,
                attributeId: value.attributeId,
                locale: TARGET_LOCALE,
                name: normalized.name,
                slug: normalized.slug,
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid target translation"
            errors.push(`ProductAttributeValue ${entry.productAttributeValueId}: ${message}`)
        }
    }

    if (errors.length > 0) {
        throw new ProductTaxonomyTranslationDraftError(errors.join("\n"))
    }

    return writes
}

export async function applyProductTaxonomyTranslationDraft({
    draft,
    store,
}: {
    draft: ProductTaxonomyTranslationDraft
    store: ProductTaxonomyTranslationDraftStore
}) {
    if (draft.entries.length === 0) {
        throw new ProductTaxonomyTranslationDraftError(
            "The product taxonomy translation draft has no entries",
        )
    }

    const attributeIds = draft.entries
        .filter((entry): entry is Extract<ProductTaxonomyTranslationDraftEntry, { entity: "productAttribute" }> =>
            entry.entity === "productAttribute")
        .map(({ productAttributeId }) => productAttributeId)
    const valueIds = draft.entries
        .filter((entry): entry is Extract<ProductTaxonomyTranslationDraftEntry, { entity: "productAttributeValue" }> =>
            entry.entity === "productAttributeValue")
        .map(({ productAttributeValueId }) => productAttributeValueId)
    const [attributes, values] = await Promise.all([
        store.loadAttributes(attributeIds),
        store.loadValues(valueIds),
    ])
    const writes = buildProductTaxonomyTranslationWrites({ draft, attributes, values })
    const slugOwners = await store.findValueSlugOwners(
        draft.targetLocale,
        writes.values.map(({ attributeId, slug }) => ({ attributeId, slug })),
    )

    if (slugOwners.length > 0) {
        throw new ProductTaxonomyTranslationDraftError(slugOwners
            .map(({ productAttributeValueId, attributeId, slug }) =>
                `Target slug "${slug}" is already used by value ${productAttributeValueId} for attribute ${attributeId}`,
            )
            .join("\n"))
    }

    const created = await store.createManyAtomically(writes, draft)
    if (created.attributes !== writes.attributes.length || created.values !== writes.values.length) {
        throw new ProductTaxonomyTranslationDraftError(
            `Expected to create ${writes.attributes.length} attribute and ${writes.values.length} value translations, created ${created.attributes} and ${created.values}`,
        )
    }

    return { created, writes }
}
