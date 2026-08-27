/**
 * Harita balonunda ve eşleşme listesinde gösterilen tek satırlık adres özeti.
 *
 * Tek yerde durur: müşteri haritası ile ürün→müşteri eşleşme haritası aynı
 * müşteriyi aynı metinle göstermeli, yoksa iki ekran aynı kaydı farklı yazar.
 */
export function buildCustomerAddressSummary(address: {
    line1: string
    district?: string | null
    city: string
    country: string
}) {
    return [address.line1, address.district, address.city, address.country]
        .filter(Boolean)
        .join(", ")
}
