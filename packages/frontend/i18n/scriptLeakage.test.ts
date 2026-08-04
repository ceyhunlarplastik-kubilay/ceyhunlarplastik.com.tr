import { describe, expect, it } from "vitest"
import { SUPPORTED_LOCALES, type SupportedLocale } from "@core/i18n/locales"

import { routing } from "./routing"
import { loadCatalog } from "./catalogTestSupport"

/**
 * YAZI SİSTEMİ KALINTISI: Latin-dışı alfabeli bir dilin kataloğunda, cümlenin
 * içinde çevrilmeden kalmış Latin kelime.
 *
 * Bu, `sourceLanguageLeakage`'ın YAKALAYAMADIĞI bir kusur sınıfı. O test değerin
 * TR ile BİREBİR aynı olmasına bakar; buradaki kusurda değer TR ile aynı değil —
 * cümle düzgün çevrilmiş, içinde tek kelime yabancı kalmıştır:
 *
 *   ru: "…фильтруются по строкам «industrial usage» продукта."   ← İngilizce kalmış
 *   ru: "ARGE (Исследования и разработки)"                        ← Türkçe kısaltma
 *
 * İkisi de Dalga 2'de (ru) ELLE bulundu; bu test o elle taramayı kalıcı kapıya
 * çeviriyor, çünkü ar/ko/ja/zh/hi dalgalarında aynı sınıf tekrar edecek.
 *
 * NEDEN YALNIZ LATİN-DIŞI DİLLER: Almanca bir değerin içinde kalmış İngilizce
 * kelime, doğru Almanca'dan ayırt edilemez — ikisi de Latin. Kiril/Arap/Hangıl/
 * Kana/Han/Devanagari kataloglarda ise beklenen alfabe farklı olduğu için kalıntı
 * mekanik olarak görünür. Bu testin gücü tam olarak buradan gelir.
 */

/**
 * Her dilin yazı sistemi. `Record<SupportedLocale, …>` BİLİNÇLİ: `@core`'a yeni
 * bir dil eklendiğinde bu dosya DERLENMEZ ve sınıflandırma yapılmaya zorlanır.
 * `Set` kullanılsaydı yeni bir Latin-dışı dil sessizce denetim dışı kalırdı.
 */
const LOCALE_SCRIPT: Record<SupportedLocale, "latin" | "non-latin"> = {
    tr: "latin",
    en: "latin",
    de: "latin",
    fr: "latin",
    es: "latin",
    it: "latin",
    pt: "latin",
    pl: "latin",
    ru: "non-latin", // Kiril
    ar: "non-latin", // Arap
    ko: "non-latin", // Hangıl
    ja: "non-latin", // Kana + Han
    zh: "non-latin", // Han
    hi: "non-latin", // Devanagari
}

/**
 * Latin kalması MEŞRU olan parçalar. Sıra önemli değil — uzunluğa göre
 * sıralanıp uygulanıyorlar, böylece "Ceyhunlar Plastik" kısa "Ceyhunlar"dan
 * önce eşleşir.
 *
 * Özel adlar TEK PARÇA olarak yazılıyor, kelime kelime değil. Resmi unvandaki
 * `ve` bu yüzden tek başına listeye alınmadı: alınsaydı gerçek bir Türkçe
 * sızıntısındaki `ve` de maskelenirdi. Aynı ilke `Semt Garajı` için de geçerli.
 *
 * Yeni giriş eklerken NEDEN meşru olduğunu yaz — bu liste "çevrilmemiş" ile
 * "çevrilmemesi gereken" arasındaki tek ayrım noktası.
 */
const ALLOWED_LATIN: ReadonlyArray<readonly [text: string, reason: string]> = [
    // Marka ve resmi unvan
    ["Ceyhunlar Plastik Sanayi ve Ticaret Ltd. Şti.", "Ticaret sicilindeki resmi unvan"],
    ["Ceyhunlar Plastik Sanayii", "Kaynak metinde geçen unvan varyantı"],
    ["Ceyhunlar Plastik", "Marka"],
    ["Ceyhunlar", "Marka"],

    // Coğrafya / ulaşım özel adları
    ["İZBAN", "İzmir banliyö hattının özel adı"],
    ["Semt Garajı", "Durak adı — özel ad"],

    // Teknik terim ve kısaltmalar (her dilde Latin yazılır)
    ["AWS", "Ürün adı"],
    ["Cognito", "Ürün adı"],
    ["ISO", "Standart adı"],
    ["CAD", "Sektör kısaltması"],
    ["3D", "Uluslararası kullanım"],
    ["Copyright", "Telif ibaresi — hukuki kalıp"],
    ["PDF", "Dosya biçimi adı"],
    ["WhatsApp", "Ürün adı"],

    // Dalga 3 (ar). Arapça katalog "terim + parantez içinde Latin kısaltma"
    // üslubunu kullanıyor: «البحث والتطوير (R&D)». Bu ÇEVİRİ KUSURU DEĞİL, yerleşik
    // teknik yazım pratiği — kısaltma okurun tanıdığı biçimde bırakılıyor.
    ["R&D", "Sektör kısaltması — Arapça metinde terimin yanında parantez içinde veriliyor"],
    ["CNC", "Sektör kısaltması"],
    ["thermoset", "Malzeme terimi — Arapça karşılığın yanında parantez içinde"],
    ["refresh token", "Teknik terim — Arapça karşılığın yanında parantez içinde"],
    ["4A", "Fiziksel adresteki kapı numarası"],
]

const ALLOWED_SORTED = [...ALLOWED_LATIN]
    .map(([text]) => text)
    .sort((a, b) => b.length - a.length)

/**
 * Değerden, Latin kalması meşru olan her şeyi çıkarır: ICU yer tutucuları,
 * `<highlight>` gibi etiketler, URL ve e-posta adresleri, sonra özel adlar.
 * Geriye kalan Latin harf dizileri kalıntıdır.
 */
function findLatinResidue(value: string): string[] {
    let residue = value
        .replace(/\{[^}]*\}/g, "")
        .replace(/<[^>]*>/g, "")
        .replace(/https?:\/\/\S+/g, "")
        // E-posta adresleri: yerel kısım her dilde Latin yazılır
        .replace(/[\w.+-]+@[\w.-]+\.\w+/g, "")

    for (const allowed of ALLOWED_SORTED) {
        residue = residue.split(allowed).join("")
    }

    return residue.match(/\p{Script=Latin}+/gu) ?? []
}

/** Sunulan (routing.locales) VE Latin-dışı diller. */
const checkedLocales = routing.locales.filter(
    (locale) => LOCALE_SCRIPT[locale as SupportedLocale] === "non-latin"
)

describe("yazı sistemi kalıntısı", () => {
    it("her tanınan dil sınıflandırılmış", () => {
        // Record'un tip zorlaması derleme zamanında çalışır; bu kontrol
        // `@core`'daki listeyle çalışma zamanında da eşleştiğini doğrular.
        expect(Object.keys(LOCALE_SCRIPT).sort()).toEqual([...SUPPORTED_LOCALES].sort())
    })

    it("en az bir Latin-dışı dil denetleniyor", () => {
        // ru Dalga 2'de yayına alındı. Bu bekleyiş, kapının farkında olmadan
        // boşa düşmesini engeller (ör. bir dil listeden çıkarılırsa).
        expect(checkedLocales).not.toEqual([])
    })

    describe.each(checkedLocales)("%s", (locale) => {
        it("cümle içinde çevrilmemiş Latin kelime bırakmaz", () => {
            const leaks: string[] = []

            for (const [key, value] of loadCatalog(locale)) {
                const residue = findLatinResidue(value)
                if (residue.length === 0) continue

                leaks.push(`${key}: ${JSON.stringify(value)} → ${residue.join(" ")}`)
            }

            expect(leaks).toEqual([])
        })
    })
})
