import { z } from "zod"

import {
    TRANSLATION_DRAFT_SCHEMA_VERSION,
    createTranslationSourceFingerprint,
} from "@/core/i18n/translationDraft"

const SOURCE_LOCALE = "tr" as const
const TARGET_LOCALE = "en" as const
const DEEPL_TARGET_LANGUAGE = "en-GB" as const

const sourceSchema = z.object({
    name: z.string().min(1),
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()

const targetSchema = z.object({
    name: z.string().min(1),
}).strict()

const measurementTypeEntrySchema = z.object({
    entity: z.literal("measurementType"),
    measurementTypeId: z.string().min(1),
    code: z.string().min(1),
    source: sourceSchema,
    target: targetSchema,
}).strict()

const materialEntrySchema = z.object({
    entity: z.literal("material"),
    materialId: z.string().min(1),
    code: z.string().nullable(),
    source: sourceSchema,
    target: targetSchema,
}).strict()

const colorEntrySchema = z.object({
    entity: z.literal("color"),
    colorId: z.string().min(1),
    system: z.string().min(1),
    code: z.string().min(1),
    source: sourceSchema,
    target: targetSchema,
}).strict()

const variantDictionaryTranslationDraftSchema = z.object({
    schemaVersion: z.literal(TRANSLATION_DRAFT_SCHEMA_VERSION),
    provider: z.literal("deepl"),
    entity: z.literal("variantDictionary"),
    sourceLocale: z.literal(SOURCE_LOCALE),
    targetLocale: z.literal(TARGET_LOCALE),
    deeplTargetLanguage: z.literal(DEEPL_TARGET_LANGUAGE),
    generatedAt: z.string().min(1),
    glossaryId: z.string().trim().min(1).nullable(),
    estimatedCharacters: z.number().int().nonnegative(),
    billedCharacters: z.number().int().nonnegative(),
    entries: z.array(z.discriminatedUnion("entity", [
        measurementTypeEntrySchema,
        materialEntrySchema,
        colorEntrySchema,
    ])),
}).strict().superRefine((draft, context) => {
    const keys = new Set<string>()

    for (const [index, entry] of draft.entries.entries()) {
        const entityId = getEntryEntityId(entry)
        const key = `${entry.entity}:${entityId}`
        if (keys.has(key)) {
            context.addIssue({
                code: "custom",
                message: `Duplicate draft entry: ${key}`,
                path: ["entries", index],
            })
        }
        keys.add(key)
    }
})

export type VariantDictionaryTranslationDraft = z.infer<typeof variantDictionaryTranslationDraftSchema>
export type VariantDictionaryTranslationDraftEntry = VariantDictionaryTranslationDraft["entries"][number]

export type VariantDictionaryTranslationCandidate =
    | {
        entity: "measurementType"
        measurementTypeId: string
        code: string
        sourceName: string
    }
    | {
        entity: "material"
        materialId: string
        code: string | null
        sourceName: string
    }
    | {
        entity: "color"
        colorId: string
        system: string
        code: string
        sourceName: string
    }

type TranslationState = {
    id: string
    translations: Array<{
        locale: string
        name: string
    }>
}

export type MeasurementTypeTranslationState = TranslationState & {
    code: string
}

export type MaterialTranslationState = TranslationState & {
    code: string | null
}

export type ColorTranslationState = TranslationState & {
    system: string
    code: string
}

export type MeasurementTypeTranslationWrite = {
    measurementTypeId: string
    locale: typeof TARGET_LOCALE
    name: string
}

export type MaterialTranslationWrite = {
    materialId: string
    locale: typeof TARGET_LOCALE
    name: string
}

export type ColorTranslationWrite = {
    colorId: string
    locale: typeof TARGET_LOCALE
    name: string
}

export type VariantDictionaryTranslationDraftStore = {
    loadMeasurementTypes(ids: string[]): Promise<MeasurementTypeTranslationState[]>
    loadMaterials(ids: string[]): Promise<MaterialTranslationState[]>
    loadColors(ids: string[]): Promise<ColorTranslationState[]>
    createManyAtomically(
        writes: {
            measurementTypes: MeasurementTypeTranslationWrite[]
            materials: MaterialTranslationWrite[]
            colors: ColorTranslationWrite[]
        },
        draft: VariantDictionaryTranslationDraft,
    ): Promise<{ measurementTypes: number; materials: number; colors: number }>
}

export class VariantDictionaryTranslationDraftError extends Error {}

function getEntryEntityId(entry: VariantDictionaryTranslationDraftEntry) {
    if (entry.entity === "measurementType") return entry.measurementTypeId
    if (entry.entity === "material") return entry.materialId
    return entry.colorId
}

function getCandidateEntityId(candidate: VariantDictionaryTranslationCandidate) {
    if (candidate.entity === "measurementType") return candidate.measurementTypeId
    if (candidate.entity === "material") return candidate.materialId
    return candidate.colorId
}

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

export function parseVariantDictionaryTranslationDraft(input: unknown) {
    const result = variantDictionaryTranslationDraftSchema.safeParse(input)
    if (!result.success) {
        const details = result.error.issues
            .map((issue) => `${issue.path.join(".") || "draft"}: ${issue.message}`)
            .join("; ")
        throw new VariantDictionaryTranslationDraftError(
            `Invalid variant dictionary translation draft: ${details}`,
        )
    }

    if (Number.isNaN(Date.parse(result.data.generatedAt))) {
        throw new VariantDictionaryTranslationDraftError(
            "Invalid variant dictionary translation draft: generatedAt is not a date",
        )
    }

    return result.data
}

export function createVariantDictionaryTranslationDraft({
    candidates,
    translatedNames,
    generatedAt = new Date(),
    glossaryId,
    estimatedCharacters,
    billedCharacters,
}: {
    candidates: VariantDictionaryTranslationCandidate[]
    translatedNames: string[]
    generatedAt?: Date
    glossaryId?: string
    estimatedCharacters: number
    billedCharacters: number
}): VariantDictionaryTranslationDraft {
    if (candidates.length !== translatedNames.length) {
        throw new VariantDictionaryTranslationDraftError(
            `Expected ${candidates.length} translations, received ${translatedNames.length}`,
        )
    }

    return parseVariantDictionaryTranslationDraft({
        schemaVersion: TRANSLATION_DRAFT_SCHEMA_VERSION,
        provider: "deepl",
        entity: "variantDictionary",
        sourceLocale: SOURCE_LOCALE,
        targetLocale: TARGET_LOCALE,
        deeplTargetLanguage: DEEPL_TARGET_LANGUAGE,
        generatedAt: generatedAt.toISOString(),
        glossaryId: glossaryId?.trim() || null,
        estimatedCharacters,
        billedCharacters,
        entries: candidates.map((candidate, index) => {
            const entityId = getCandidateEntityId(candidate)
            const common = {
                source: {
                    name: candidate.sourceName,
                    fingerprint: sourceFingerprint({
                        entityId,
                        sourceName: candidate.sourceName,
                    }),
                },
                target: {
                    name: translatedNames[index].trim(),
                },
            }

            if (candidate.entity === "measurementType") {
                return {
                    entity: candidate.entity,
                    measurementTypeId: candidate.measurementTypeId,
                    code: candidate.code,
                    ...common,
                }
            }

            if (candidate.entity === "material") {
                return {
                    entity: candidate.entity,
                    materialId: candidate.materialId,
                    code: candidate.code,
                    ...common,
                }
            }

            return {
                entity: candidate.entity,
                colorId: candidate.colorId,
                system: candidate.system,
                code: candidate.code,
                ...common,
            }
        }),
    })
}

export function buildVariantDictionaryTranslationWrites({
    draft,
    measurementTypes,
    materials,
    colors,
}: {
    draft: VariantDictionaryTranslationDraft
    measurementTypes: MeasurementTypeTranslationState[]
    materials: MaterialTranslationState[]
    colors: ColorTranslationState[]
}) {
    const measurementTypesById = new Map(measurementTypes.map((item) => [item.id, item]))
    const materialsById = new Map(materials.map((item) => [item.id, item]))
    const colorsById = new Map(colors.map((item) => [item.id, item]))
    const writes = {
        measurementTypes: [] as MeasurementTypeTranslationWrite[],
        materials: [] as MaterialTranslationWrite[],
        colors: [] as ColorTranslationWrite[],
    }
    const errors: string[] = []

    for (const entry of draft.entries) {
        if (entry.entity === "measurementType") {
            const measurementType = measurementTypesById.get(entry.measurementTypeId)
            if (!measurementType) {
                errors.push(`MeasurementType ${entry.code} no longer exists`)
                continue
            }
            if (measurementType.code !== entry.code) {
                errors.push(`MeasurementType ${entry.measurementTypeId} code changed from ${entry.code} to ${measurementType.code}`)
            }

            const write = validateEntry({
                entityLabel: `MeasurementType ${entry.code}`,
                entityId: measurementType.id,
                sourceName: entry.source.name,
                sourceFingerprint: entry.source.fingerprint,
                targetName: entry.target.name,
                translations: measurementType.translations,
                errors,
            })
            if (write) {
                writes.measurementTypes.push({
                    measurementTypeId: measurementType.id,
                    locale: TARGET_LOCALE,
                    name: write.name,
                })
            }
            continue
        }

        if (entry.entity === "material") {
            const material = materialsById.get(entry.materialId)
            if (!material) {
                errors.push(`Material ${entry.materialId} no longer exists`)
                continue
            }
            if (material.code !== entry.code) {
                errors.push(`Material ${entry.materialId} code changed from ${entry.code ?? "null"} to ${material.code ?? "null"}`)
            }

            const write = validateEntry({
                entityLabel: `Material ${entry.code ?? entry.materialId}`,
                entityId: material.id,
                sourceName: entry.source.name,
                sourceFingerprint: entry.source.fingerprint,
                targetName: entry.target.name,
                translations: material.translations,
                errors,
            })
            if (write) {
                writes.materials.push({
                    materialId: material.id,
                    locale: TARGET_LOCALE,
                    name: write.name,
                })
            }
            continue
        }

        const color = colorsById.get(entry.colorId)
        if (!color) {
            errors.push(`Color ${entry.system} ${entry.code} no longer exists`)
            continue
        }
        if (color.system !== entry.system || color.code !== entry.code) {
            errors.push(`Color ${entry.colorId} identity changed after draft generation`)
        }

        const write = validateEntry({
            entityLabel: `Color ${entry.system} ${entry.code}`,
            entityId: color.id,
            sourceName: entry.source.name,
            sourceFingerprint: entry.source.fingerprint,
            targetName: entry.target.name,
            translations: color.translations,
            errors,
        })
        if (write) {
            writes.colors.push({
                colorId: color.id,
                locale: TARGET_LOCALE,
                name: write.name,
            })
        }
    }

    if (errors.length > 0) {
        throw new VariantDictionaryTranslationDraftError(errors.join("\n"))
    }

    return writes
}

function validateEntry({
    entityLabel,
    entityId,
    sourceName,
    sourceFingerprint: expectedFingerprint,
    targetName,
    translations,
    errors,
}: {
    entityLabel: string
    entityId: string
    sourceName: string
    sourceFingerprint: string
    targetName: string
    translations: Array<{ locale: string; name: string }>
    errors: string[]
}) {
    const source = translations.find(({ locale }) => locale === SOURCE_LOCALE)
    const target = translations.find(({ locale }) => locale === TARGET_LOCALE)

    if (!source) {
        errors.push(`${entityLabel} has no ${SOURCE_LOCALE} translation`)
        return null
    }
    if (target) {
        errors.push(`${entityLabel} already has an ${TARGET_LOCALE} translation`)
        return null
    }

    const currentFingerprint = sourceFingerprint({
        entityId,
        sourceName: source.name,
    })
    if (source.name !== sourceName || currentFingerprint !== expectedFingerprint) {
        errors.push(`${entityLabel} source translation changed after draft generation`)
        return null
    }

    const name = targetName.trim()
    if (name.length < 1) {
        errors.push(`${entityLabel} target name must not be empty`)
        return null
    }

    return { name }
}

export async function applyVariantDictionaryTranslationDraft({
    draft,
    store,
}: {
    draft: VariantDictionaryTranslationDraft
    store: VariantDictionaryTranslationDraftStore
}) {
    if (draft.entries.length === 0) {
        throw new VariantDictionaryTranslationDraftError(
            "The variant dictionary translation draft has no entries",
        )
    }

    const measurementTypeIds = draft.entries
        .filter((entry): entry is Extract<VariantDictionaryTranslationDraftEntry, { entity: "measurementType" }> =>
            entry.entity === "measurementType")
        .map(({ measurementTypeId }) => measurementTypeId)
    const materialIds = draft.entries
        .filter((entry): entry is Extract<VariantDictionaryTranslationDraftEntry, { entity: "material" }> =>
            entry.entity === "material")
        .map(({ materialId }) => materialId)
    const colorIds = draft.entries
        .filter((entry): entry is Extract<VariantDictionaryTranslationDraftEntry, { entity: "color" }> =>
            entry.entity === "color")
        .map(({ colorId }) => colorId)

    const [measurementTypes, materials, colors] = await Promise.all([
        store.loadMeasurementTypes(measurementTypeIds),
        store.loadMaterials(materialIds),
        store.loadColors(colorIds),
    ])
    const writes = buildVariantDictionaryTranslationWrites({
        draft,
        measurementTypes,
        materials,
        colors,
    })

    const created = await store.createManyAtomically(writes, draft)
    if (
        created.measurementTypes !== writes.measurementTypes.length ||
        created.materials !== writes.materials.length ||
        created.colors !== writes.colors.length
    ) {
        throw new VariantDictionaryTranslationDraftError(
            `Expected to create ${writes.measurementTypes.length} measurement type, ${writes.materials.length} material, and ${writes.colors.length} color translations; created ${created.measurementTypes}, ${created.materials}, and ${created.colors}`,
        )
    }

    return { created, writes }
}
