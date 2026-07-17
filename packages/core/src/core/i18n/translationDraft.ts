import { createHash } from "node:crypto"

export const TRANSLATION_DRAFT_SCHEMA_VERSION = 1 as const

export function countUnicodeCharacters(value: string) {
    return Array.from(value).length
}

export function createTranslationSourceFingerprint({
    entityId,
    sourceLocale,
    fields,
}: {
    entityId: string
    sourceLocale: string
    fields: Record<string, string>
}) {
    const normalizedFields = Object.entries(fields).sort(([left], [right]) =>
        left.localeCompare(right),
    )

    return createHash("sha256")
        .update(JSON.stringify([entityId, sourceLocale, normalizedFields]))
        .digest("hex")
}
