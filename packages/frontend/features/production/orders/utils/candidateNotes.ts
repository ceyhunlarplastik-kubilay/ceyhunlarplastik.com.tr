/** Aday uyarısı: core uygunluk kontrolünün "Etiket: açıklama" metni başlık + ayrıntı olarak. */
export type CandidateNote = { title: string; detail: string }

/**
 * `orderCandidates` notları `${check.label}: ${check.message}` biçimindedir. Başlık kısa özet satırında,
 * ayrıntı yalnız açılınca gösterilir — uzun metin kart yüksekliğini şişirmesin diye.
 */
export function splitCandidateNote(note: string): CandidateNote {
    const index = note.indexOf(": ")
    if (index <= 0) return { title: note.trim(), detail: "" }
    return { title: note.slice(0, index).trim(), detail: note.slice(index + 2).trim() }
}

/** Özet satırı: "Baskı ağırlığı · Merkezleme bileziği" (aynı başlık bir kez). */
export function candidateNoteSummary(notes: CandidateNote[]): string {
    return [...new Set(notes.map((note) => note.title))].join(" · ")
}
