import { readdirSync, readFileSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * RTL GÜVENLİĞİ: fiziksel yön sınıfları (`ml-`, `pr-`, `left-`, `text-left`…)
 * `dir="rtl"` altında aynalanmaz; mantıksal olanlar (`ms-`, `pe-`, `start-`,
 * `text-start`) aynalanır.
 *
 * Arapça (Dalga 3) hazırlığında public ağaçta 194 fiziksel kullanım, 0 mantıksal
 * kullanım bulundu — yani `<html dir="rtl">` tek başına düzeni çevirmiyordu.
 * Bu test, temizlenen alanların geri kirlenmesini engeller.
 *
 * NEDEN LTR İÇİN RİSKSİZ: mantıksal sınıflar LTR'de fiziksel karşılıklarıyla
 * BİREBİR aynı render eder. Geçiş, yayındaki 9 dil için davranışsal olarak
 * no-op'tur; kazanç yalnız RTL'de görünür.
 *
 * KAPSAM BİLİNÇLİ OLARAK DAR BAŞLIYOR: temizlenmemiş bir klasörü kapsama almak
 * testi kırmızıya boğar ve kapı işe yaramaz hale gelir. Her RTL dilimi bitince
 * `SCANNED_DIRS`'e kendi klasörünü ekler.
 */

const frontendRoot = fileURLToPath(new URL("..", import.meta.url))

/** Temizlenmiş ve artık korunan alanlar. AR-2/AR-3 buraya ekleme yapacak. */
const SCANNED_DIRS = [
    "components/ui", // AR-1
    "components/navigation", // AR-2
    "components/home", // AR-2
    "components/sections", // AR-2
    "features/public", // AR-3
]

/**
 * Fiziksel kalması MEŞRU olanlar. Her giriş gerekçeli — bu liste "çevrilmeyi
 * unutmuş" ile "çevrilmemesi gereken" arasındaki tek ayrım noktası.
 */
/**
 * Oynat üçgeni içi boş bir daireye optik olarak ortalanırken hafifçe ileri
 * itilir. Oynat ikonu RTL'de AYNALANMAZ — medya akış yönü yazı yönünden
 * bağımsızdır — dolayısıyla onu ortalayan itiş de aynalanmamalı. Mantıksala
 * çevrilirse RTL'de üçgen dairenin ters tarafına kaçar.
 */
const PLAY_ICON_REASON =
    "Oynat üçgeninin optik ortalaması — oynat ikonu RTL'de aynalanmaz, itiş de aynalanmamalı."

/**
 * vaul'ün `direction="left" | "right"` prop'u yazı yönünden BAĞIMSIZ, çağıranın
 * bilinçli seçtiği bir ekran kenarıdır (`top`/`bottom` ile aynı ailede) —
 * mantıksala çevrilirse `direction="right"` bir drawer, Arapça (RTL) altında
 * sessizce sol kenardan açılmaya başlar; bu, çağıran kodun kararını görünmez
 * biçimde tersine çevirir. RTL'de yön mirror'lamak istenirse bilinçli bir ürün
 * kararı olarak çağıran taraf `direction`'ı kendisi seçmeli.
 */
const DRAWER_DIRECTION_REASON =
    "vaul'ün direction=\"left\"/\"right\" prop'u ekran kenarıdır (top/bottom ile aynı aile), "
    + "yazı yönü değil — mantıksala çevrilirse RTL'de çağıranın seçtiği kenar sessizce değişir."

const ALLOWED: ReadonlyArray<{ file: string; pattern: string; reason: string }> = [
    {
        file: "components/ui/dialog.tsx",
        pattern: "left-[50%]",
        reason:
            "Ortalama. `-translate-x-[50%]` ile eşleşiyor ve translate de fizikseldir; " +
            "yalnız birini mantıksala çevirmek RTL'de ortalamayı bozar.",
    },
    {
        file: "components/ui/alert-dialog.tsx",
        pattern: "left-[50%]",
        reason: "Ortalama — dialog.tsx ile aynı gerekçe.",
    },
    {
        file: "components/navigation/NavigationProgress.tsx",
        pattern: "left-1/2",
        reason: "Ortalama — dialog.tsx ile aynı gerekçe (`-translate-x-1/2` ile eşleşiyor).",
    },
    {
        file: "features/public/products/components/ProductYoutubeEmbed.tsx",
        pattern: "ml-0.5",
        reason: PLAY_ICON_REASON,
    },
    {
        file: "features/public/about/components/AboutHero.tsx",
        pattern: "ml-[2px]",
        reason: PLAY_ICON_REASON,
    },
    {
        file: "components/ui/navigation-menu.tsx",
        pattern: "rounded-tl-sm",
        reason:
            "45° döndürülmüş baklava gösterge. Döndürme sonrası bu köşe görsel olarak " +
            "ÜST uçtur; mantıksala çevrilirse RTL'de yanlış köşe yuvarlanır.",
    },
    {
        file: "components/ui/drawer.tsx",
        pattern: "right-0",
        reason: DRAWER_DIRECTION_REASON,
    },
    {
        file: "components/ui/drawer.tsx",
        pattern: "border-l",
        reason: DRAWER_DIRECTION_REASON,
    },
    {
        file: "components/ui/drawer.tsx",
        pattern: "left-0",
        reason: DRAWER_DIRECTION_REASON,
    },
    {
        file: "components/ui/drawer.tsx",
        pattern: "border-r",
        reason: DRAWER_DIRECTION_REASON,
    },
]

/**
 * Animasyon yardımcıları yön adı taşır (`slide-in-from-left-52`) ama düzen
 * değildir — Radix bunları `data-[motion=from-start]` gibi MANTIKSAL bir
 * seçiciyle zaten doğru tarafa bağlıyor. Kapsam dışı.
 */
const ANIMATION = /\b(slide-(in-from|out-to)|fade-in|fade-out|zoom-(in|out))-[\w.-]+/g

const PHYSICAL = new RegExp(
    [
        String.raw`(?<![\w-])-?(ml|mr|pl|pr)-[\w./%[\]-]+`,
        String.raw`(?<![\w-])(left|right)-[\w./%[\]-]+`,
        String.raw`(?<![\w-])text-(left|right)\b`,
        String.raw`(?<![\w-])border-(l|r)(-[\w./%[\]-]+)?\b`,
        String.raw`(?<![\w-])rounded-(l|r|tl|tr|bl|br)-[\w./%[\]-]+`,
    ].join("|"),
    "g"
)

function collectFiles(dir: string): string[] {
    const absolute = path.join(frontendRoot, dir)
    return readdirSync(absolute).flatMap((entry) => {
        const relative = path.join(dir, entry)
        if (statSync(path.join(frontendRoot, relative)).isDirectory()) {
            return collectFiles(relative)
        }
        return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [relative] : []
    })
}

function findPhysical(relativePath: string): string[] {
    const source = readFileSync(path.join(frontendRoot, relativePath), "utf8")
        .replace(ANIMATION, "")

    const allowedHere = ALLOWED.filter((entry) => entry.file === relativePath)

    return (source.match(PHYSICAL) ?? []).filter(
        (hit) => !allowedHere.some((entry) => entry.pattern === hit)
    )
}

describe("RTL: mantıksal yön sınıfları", () => {
    it("izin listesindeki her dosya gerçekten taranıyor", () => {
        // Bir dosya taşınır/silinirse gerekçesi de sessizce ölmemeli.
        for (const entry of ALLOWED) {
            expect(
                SCANNED_DIRS.some((dir) => entry.file.startsWith(`${dir}/`)),
                `${entry.file} izin listesinde ama SCANNED_DIRS kapsamında değil`
            ).toBe(true)
        }
    })

    describe.each(SCANNED_DIRS)("%s", (dir) => {
        it("fiziksel yön sınıfı içermez", () => {
            const offenders = collectFiles(dir).flatMap((file) => {
                const hits = findPhysical(file)
                return hits.length === 0 ? [] : [`${file}: ${[...new Set(hits)].join(" ")}`]
            })

            expect(offenders).toEqual([])
        })
    })
})
