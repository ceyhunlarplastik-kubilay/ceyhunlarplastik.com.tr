import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

/**
 * Katalog testlerinin paylaştığı okuma/düzleştirme yardımcıları.
 *
 * `sourceLanguageLeakage` ve `scriptLeakage` aynı düzleştirme semantiğini
 * kullanıyor: her yaprak dize kendi anahtarıyla, diziler `[i]` sonekiyle.
 * (`messageCatalogs.test.ts` BİLEREK farklı davranıyor — dizinin kendisini de
 * birleştirip bir yaprak olarak kaydediyor, çünkü dizi uzunluğunu doğruluyor.
 * O yüzden burada birleştirilmedi.)
 *
 * Yalnız testlerden import edilir; client bundle'a girmez.
 */

export const messagesDir = fileURLToPath(new URL("../messages", import.meta.url))

type Tree = string | Tree[] | { [key: string]: Tree }

export function flattenCatalog(node: Tree, prefix = "", out = new Map<string, string>()) {
    if (typeof node === "string") {
        if (prefix) out.set(prefix, node)
        return out
    }
    if (Array.isArray(node)) {
        node.forEach((item, index) => flattenCatalog(item, `${prefix}[${index}]`, out))
        return out
    }
    for (const [key, value] of Object.entries(node)) {
        flattenCatalog(value, prefix ? `${prefix}.${key}` : key, out)
    }
    return out
}

export function loadCatalog(locale: string) {
    return flattenCatalog(
        JSON.parse(readFileSync(path.join(messagesDir, `${locale}.json`), "utf8"))
    )
}
