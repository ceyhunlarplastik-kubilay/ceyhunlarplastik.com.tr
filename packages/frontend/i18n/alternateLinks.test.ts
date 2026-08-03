import { describe, expect, it } from "vitest"

import { resolveAlternatePath, type AlternateLink } from "./alternateLinks"

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
