import { z } from "zod"

import {
    TRANSLATION_DRAFT_SCHEMA_VERSION,
    createTranslationSourceFingerprint,
} from "@/core/i18n/translationDraft"

const SOURCE_LOCALE = "tr" as const
const TARGET_LOCALE = "en" as const
const DEEPL_TARGET_LANGUAGE = "en-GB" as const

const sourceSchema = z.object({
    usageFunction: z.string().min(1),
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()

const entrySchema = z.object({
    entity: z.literal("productIndustrialUsage"),
    productIndustrialUsageId: z.string().min(1),
    productId: z.string().min(1),
    productCode: z.string().min(1),
    source: sourceSchema,
    target: z.object({
        usageFunction: z.string().min(1),
    }).strict(),
}).strict()

const draftSchema = z.object({
    schemaVersion: z.literal(TRANSLATION_DRAFT_SCHEMA_VERSION),
    provider: z.literal("deepl"),
    entity: z.literal("productIndustrialUsage"),
    sourceLocale: z.literal(SOURCE_LOCALE),
    targetLocale: z.literal(TARGET_LOCALE),
    deeplTargetLanguage: z.literal(DEEPL_TARGET_LANGUAGE),
    generatedAt: z.string().min(1),
    glossaryId: z.string().trim().min(1).nullable(),
    estimatedCharacters: z.number().int().nonnegative(),
    billedCharacters: z.number().int().nonnegative(),
    entries: z.array(entrySchema),
}).strict().superRefine((draft, context) => {
    const usageIds = new Set<string>()

    for (const [index, entry] of draft.entries.entries()) {
        if (usageIds.has(entry.productIndustrialUsageId)) {
            context.addIssue({
                code: "custom",
                message: `Duplicate productIndustrialUsageId: ${entry.productIndustrialUsageId}`,
                path: ["entries", index, "productIndustrialUsageId"],
            })
        }
        usageIds.add(entry.productIndustrialUsageId)
    }
})

export type ProductIndustrialUsageTranslationDraft = z.infer<typeof draftSchema>

export type ProductIndustrialUsageTranslationState = {
    id: string
    productId: string
    product: {
        code: string
    }
    translations: Array<{
        locale: string
        usageFunction: string
    }>
}

export type ProductIndustrialUsageTranslationWrite = {
    productIndustrialUsageId: string
    locale: typeof TARGET_LOCALE
    usageFunction: string
}

export type ProductIndustrialUsageTranslationDraftStore = {
    loadUsages(usageIds: string[]): Promise<ProductIndustrialUsageTranslationState[]>
    createManyAtomically(
        writes: ProductIndustrialUsageTranslationWrite[],
        draft: ProductIndustrialUsageTranslationDraft,
    ): Promise<{ usages: number }>
}

export class ProductIndustrialUsageTranslationDraftError extends Error {}

function sourceFingerprint({
    entityId,
    usageFunction,
}: {
    entityId: string
    usageFunction: string
}) {
    return createTranslationSourceFingerprint({
        entityId,
        sourceLocale: SOURCE_LOCALE,
        fields: { usageFunction },
    })
}

export function parseProductIndustrialUsageTranslationDraft(input: unknown) {
    const result = draftSchema.safeParse(input)
    if (!result.success) {
        const details = result.error.issues
            .map((issue) => `${issue.path.join(".") || "draft"}: ${issue.message}`)
            .join("; ")
        throw new ProductIndustrialUsageTranslationDraftError(
            `Invalid product industrial usage translation draft: ${details}`,
        )
    }

    if (Number.isNaN(Date.parse(result.data.generatedAt))) {
        throw new ProductIndustrialUsageTranslationDraftError(
            "Invalid product industrial usage translation draft: generatedAt is not a date",
        )
    }

    return result.data
}

export function createProductIndustrialUsageTranslationDraft({
    candidates,
    translatedUsageFunctions,
    generatedAt = new Date(),
    glossaryId,
    estimatedCharacters,
    billedCharacters,
}: {
    candidates: Array<{
        productIndustrialUsageId: string
        productId: string
        productCode: string
        sourceUsageFunction: string
    }>
    translatedUsageFunctions: string[]
    generatedAt?: Date
    glossaryId?: string
    estimatedCharacters: number
    billedCharacters: number
}): ProductIndustrialUsageTranslationDraft {
    if (candidates.length !== translatedUsageFunctions.length) {
        throw new ProductIndustrialUsageTranslationDraftError(
            `Expected ${candidates.length} translations, received ${translatedUsageFunctions.length}`,
        )
    }

    return parseProductIndustrialUsageTranslationDraft({
        schemaVersion: TRANSLATION_DRAFT_SCHEMA_VERSION,
        provider: "deepl",
        entity: "productIndustrialUsage",
        sourceLocale: SOURCE_LOCALE,
        targetLocale: TARGET_LOCALE,
        deeplTargetLanguage: DEEPL_TARGET_LANGUAGE,
        generatedAt: generatedAt.toISOString(),
        glossaryId: glossaryId?.trim() || null,
        estimatedCharacters,
        billedCharacters,
        entries: candidates.map((candidate, index) => {
            const sourceUsageFunction = candidate.sourceUsageFunction.trim()

            return {
                entity: "productIndustrialUsage",
                productIndustrialUsageId: candidate.productIndustrialUsageId,
                productId: candidate.productId,
                productCode: candidate.productCode,
                source: {
                    usageFunction: sourceUsageFunction,
                    fingerprint: sourceFingerprint({
                        entityId: candidate.productIndustrialUsageId,
                        usageFunction: sourceUsageFunction,
                    }),
                },
                target: {
                    usageFunction: translatedUsageFunctions[index].trim(),
                },
            }
        }),
    })
}

export function buildProductIndustrialUsageTranslationWrites({
    draft,
    usages,
}: {
    draft: ProductIndustrialUsageTranslationDraft
    usages: ProductIndustrialUsageTranslationState[]
}) {
    const usagesById = new Map(usages.map((usage) => [usage.id, usage]))
    const writes: ProductIndustrialUsageTranslationWrite[] = []
    const errors: string[] = []

    for (const entry of draft.entries) {
        const usage = usagesById.get(entry.productIndustrialUsageId)
        if (!usage) {
            errors.push(`ProductIndustrialUsage ${entry.productIndustrialUsageId} no longer exists`)
            continue
        }
        if (usage.productId !== entry.productId) {
            errors.push(`ProductIndustrialUsage ${entry.productIndustrialUsageId} product changed after draft generation`)
        }
        if (usage.product.code !== entry.productCode) {
            errors.push(
                `ProductIndustrialUsage ${entry.productIndustrialUsageId} product code changed from ${entry.productCode} to ${usage.product.code}`,
            )
        }

        const source = usage.translations.find(({ locale }) => locale === draft.sourceLocale)
        const target = usage.translations.find(({ locale }) => locale === draft.targetLocale)

        if (!source) {
            errors.push(`ProductIndustrialUsage ${entry.productIndustrialUsageId} has no ${draft.sourceLocale} translation`)
            continue
        }
        if (target) {
            errors.push(`ProductIndustrialUsage ${entry.productIndustrialUsageId} already has an ${draft.targetLocale} translation`)
            continue
        }

        const currentFingerprint = sourceFingerprint({
            entityId: usage.id,
            usageFunction: source.usageFunction,
        })
        if (
            source.usageFunction !== entry.source.usageFunction ||
            currentFingerprint !== entry.source.fingerprint
        ) {
            errors.push(`ProductIndustrialUsage ${entry.productIndustrialUsageId} source translation changed after draft generation`)
            continue
        }

        const usageFunction = entry.target.usageFunction.trim()
        if (!usageFunction) {
            errors.push(`ProductIndustrialUsage ${entry.productIndustrialUsageId} target usageFunction is required`)
            continue
        }

        writes.push({
            productIndustrialUsageId: usage.id,
            locale: TARGET_LOCALE,
            usageFunction,
        })
    }

    if (errors.length > 0) {
        throw new ProductIndustrialUsageTranslationDraftError(errors.join("\n"))
    }

    return writes
}

export async function applyProductIndustrialUsageTranslationDraft({
    draft,
    store,
}: {
    draft: ProductIndustrialUsageTranslationDraft
    store: ProductIndustrialUsageTranslationDraftStore
}) {
    if (draft.entries.length === 0) {
        throw new ProductIndustrialUsageTranslationDraftError(
            "The product industrial usage translation draft has no entries",
        )
    }

    const usages = await store.loadUsages(
        draft.entries.map(({ productIndustrialUsageId }) => productIndustrialUsageId),
    )
    const writes = buildProductIndustrialUsageTranslationWrites({ draft, usages })
    const created = await store.createManyAtomically(writes, draft)

    if (created.usages !== writes.length) {
        throw new ProductIndustrialUsageTranslationDraftError(
            `Expected to create ${writes.length} product industrial usage translations, created ${created.usages}`,
        )
    }

    return { created, writes }
}
