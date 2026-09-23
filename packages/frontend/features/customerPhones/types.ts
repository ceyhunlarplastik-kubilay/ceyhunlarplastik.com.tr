/**
 * Ek telefon — API yanıtındaki `additionalPhones` elemanı. Birincil numara bu
 * listede DEĞİL, müşterinin `phone` alanındadır (bkz. ARCHITECTURE.md
 * "Customer CRM and portal model").
 */
export type CustomerPhone = {
    id: string
    number: string
    label: string | null
    displayOrder: number
}
