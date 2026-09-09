/**
 * Ürün adını iki satıra böler: ilk 2 kelime üstte, kalanı altta. `AnimatedSplitProductTitle`
 * (yazı animasyonu) ve statik başlıklar (ör. `ProductDetailOverview`) AYNI kuralı paylaşır.
 */
export function splitProductTitleLines(title: string) {
    const words = title.trim().split(/\s+/).filter(Boolean)

    if (words.length <= 2) {
        return {
            firstLine: words.join(" "),
            secondLine: "",
        }
    }

    return {
        firstLine: words.slice(0, 2).join(" "),
        secondLine: words.slice(2).join(" "),
    }
}
