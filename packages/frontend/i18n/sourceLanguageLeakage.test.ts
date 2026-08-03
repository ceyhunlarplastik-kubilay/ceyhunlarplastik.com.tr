import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { routing } from "./routing"

/**
 * KAYNAK DİL SIZINTISI: bir dilin kataloğunda Türkçe metnin olduğu gibi kalması.
 *
 * Makine çevirisi bazı metinleri hiç çeviremez ve kaynağı aynen geri verir. Bu,
 * diğer katalog testlerinin hiçbirine takılmaz — ICU geçerli, argümanlar yerinde,
 * dizi uzunluğu doğru — ama kullanıcı Almanca sayfada "Ceyhunlar Tanıtım" ya da
 * "{count} H.M." görür.
 *
 * Gerçekte yaşandı: 12 dilin tamamında `{count} H.M.` (Ham Madde) ve
 * `ornek@ceyhunlar.com` çevrilmeden kaldı; fr/ru/ar/ko/ja/zh'de "DOSTU" olduğu
 * gibi durdu ve banner "NATURE DOSTU" oldu.
 *
 * KAPSAM: yalnız `routing.locales` — yani GERÇEKTEN SUNULAN diller. Bir dil
 * canlıya alınmadan kataloğu kısmi olabilir (fallback zinciri onu İngilizce'ye
 * düşürür, bu tasarım gereği). Ama `routing.locales`'a eklendiği anda bu test
 * devreye girer: **bir dil, kaynak dil sızıntısıyla yayına giremez.**
 */

const messagesDir = fileURLToPath(new URL("../messages", import.meta.url))

/** Çeviriye tabi olmayan özel adlar. */
const BRAND_TOKENS = ["Ceyhunlar", "Plastik"]

/**
 * Türkçe ile aynı kalması BEKLENEN anahtarlar; her biri gerekçeli.
 *
 * Yeni giriş eklerken gerekçeyi yaz — bu liste "çeviri unutulmuş" ile
 * "çevrilmemesi gereken" arasındaki tek ayrım noktası.
 */
const INTENTIONALLY_IDENTICAL = new Map<string, string>([
    ["chrome.footer.address", "Fiziksel adres — çevrilmez"],
    ["public.contact.addressLine1", "Fiziksel adres — çevrilmez"],
    ["public.contact.addressLine2", "Fiziksel adres — çevrilmez"],
    ["public.suggestion.form.fields.phone", "Telefon numarası biçimi örneği"],
    ["public.hr.form.fields.phone", "Telefon numarası biçimi örneği"],
    ["public.productDetail.quickNav.model3d", "'3D Model' uluslararası kullanım"],
    ["public.productDetail.assets.model3d.badge", "'3D Model' uluslararası kullanım"],
    ["public.productDetail.assets.model3d.title", "'3D Model' uluslararası kullanım"],
    ["public.productVariant.details.fullCode", "Kaynak metnin kendisi zaten İngilizce"],
    ["public.about.details.mottoImageAlt", "'Motto' birçok dilde aynı"],
])

/**
 * Türkçe kelimenin hedef dilde de AYNI yazıldığı durumlar — sızıntı değil,
 * doğru çeviri. Dil bazlı, çünkü yalnız o dilde tesadüf.
 */
const IDENTICAL_BY_COINCIDENCE = new Map<string, Set<string>>([
    ["public.contact.form.phone", new Set(["de", "pl"])],
    ["public.customerLead.phonePlaceholder", new Set(["de", "pl"])],
    ["chrome.mobileMenu.title", new Set(["de"])],
    ["public.cart.codeLabel", new Set(["pl"])],
    ["public.productFilter.codePrefix", new Set(["pl"])],
    ["public.productVariant.table.colCode", new Set(["pl"])],
    ["public.productVariant.table.codeCount", new Set(["pl"])],
    ["chrome.dialogs.catalogRequest.fields.address", new Set(["pl"])],
    ["public.hr.form.fields.address", new Set(["pl"])],
])

type Tree = string | Tree[] | { [key: string]: Tree }

function flatten(node: Tree, prefix = "", out = new Map<string, string>()) {
    if (typeof node === "string") {
        if (prefix) out.set(prefix, node)
        return out
    }
    if (Array.isArray(node)) {
        node.forEach((item, index) => flatten(item, `${prefix}[${index}]`, out))
        return out
    }
    for (const [key, value] of Object.entries(node)) {
        flatten(value, prefix ? `${prefix}.${key}` : key, out)
    }
    return out
}

function loadCatalog(locale: string) {
    return flatten(JSON.parse(readFileSync(path.join(messagesDir, `${locale}.json`), "utf8")))
}

/**
 * Çevrilecek bir şey taşımayan değer: sayı/simge, yalnız yer tutucu, ya da
 * yalnız marka adı. "Ceyhunlar Plastik" her dilde aynı kalır ama
 * "Ceyhunlar Plastik Üretim" kalmamalı — bu yüzden marka token'ları çıkarılıp
 * geriye harf kalıp kalmadığına bakılıyor.
 */
function hasTranslatableContent(value: string) {
    let residue = value.replace(/\{[^}]*\}/g, "")
    for (const token of BRAND_TOKENS) {
        residue = residue.split(token).join("")
    }
    return /\p{Letter}/u.test(residue)
}

const referenceLocale = routing.defaultLocale
const reference = loadCatalog(referenceLocale)

/** Sunulan diller — varsayılan dil kaynağın kendisi olduğu için hariç. */
const servedLocales = routing.locales.filter((locale) => locale !== referenceLocale)

describe("kaynak dil sızıntısı", () => {
    it("kontrol edilen diller routing.locales ile aynı", () => {
        // Bu testin kapsamı bilinçli olarak yayın listesine bağlı; liste
        // büyüdüğünde kontrol kendiliğinden o dilleri de kapsamalı.
        expect(servedLocales.length).toBeGreaterThan(0)
    })

    describe.each(servedLocales)("%s", (locale) => {
        it("Türkçe metni olduğu gibi taşımaz", () => {
            const catalog = loadCatalog(locale)
            const leaks: string[] = []

            for (const [key, value] of catalog) {
                if (reference.get(key) !== value) continue
                if (!hasTranslatableContent(value)) continue
                if (INTENTIONALLY_IDENTICAL.has(key)) continue
                if (IDENTICAL_BY_COINCIDENCE.get(key)?.has(locale)) continue

                leaks.push(`${key}: ${JSON.stringify(value)}`)
            }

            expect(leaks).toEqual([])
        })
    })
})
