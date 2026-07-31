import { TYPE, parse } from "@formatjs/icu-messageformat-parser"

/**
 * `messages/*.json` katalogları üzerinde saf işlemler.
 *
 * DB çevirilerinden farklı olarak buradaki metinler ICU MessageFormat taşıyor
 * (`{count}`, `{n, plural, ...}`) ve rich-text etiketleri içeriyor
 * (`<highlight>`, `<strong>`, `<br></br>`). Makine çevirisi bunları sessizce
 * bozabiliyor ve hata ancak o sayfa render edilirken runtime'da patlıyor —
 * bu yüzden doğrulama, yazma adımının ÖNKOŞULU.
 *
 * YAPRAK = metin. Diziler ve nesneler yalnızca KAPSAYICIDIR ve içlerine
 * inilir; katalogda hem `["a","b"]` hem `[{title,description}]` biçimleri var.
 * Yol gösterimi dizide indeks taşır: `home.services.cards[0].title`. Bu sayede
 * dizi uzunluğu ayrıca doğrulanmak zorunda değil — hedefe yalnız referansta
 * VAR OLAN indeksler yazılabiliyor.
 */

export type MessageTree = string | MessageTree[] | { [key: string]: MessageTree }
export type MessageNode = { [key: string]: MessageTree }

export class MessageCatalogError extends Error {}

function isPlainObject(value: unknown): value is { [key: string]: MessageTree } {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Kataloğu `a.b[0].c` → metin düz haritasına indirger; sıra referans sırasıdır. */
export function flattenCatalog(
    node: MessageTree,
    prefix = "",
    out = new Map<string, string>(),
) {
    if (typeof node === "string") {
        if (prefix) out.set(prefix, node)
        return out
    }

    if (Array.isArray(node)) {
        node.forEach((item, index) => flattenCatalog(item, `${prefix}[${index}]`, out))
        return out
    }

    if (isPlainObject(node)) {
        for (const [key, value] of Object.entries(node)) {
            flattenCatalog(value, prefix ? `${prefix}.${key}` : key, out)
        }
    }

    return out
}

/**
 * `a.b[0].c` → `["a","b",0,"c"]`.
 *
 * Katalog anahtarları `[A-Za-z0-9_]+` olduğu için bu gösterim tekil; nokta ya da
 * köşeli parantez içeren bir anahtar eklenirse burası da değişmeli.
 */
export function parseMessagePath(key: string): Array<string | number> {
    const segments: Array<string | number> = []

    for (const part of key.split(".")) {
        const match = /^([^[\]]*)((?:\[\d+\])*)$/.exec(part)
        if (!match) throw new MessageCatalogError(`Invalid message path: ${key}`)

        const [, name, indexes] = match
        if (name) segments.push(name)
        for (const index of indexes.matchAll(/\[(\d+)\]/g)) {
            segments.push(Number(index[1]))
        }
    }

    if (segments.length === 0) throw new MessageCatalogError(`Invalid message path: ${key}`)
    return segments
}

export function getAtPath(node: MessageNode, key: string): string | undefined {
    let current: MessageTree | undefined = node

    for (const segment of parseMessagePath(key)) {
        if (typeof segment === "number") {
            if (!Array.isArray(current)) return undefined
            current = current[segment]
        } else {
            if (!isPlainObject(current)) return undefined
            current = current[segment]
        }
    }

    return typeof current === "string" ? current : undefined
}

/** Yolu oluşturarak metni yazar; sayısal segment dizi, diğerleri nesne üretir. */
export function setAtPath(node: MessageNode, key: string, value: string) {
    const segments = parseMessagePath(key)
    let current: MessageTree = node

    for (const [position, segment] of segments.slice(0, -1).entries()) {
        const nextSegment = segments[position + 1]
        const container: MessageTree = typeof nextSegment === "number" ? [] : {}

        if (typeof segment === "number") {
            if (!Array.isArray(current)) {
                throw new MessageCatalogError(`Cannot write "${key}": expected an array at index ${segment}`)
            }
            if (current[segment] === undefined) current[segment] = container
            current = current[segment]
        } else {
            if (!isPlainObject(current)) {
                throw new MessageCatalogError(`Cannot write "${key}": expected a group at "${segment}"`)
            }
            if (current[segment] === undefined) current[segment] = container
            current = current[segment]
        }

        if (typeof current === "string") {
            throw new MessageCatalogError(
                `Cannot write "${key}": "${segment}" is already a message, not a container`,
            )
        }
    }

    const last = segments.at(-1)!
    if (typeof last === "number") {
        if (!Array.isArray(current)) {
            throw new MessageCatalogError(`Cannot write "${key}": expected an array at index ${last}`)
        }
        current[last] = value
    } else {
        if (!isPlainObject(current)) {
            throw new MessageCatalogError(`Cannot write "${key}": expected a group at "${last}"`)
        }
        current[last] = value
    }
}

/**
 * Çevrilmesi gereken anahtarlar: referansta olup hedefte OLMAYAN ya da boş
 * bırakılmış olanlar. Zaten çevrilmiş bir anahtar asla yeniden gönderilmez —
 * elle düzeltilmiş çeviriyi makine çevirisiyle ezmek en pahalı hata olurdu.
 *
 * Kaynağı BOŞ olan anahtarlar da atlanır: DeepL boş metni reddediyor ve boş bir
 * kaynağın çevirisi zaten yok.
 */
export function collectMissingKeys(reference: MessageNode, target: MessageNode) {
    const missing: Array<{ key: string; source: string }> = []

    for (const [key, source] of flattenCatalog(reference)) {
        if (source.trim() === "") continue

        const existing = getAtPath(target, key)
        if (existing === undefined || existing.trim() === "") {
            missing.push({ key, source })
        }
    }

    return missing
}

/** ICU AST'sinden argüman ve etiket adlarını toplar. */
export function extractPlaceholders(message: string) {
    const args = new Set<string>()
    const tags = new Set<string>()

    function walk(elements: ReturnType<typeof parse>) {
        for (const element of elements) {
            switch (element.type) {
                case TYPE.argument:
                case TYPE.number:
                case TYPE.date:
                case TYPE.time:
                    args.add(element.value)
                    break
                case TYPE.select:
                case TYPE.plural:
                    args.add(element.value)
                    for (const option of Object.values(element.options)) {
                        walk(option.value)
                    }
                    break
                case TYPE.tag:
                    tags.add(element.value)
                    walk(element.children)
                    break
                default:
                    break
            }
        }
    }

    walk(parse(message))
    return { args, tags }
}

/**
 * Bir çeviriyi referansına karşı doğrular. Boş dizi = sorun yok.
 *
 * Üç kural, üçü de gerçek bir runtime hatasına karşılık geliyor:
 *  1. ICU ayrıştırılabilir olmalı — bozuk `{`/`}` next-intl'de patlar.
 *  2. Argüman adları korunmalı — `{count}` düşerse metin sessizce yanlış görünür.
 *  3. Etiketler korunmalı — eksik `<highlight>` next-intl'de runtime hatası.
 *
 * ICU YAPISI eşitliği ARANMAZ: TR `{count} ürün`, EN `{count, plural, ...}`
 * meşrudur (Türkçede sayıdan sonra çoğul eki yoktur).
 */
export function validateTranslatedMessage({
    key,
    source,
    translated,
}: {
    key: string
    source: string
    translated: string
}): string[] {
    if (typeof translated !== "string") {
        return [`${key}: translation must be a string`]
    }
    if (translated.trim() === "") {
        return [`${key}: translation is empty`]
    }

    let expected: ReturnType<typeof extractPlaceholders>
    let actual: ReturnType<typeof extractPlaceholders>

    try {
        expected = extractPlaceholders(source)
    } catch (error) {
        // Referansın kendisi bozuksa çeviriyi suçlamak yanıltıcı olur.
        return [`${key}: reference message is not valid ICU (${(error as Error).message})`]
    }

    try {
        actual = extractPlaceholders(translated)
    } catch (error) {
        return [`${key}: translation is not valid ICU (${(error as Error).message})`]
    }

    const problems: string[] = []
    for (const argument of expected.args) {
        if (!actual.args.has(argument)) problems.push(`${key}: missing argument {${argument}}`)
    }
    for (const tag of expected.tags) {
        if (!actual.tags.has(tag)) problems.push(`${key}: missing tag <${tag}>`)
    }

    return problems
}

/** Katalogda ICU/etiket kurallarını ihlal eden TÜM girdileri toplar. */
export function validateTranslatedEntries(
    entries: Array<{ key: string; source: string; target: string }>,
) {
    return entries.flatMap(({ key, source, target }) =>
        validateTranslatedMessage({ key, source, translated: target }),
    )
}

/** Bir yolun ait olduğu en yakın dizi ön eki: `a.b[2].c` → `a.b`. */
function arrayPrefixes(key: string) {
    return [...key.matchAll(/\[\d+\]/g)].map((match) => key.slice(0, match.index))
}

/**
 * YARIM kalmış dizileri bulur — hedefte var olan ama referanstaki bütün
 * yapraklarını taşımayan diziler.
 *
 * NEDEN KRİTİK: mesaj birleştirme dizileri ELEMAN BAZINDA değil, BÜTÜN olarak
 * değiştiriyor (`loadMessages.mergeMessages`). Yani 7 hizmet kartının yalnız
 * 1'i çevrilmiş bir katalog, o dilde sayfada 7 kart yerine 1 kart gösterir —
 * eksik anahtarın Türkçe'ye düşmesi gibi zararsız bir durum DEĞİL, içerik
 * kaybı. Bu yüzden dizi ya tamamen çevrilir ya hiç yazılmaz.
 */
export function findIncompleteArrays(reference: MessageNode, target: MessageNode) {
    const referenceKeys = flattenCatalog(reference)
    const targetKeys = flattenCatalog(target)
    const touched = new Set<string>()

    for (const key of targetKeys.keys()) {
        for (const prefix of arrayPrefixes(key)) touched.add(prefix)
    }

    const incomplete: Array<{ arrayPath: string; missingKeys: string[] }> = []

    for (const arrayPath of [...touched].sort()) {
        const missingKeys = [...referenceKeys.keys()].filter(
            (key) => key.startsWith(`${arrayPath}[`) && !targetKeys.has(key),
        )

        if (missingKeys.length > 0) incomplete.push({ arrayPath, missingKeys })
    }

    return incomplete
}

/** Değerleri kataloğun bir KOPYASINA yazar; girdi nesnesi değişmez. */
export function applyTranslations(
    catalog: MessageNode,
    entries: Array<{ key: string; target: string }>,
) {
    const next = structuredClone(catalog)

    for (const { key, target } of entries) {
        setAtPath(next, key, target)
    }

    return next
}
