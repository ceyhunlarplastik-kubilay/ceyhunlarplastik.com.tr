import { z } from "zod"

import {
    TRANSLATION_DRAFT_SCHEMA_VERSION,
    createTranslationSourceFingerprint,
} from "@/core/i18n/translationDraft"
import { normalizeProductTranslations } from "@/core/helpers/products/productTranslations"

const SOURCE_LOCALE = "tr" as const
const TARGET_LOCALE = "en" as const
const DEEPL_TARGET_LANGUAGE = "en-GB" as const

const productTranslationDraftSchema = z.object({
    schemaVersion: z.literal(TRANSLATION_DRAFT_SCHEMA_VERSION),
    provider: z.literal("deepl"),
    entity: z.literal("product"),
    sourceLocale: z.literal(SOURCE_LOCALE),
    targetLocale: z.literal(TARGET_LOCALE),
    deeplTargetLanguage: z.literal(DEEPL_TARGET_LANGUAGE),
    generatedAt: z.string().min(1),
    glossaryId: z.string().trim().min(1).nullable(),
    estimatedCharacters: z.number().int().nonnegative(),
    billedCharacters: z.number().int().nonnegative(),
    entries: z.array(z.object({
        productId: z.string().min(1),
        productCode: z.string().min(1),
        source: z.object({
            name: z.string().min(2),
            slug: z.string().min(1),
            description: z.string().nullable(),
            fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
        }).strict(),
        target: z.object({
            name: z.string().min(2),
            slug: z.string().min(1),
            description: z.string().nullable(),
        }).strict(),
    }).strict()),
}).strict().superRefine((draft, context) => {
    const productIds = new Set<string>()
    const productCodes = new Set<string>()

    for (const [index, entry] of draft.entries.entries()) {
        if (productIds.has(entry.productId)) {
            context.addIssue({
                code: "custom",
                message: `Duplicate productId: ${entry.productId}`,
                path: ["entries", index, "productId"],
            })
        }
        if (productCodes.has(entry.productCode)) {
            context.addIssue({
                code: "custom",
                message: `Duplicate productCode: ${entry.productCode}`,
                path: ["entries", index, "productCode"],
            })
        }

        productIds.add(entry.productId)
        productCodes.add(entry.productCode)
    }
})

export type ProductTranslationDraft = z.infer<typeof productTranslationDraftSchema>

export type ProductTranslationState = {
    id: string
    code: string
    translations: Array<{
        locale: string
        name: string
        slug: string
        description: string | null
    }>
}

export type ProductTranslationWrite = {
    productId: string
    locale: typeof TARGET_LOCALE
    name: string
    slug: string
    description: string | null
}

export type ProductTranslationDraftStore = {
    loadProducts(productIds: string[]): Promise<ProductTranslationState[]>
    findSlugOwners(locale: typeof TARGET_LOCALE, slugs: string[]): Promise<Array<{
        productId: string
        slug: string
    }>>
    createManyAtomically(
        writes: ProductTranslationWrite[],
        draft: ProductTranslationDraft,
    ): Promise<number>
}

export class ProductTranslationDraftError extends Error {}

function sourceFingerprint({
    productId,
    name,
    slug,
    description,
}: {
    productId: string
    name: string
    slug: string
    description: string | null
}) {
    return createTranslationSourceFingerprint({
        entityId: productId,
        sourceLocale: SOURCE_LOCALE,
        fields: {
            name,
            slug,
            description: description ?? "",
        },
    })
}

export function parseProductTranslationDraft(input: unknown) {
    const result = productTranslationDraftSchema.safeParse(input)
    if (!result.success) {
        const details = result.error.issues
            .map((issue) => `${issue.path.join(".") || "draft"}: ${issue.message}`)
            .join("; ")
        throw new ProductTranslationDraftError(`Invalid product translation draft: ${details}`)
    }

    if (Number.isNaN(Date.parse(result.data.generatedAt))) {
        throw new ProductTranslationDraftError("Invalid product translation draft: generatedAt is not a date")
    }

    return result.data
}

export function createProductTranslationDraft({
    products,
    translatedProducts,
    generatedAt = new Date(),
    glossaryId,
    estimatedCharacters,
    billedCharacters,
}: {
    products: Array<{
        id: string
        code: string
        sourceName: string
        sourceSlug: string
        sourceDescription: string | null
    }>
    translatedProducts: Array<{
        name: string
        description: string | null
    }>
    generatedAt?: Date
    glossaryId?: string
    estimatedCharacters: number
    billedCharacters: number
}): ProductTranslationDraft {
    if (products.length !== translatedProducts.length) {
        throw new ProductTranslationDraftError(
            `Expected ${products.length} product translations, received ${translatedProducts.length}`,
        )
    }

    return parseProductTranslationDraft({
        schemaVersion: TRANSLATION_DRAFT_SCHEMA_VERSION,
        provider: "deepl",
        entity: "product",
        sourceLocale: SOURCE_LOCALE,
        targetLocale: TARGET_LOCALE,
        deeplTargetLanguage: DEEPL_TARGET_LANGUAGE,
        generatedAt: generatedAt.toISOString(),
        glossaryId: glossaryId?.trim() || null,
        estimatedCharacters,
        billedCharacters,
        entries: products.map((product, index) => {
            const normalized = normalizeProductTranslations({
                translations: [{
                    locale: TARGET_LOCALE,
                    name: translatedProducts[index].name,
                    description: translatedProducts[index].description,
                }],
            }).translations[0]

            return {
                productId: product.id,
                productCode: product.code,
                source: {
                    name: product.sourceName,
                    slug: product.sourceSlug,
                    description: product.sourceDescription,
                    fingerprint: sourceFingerprint({
                        productId: product.id,
                        name: product.sourceName,
                        slug: product.sourceSlug,
                        description: product.sourceDescription,
                    }),
                },
                target: {
                    name: normalized.name,
                    slug: normalized.slug,
                    description: normalized.description,
                },
            }
        }),
    })
}

export function buildProductTranslationWrites(
    draft: ProductTranslationDraft,
    products: ProductTranslationState[],
) {
    const productsById = new Map(products.map((product) => [product.id, product]))
    const slugOwners = new Map<string, string>()
    const writes: ProductTranslationWrite[] = []
    const errors: string[] = []

    for (const entry of draft.entries) {
        const product = productsById.get(entry.productId)
        if (!product) {
            errors.push(`Product ${entry.productCode} no longer exists`)
            continue
        }
        if (product.code !== entry.productCode) {
            errors.push(`Product ${entry.productId} code changed from ${entry.productCode} to ${product.code}`)
        }

        const source = product.translations.find(({ locale }) => locale === draft.sourceLocale)
        const target = product.translations.find(({ locale }) => locale === draft.targetLocale)

        if (!source) {
            errors.push(`Product ${entry.productCode} has no ${draft.sourceLocale} translation`)
            continue
        }
        if (target) {
            errors.push(`Product ${entry.productCode} already has an ${draft.targetLocale} translation`)
            continue
        }

        const currentFingerprint = sourceFingerprint({
            productId: product.id,
            name: source.name,
            slug: source.slug,
            description: source.description,
        })

        if (
            source.name !== entry.source.name ||
            source.slug !== entry.source.slug ||
            source.description !== entry.source.description ||
            currentFingerprint !== entry.source.fingerprint
        ) {
            errors.push(`Product ${entry.productCode} source translation changed after draft generation`)
            continue
        }

        try {
            const normalized = normalizeProductTranslations({
                translations: [{
                    locale: TARGET_LOCALE,
                    name: entry.target.name,
                    slug: entry.target.slug,
                    description: entry.target.description,
                }],
            }).translations[0]
            const existingDraftOwner = slugOwners.get(normalized.slug)

            if (existingDraftOwner) {
                errors.push(
                    `Target slug "${normalized.slug}" is duplicated by products ${existingDraftOwner} and ${entry.productCode}`,
                )
                continue
            }

            slugOwners.set(normalized.slug, entry.productCode)
            writes.push({
                productId: product.id,
                locale: TARGET_LOCALE,
                name: normalized.name,
                slug: normalized.slug,
                description: normalized.description,
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid target translation"
            errors.push(`Product ${entry.productCode}: ${message}`)
        }
    }

    if (errors.length > 0) {
        throw new ProductTranslationDraftError(errors.join("\n"))
    }

    return writes
}

export async function applyProductTranslationDraft({
    draft,
    store,
}: {
    draft: ProductTranslationDraft
    store: ProductTranslationDraftStore
}) {
    if (draft.entries.length === 0) {
        throw new ProductTranslationDraftError("The product translation draft has no entries")
    }

    const productIds = draft.entries.map(({ productId }) => productId)
    const products = await store.loadProducts(productIds)
    const writes = buildProductTranslationWrites(draft, products)
    const slugOwners = await store.findSlugOwners(
        draft.targetLocale,
        writes.map(({ slug }) => slug),
    )

    if (slugOwners.length > 0) {
        throw new ProductTranslationDraftError(slugOwners
            .map(({ productId, slug }) => `Target slug "${slug}" is already used by product ${productId}`)
            .join("\n"))
    }

    const created = await store.createManyAtomically(writes, draft)
    if (created !== writes.length) {
        throw new ProductTranslationDraftError(
            `Expected to create ${writes.length} product translations, created ${created}`,
        )
    }

    return { created, writes }
}
