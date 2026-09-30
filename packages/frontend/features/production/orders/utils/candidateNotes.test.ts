import { describe, expect, it } from "vitest"

import { candidateNoteSummary, splitCandidateNote } from "./candidateNotes"

describe("aday uyarıları", () => {
    it("core notunu başlık + ayrıntı olarak ayırır; iki nokta yoksa tamamı başlıktır", () => {
        expect(splitCandidateNote("Baskı ağırlığı: Baskı 66 g, kapasite 480 g (doluluk %14) — çok küçük; malzeme kovanda uzun bekler.")).toEqual({
            title: "Baskı ağırlığı",
            detail: "Baskı 66 g, kapasite 480 g (doluluk %14) — çok küçük; malzeme kovanda uzun bekler.",
        })
        expect(splitCandidateNote("Makine kartında engelli")).toEqual({ title: "Makine kartında engelli", detail: "" })
    })

    it("özet satırı başlıkları sırayla ve tekil yazar", () => {
        const notes = [
            "Baskı ağırlığı: çok küçük",
            "Merkezleme bileziği: Kalıp 125 mm, makine 160 mm",
            "Baskı ağırlığı: ikinci",
        ].map(splitCandidateNote)
        expect(candidateNoteSummary(notes)).toBe("Baskı ağırlığı · Merkezleme bileziği")
    })
})
