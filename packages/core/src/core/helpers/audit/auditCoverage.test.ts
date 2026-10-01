import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { AUDIT_ENTITY_TYPES, type AuditEntityType } from "./types"

/**
 * Koruma: denetlenen bir modele yazan HER yol, denetim kaydını aynı transaction'da yazan
 * tek dosyadan geçmeli. Başka bir yerde doğrudan `prisma.category.update(...)` yazılırsa
 * hiçbir şey hata vermez — o değişiklik yalnızca geçmişte GÖRÜNMEZ. Bu test o sessiz
 * boşluğu yakalar (`realtimeCoverage.test.ts` ile aynı fikir).
 *
 * Yakalayamadığı: başka bir modelin iç içe yazması (`product.update({ data: { category:
 * { update } } })`) ve ham SQL. Bunları yazma — kategoriye repository'den yaz.
 */
const repoRoot = new URL("../../../../../../", import.meta.url)

type AuditedWritePath = {
    /** Modeli oluşturan Prisma delegeleri (kök + sahip olduğu alt tablolar). */
    delegates: string[]
    /** Bu delegelere yazmaya izinli TEK dosya. */
    allowedFile: string
    /**
     * API dışı, operatörün elle çalıştırdığı script'ler: denetim kaydı YAZMAZLAR (bilinen
     * boşluk, IMPROVEMENT_PLAN § Audit logging). Liste birebir eşleşmek zorunda: yeni bir
     * script eklenirse de, biri denetimli yola taşınırsa da test düşer ve liste güncellenir.
     */
    unauditedScripts: string[]
}

/** `Record<AuditEntityType, …>`: `AUDIT_ENTITY_TYPES`'a model eklenip buraya eklenmezse derlenmez. */
const AUDITED_WRITE_PATHS: Record<AuditEntityType, AuditedWritePath> = {
    Category: {
        delegates: ["category", "categoryTranslation"],
        allowedFile: "packages/core/src/core/helpers/prisma/categories/repository.ts",
        unauditedScripts: [
            "packages/core/prisma/backfill-category-translations.ts",
            "packages/core/prisma/backfill-product-industrial-usages.ts",
            "packages/core/prisma/translate-category-translations.ts",
            "packages/core/src/scripts/fillCategorySlugs.ts",
        ],
    },
}

const SCANNED_ROOTS = [
    "packages/core/src",
    "packages/core/prisma",
    "packages/core/scripts",
    "packages/functions/src",
    "packages/scripts/src",
]

const SKIPPED_DIRECTORIES = new Set(["node_modules", "generated", "migrations", "geo-source"])

const WRITE_METHODS = [
    "create",
    "createMany",
    "createManyAndReturn",
    "update",
    "updateMany",
    "updateManyAndReturn",
    "upsert",
    "delete",
    "deleteMany",
]

function listSourceFiles(relativeDirectory: string): string[] {
    let entries
    try {
        entries = readdirSync(new URL(`${relativeDirectory}/`, repoRoot), { withFileTypes: true })
    } catch {
        return []
    }

    return entries.flatMap((entry) => {
        const relativePath = `${relativeDirectory}/${entry.name}`

        if (entry.isDirectory()) {
            return SKIPPED_DIRECTORIES.has(entry.name) ? [] : listSourceFiles(relativePath)
        }
        if (!entry.name.endsWith(".ts") || entry.name.endsWith(".test.ts") || entry.name.endsWith(".d.ts")) {
            return []
        }
        return [relativePath]
    })
}

// Yorumlardaki örnek kod ("prisma.category.update(...)") ihlal sayılmasın.
const stripComments = (source: string) =>
    source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

const sources = SCANNED_ROOTS.flatMap(listSourceFiles).map((path) => ({
    path,
    code: stripComments(readFileSync(new URL(path, repoRoot), "utf8")),
}))

const filesMatching = (pattern: RegExp) =>
    sources.filter(({ code }) => pattern.test(code)).map(({ path }) => path).sort()

describe("audit kapsamı", () => {
    it("taranacak kaynak dosyaları bulur (yol bozulursa test boşa geçmesin)", () => {
        expect(sources.length).toBeGreaterThan(200)
        expect(Object.keys(AUDITED_WRITE_PATHS).sort()).toEqual([...AUDIT_ENTITY_TYPES].sort())
    })

    it.each(Object.entries(AUDITED_WRITE_PATHS))(
        "%s: doğrudan yazma yalnız denetimli repository'de",
        (_entityType, { delegates, allowedFile, unauditedScripts }) => {
            const directWrite = new RegExp(`\\.(${delegates.join("|")})\\.(${WRITE_METHODS.join("|")})\\(`)

            expect(filesMatching(directWrite)).toEqual([allowedFile, ...unauditedScripts].sort())
        },
    )

    it("AuditLog yalnız eklenir: güncelleme / silme / toplu yazma hiçbir yerde yok", () => {
        const forbidden = WRITE_METHODS.filter((method) => method !== "create")

        expect(filesMatching(new RegExp(`\\.auditLog\\.(${forbidden.join("|")})\\(`))).toEqual([])
    })

    it("AuditLog'a yazan tek yer writeAuditLog", () => {
        expect(filesMatching(/\.auditLog\.create\(/)).toEqual([
            "packages/core/src/core/helpers/audit/writeAuditLog.ts",
        ])
    })
})
