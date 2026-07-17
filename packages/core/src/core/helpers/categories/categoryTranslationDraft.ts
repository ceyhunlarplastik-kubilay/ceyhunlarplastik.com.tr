import { z } from "zod"

import { normalizeCategoryTranslations } from "./categoryTranslations"
import {
    TRANSLATION_DRAFT_SCHEMA_VERSION,
    createTranslationSourceFingerprint,
} from "../../i18n/translationDraft"

const SOURCE_LOCALE = "tr" as const
const TARGET_LOCALE = "en" as const
const DEEPL_TARGET_LANGUAGE = "en-GB" as const

const categoryTranslationDraftSchema = z.object({
    schemaVersion: z.literal(TRANSLATION_DRAFT_SCHEMA_VERSION),
    provider: z.literal("deepl"),
    entity: z.literal("category"),
    sourceLocale: z.literal(SOURCE_LOCALE),
    targetLocale: z.literal(TARGET_LOCALE),
    deeplTargetLanguage: z.literal(DEEPL_TARGET_LANGUAGE),
    generatedAt: z.string().min(1),
    glossaryId: z.string().trim().min(1).nullable(),
    estimatedCharacters: z.number().int().nonnegative(),
    billedCharacters: z.number().int().nonnegative(),
    entries: z.array(z.object({
        categoryId: z.string().min(1),
        categoryCode: z.number().int(),
        source: z.object({
            name: z.string().min(2),
            fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
        }).strict(),
        target: z.object({
            name: z.string().min(2),
            slug: z.string().min(1),
        }).strict(),
    }).strict()),
}).strict().superRefine((draft, context) => {
    const categoryIds = new Set<string>()
    const categoryCodes = new Set<number>()

    for (const [index, entry] of draft.entries.entries()) {
        if (categoryIds.has(entry.categoryId)) {
            context.addIssue({
                code: "custom",
                message: `Duplicate categoryId: ${entry.categoryId}`,
                path: ["entries", index, "categoryId"],
            })
        }
        if (categoryCodes.has(entry.categoryCode)) {
            context.addIssue({
                code: "custom",
                message: `Duplicate categoryCode: ${entry.categoryCode}`,
                path: ["entries", index, "categoryCode"],
            })
        }

        categoryIds.add(entry.categoryId)
        categoryCodes.add(entry.categoryCode)
    }
})

export type CategoryTranslationDraft = z.infer<typeof categoryTranslationDraftSchema>

export type CategoryTranslationState = {
    id: string
    code: number
    translations: Array<{
        locale: string
        name: string
        slug: string
    }>
}

export type CategoryTranslationWrite = {
    categoryId: string
    locale: typeof TARGET_LOCALE
    name: string
    slug: string
}

export type CategoryTranslationDraftStore = {
    loadCategories(categoryIds: string[]): Promise<CategoryTranslationState[]>
    findSlugOwners(locale: typeof TARGET_LOCALE, slugs: string[]): Promise<Array<{
        categoryId: string
        slug: string
    }>>
    createManyAtomically(
        writes: CategoryTranslationWrite[],
        draft: CategoryTranslationDraft,
    ): Promise<number>
}

export class CategoryTranslationDraftError extends Error {}

function sourceFingerprint(categoryId: string, sourceName: string) {
    return createTranslationSourceFingerprint({
        entityId: categoryId,
        sourceLocale: SOURCE_LOCALE,
        fields: { name: sourceName },
    })
}

export function parseCategoryTranslationDraft(input: unknown) {
    const result = categoryTranslationDraftSchema.safeParse(input)
    if (!result.success) {
        const details = result.error.issues
            .map((issue) => `${issue.path.join(".") || "draft"}: ${issue.message}`)
            .join("; ")
        throw new CategoryTranslationDraftError(`Invalid category translation draft: ${details}`)
    }

    if (Number.isNaN(Date.parse(result.data.generatedAt))) {
        throw new CategoryTranslationDraftError("Invalid category translation draft: generatedAt is not a date")
    }

    return result.data
}

export function createCategoryTranslationDraft({
    categories,
    translatedNames,
    generatedAt = new Date(),
    glossaryId,
    estimatedCharacters,
    billedCharacters,
}: {
    categories: Array<{ id: string; code: number; sourceName: string }>
    translatedNames: string[]
    generatedAt?: Date
    glossaryId?: string
    estimatedCharacters: number
    billedCharacters: number
}): CategoryTranslationDraft {
    if (categories.length !== translatedNames.length) {
        throw new CategoryTranslationDraftError(
            `Expected ${categories.length} translations, received ${translatedNames.length}`,
        )
    }

    return parseCategoryTranslationDraft({
        schemaVersion: TRANSLATION_DRAFT_SCHEMA_VERSION,
        provider: "deepl",
        entity: "category",
        sourceLocale: SOURCE_LOCALE,
        targetLocale: TARGET_LOCALE,
        deeplTargetLanguage: DEEPL_TARGET_LANGUAGE,
        generatedAt: generatedAt.toISOString(),
        glossaryId: glossaryId?.trim() || null,
        estimatedCharacters,
        billedCharacters,
        entries: categories.map((category, index) => {
            const normalized = normalizeCategoryTranslations({
                translations: [{
                    locale: TARGET_LOCALE,
                    name: translatedNames[index],
                }],
            }).translations[0]

            return {
                categoryId: category.id,
                categoryCode: category.code,
                source: {
                    name: category.sourceName,
                    fingerprint: sourceFingerprint(category.id, category.sourceName),
                },
                target: {
                    name: normalized.name,
                    slug: normalized.slug,
                },
            }
        }),
    })
}

export function buildCategoryTranslationWrites(
    draft: CategoryTranslationDraft,
    categories: CategoryTranslationState[],
) {
    const categoriesById = new Map(categories.map((category) => [category.id, category]))
    const slugOwners = new Map<string, string>()
    const writes: CategoryTranslationWrite[] = []
    const errors: string[] = []

    for (const entry of draft.entries) {
        const category = categoriesById.get(entry.categoryId)
        if (!category) {
            errors.push(`Category ${entry.categoryCode} no longer exists`)
            continue
        }
        if (category.code !== entry.categoryCode) {
            errors.push(`Category ${entry.categoryId} code changed from ${entry.categoryCode} to ${category.code}`)
        }

        const source = category.translations.find(({ locale }) => locale === draft.sourceLocale)
        const target = category.translations.find(({ locale }) => locale === draft.targetLocale)

        if (!source) {
            errors.push(`Category ${entry.categoryCode} has no ${draft.sourceLocale} translation`)
            continue
        }
        if (target) {
            errors.push(`Category ${entry.categoryCode} already has an ${draft.targetLocale} translation`)
            continue
        }

        const currentFingerprint = sourceFingerprint(category.id, source.name)
        if (
            source.name !== entry.source.name ||
            currentFingerprint !== entry.source.fingerprint
        ) {
            errors.push(`Category ${entry.categoryCode} source translation changed after draft generation`)
            continue
        }

        try {
            const normalized = normalizeCategoryTranslations({
                translations: [{
                    locale: TARGET_LOCALE,
                    name: entry.target.name,
                    slug: entry.target.slug,
                }],
            }).translations[0]
            const existingDraftOwner = slugOwners.get(normalized.slug)

            if (existingDraftOwner) {
                errors.push(
                    `Target slug "${normalized.slug}" is duplicated by categories ${existingDraftOwner} and ${entry.categoryCode}`,
                )
                continue
            }

            slugOwners.set(normalized.slug, String(entry.categoryCode))
            writes.push({
                categoryId: category.id,
                locale: TARGET_LOCALE,
                name: normalized.name,
                slug: normalized.slug,
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid target translation"
            errors.push(`Category ${entry.categoryCode}: ${message}`)
        }
    }

    if (errors.length > 0) {
        throw new CategoryTranslationDraftError(errors.join("\n"))
    }

    return writes
}

export async function applyCategoryTranslationDraft({
    draft,
    store,
}: {
    draft: CategoryTranslationDraft
    store: CategoryTranslationDraftStore
}) {
    if (draft.entries.length === 0) {
        throw new CategoryTranslationDraftError("The category translation draft has no entries")
    }

    const categoryIds = draft.entries.map(({ categoryId }) => categoryId)
    const categories = await store.loadCategories(categoryIds)
    const writes = buildCategoryTranslationWrites(draft, categories)
    const slugOwners = await store.findSlugOwners(
        draft.targetLocale,
        writes.map(({ slug }) => slug),
    )

    if (slugOwners.length > 0) {
        throw new CategoryTranslationDraftError(slugOwners
            .map(({ categoryId, slug }) => `Target slug "${slug}" is already used by category ${categoryId}`)
            .join("\n"))
    }

    const created = await store.createManyAtomically(writes, draft)
    if (created !== writes.length) {
        throw new CategoryTranslationDraftError(
            `Expected to create ${writes.length} translations, created ${created}`,
        )
    }

    return { created, writes }
}
