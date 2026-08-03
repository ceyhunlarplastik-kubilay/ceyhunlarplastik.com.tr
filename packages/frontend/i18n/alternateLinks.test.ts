import { describe, expect, it } from "vitest"

import {
    resolveAlternatePath,
    withPreservedQuery,
    type AlternateLink,
} from "./alternateLinks"

const links: AlternateLink[] = [
    { hreflang: "tr", href: "/urun/bakalit-tutamak" },
    { hreflang: "en", href: "/en/urun/bakelite-handle" },
    { hreflang: "de", href: "/de/urun/bakelitgriff" },
    { hreflang: "x-default", href: "/urun/bakalit-tutamak" },
]

describe("resolveAlternatePath", () => {
    it("dilin kendi slug'ını döndürür", () => {
        // Asıl mesele bu: dil değiştirici mevcut slug'ı koruduğunda
        // /de/urun/<tr-slug> üretiyordu ve doğru sayfaya ancak yönlendirmeyle
        // ulaşılıyordu.
        expect(resolveAlternatePath(links, "de")).toBe("/de/urun/bakelitgriff")
        expect(resolveAlternatePath(links, "tr")).toBe("/urun/bakalit-tutamak")
    })

    it("o dile çevrilmemişse null döner", () => {
        // hreflang yazılmamış demek: sayfanın o dilde karşılığı yok.
        // Çağıran genel rota davranışına düşer.
        expect(resolveAlternatePath(links, "fr")).toBeNull()
    })

    it("mutlak URL'den yalnız yolu alır", () => {
        // Origin taşınırsa router tam sayfa yükleme yapar.
        expect(resolveAlternatePath(
            [{ hreflang: "de", href: "https://ceyhunlarplastik.xyz/de/urun/x?a=1#b" }],
            "de",
        )).toBe("/de/urun/x?a=1#b")
    })

    it("boş ve bozuk href'leri atlar", () => {
        expect(resolveAlternatePath([{ hreflang: "de", href: "" }], "de")).toBeNull()
        expect(resolveAlternatePath([{ hreflang: "de", href: null }], "de")).toBeNull()
        expect(resolveAlternatePath([{ hreflang: "de", href: "http://" }], "de")).toBeNull()
    })

    it("baştaki eğik çizgiyi tamamlar", () => {
        expect(resolveAlternatePath([{ hreflang: "de", href: "de/urun/x" }], "de"))
            .toBe("/de/urun/x")
    })

    it("x-default'u dil sanmaz", () => {
        expect(resolveAlternatePath(links, "x-default")).toBe("/urun/bakalit-tutamak")
        // Gerçek bir dil istendiğinde x-default'a düşmez.
        expect(resolveAlternatePath(
            [{ hreflang: "x-default", href: "/urun/x" }],
            "de",
        )).toBeNull()
    })
})

describe("withPreservedQuery", () => {
    const measurementSearch =
        "?m=b30dec4a-54a7-48fd-940e-7e91afe17c57%3A25%7C6c142dc3-9a82-4070-bef3-54a74ed37cb4%3A15"

    it("adres çubuğundaki sorguyu hedef yola taşır", () => {
        // Asıl mesele bu: hreflang sorgusuz yazıldığı için varyantlar
        // sayfasında dil değiştirmek seçili ölçüyü düşürüyordu.
        expect(
            withPreservedQuery("/en/urun/105-series-plugs/varyantlar", {
                search: measurementSearch,
            }),
        ).toBe(`/en/urun/105-series-plugs/varyantlar${measurementSearch}`)
    })

    it("soru işareti olmadan verilen sorguyu da kabul eder", () => {
        expect(withPreservedQuery("/en/urunler", { search: "sayfa=2" }))
            .toBe("/en/urunler?sayfa=2")
    })

    it("hedefin kendi sorgusu varsa ona dokunmaz", () => {
        // Sunucunun yazdığı sorgu adres çubuğundakinden daha bilgilidir.
        expect(withPreservedQuery("/en/urun/x?a=1", { search: "?b=2" }))
            .toBe("/en/urun/x?a=1")
    })

    it("çapayı korur ve sorgudan sonra yazar", () => {
        expect(
            withPreservedQuery("/en/urun/x", {
                search: "?a=1",
                hash: "#product-variants",
            }),
        ).toBe("/en/urun/x?a=1#product-variants")
    })

    it("hedefin kendi çapası adres çubuğununkini ezer", () => {
        expect(withPreservedQuery("/en/urun/x#a", { hash: "#b" }))
            .toBe("/en/urun/x#a")
    })

    it("hedefin çapası varken sorguyu doğru yere yerleştirir", () => {
        expect(withPreservedQuery("/en/urun/x#a", { search: "?q=1" }))
            .toBe("/en/urun/x?q=1#a")
    })

    it("boş, tanımsız ve yalnız işaretten ibaret değerleri yok sayar", () => {
        // useSearchParams().toString() sorgusuz sayfada "" döner; window.location.hash
        // de çapasız sayfada "" olur. İkisi de yola tek başına "?" veya "#" eklememeli.
        expect(withPreservedQuery("/en/urun/x", {})).toBe("/en/urun/x")
        expect(withPreservedQuery("/en/urun/x", { search: "", hash: "" }))
            .toBe("/en/urun/x")
        expect(withPreservedQuery("/en/urun/x", { search: "?", hash: "#" }))
            .toBe("/en/urun/x")
    })
})
