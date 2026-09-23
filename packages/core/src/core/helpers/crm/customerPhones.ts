// Göreli import BİLİNÇLİ: bu modül frontend'den de (`@core/*`) okunacak — form
// tarafındaki tekrar kontrolü sunucuyla AYNI anahtarı kullansın diye — ve
// frontend tsconfig'i core'un `@/core/*` alias'ını çözemiyor.
import { normalizePhoneNumberToE164 } from "../validation/phone"

/**
 * Müşterinin EK telefon numaraları. Birincil numara `Customer.phone`'da kalır;
 * buradaki kurallar yalnız `CustomerPhone` satırları içindir.
 *
 * Kural tek yerde: admin/temsilci güncellemesi (`buildCustomerUpdateData`),
 * veri girişi (`leadCustomers.ts`) ve frontend (form tekrar kontrolü
 * `features/customerPhones/schema`, gösterim `CustomerPhoneList`) bunu kullanır.
 */

/** Birincil numara HARİÇ en fazla bu kadar ek numara. */
export const CUSTOMER_ADDITIONAL_PHONE_LIMIT = 10

/** Etiket ("Muhasebe", "Satın Alma", "Cep (Ahmet Bey)") üst sınırı. */
export const CUSTOMER_PHONE_LABEL_MAX_LENGTH = 60

export type CustomerAdditionalPhoneInput = {
    number: string
    label?: string | null
}

export type NormalizedCustomerAdditionalPhone = {
    number: string
    label: string | null
    displayOrder: number
}

/**
 * İki numaranın AYNI HAT olup olmadığını karşılaştırma anahtarı — saklanan
 * değer DEĞİL; numara kullanıcının yazdığı biçimde saklanır.
 *
 * "0532 000 00 00", "+90 532 000 00 00" ve "905320000000" aynı E.164'e iner.
 * E.164'e indirgenemeyen biçimlerde (ör. "444 0 123" kısa numarası) yalnız
 * rakamlar karşılaştırılır; hiç rakam yoksa kırpılmış metin.
 */
export function customerPhoneKey(value: string): string {
    const trimmed = value.trim()

    return normalizePhoneNumberToE164(trimmed)
        ?? (trimmed.replace(/\D/g, "") || trimmed.toLocaleLowerCase("tr"))
}

export type CustomerPhoneEntry = {
    number: string
    label: string | null
    isPrimary: boolean
}

/**
 * Gösterim listesi: birincil numara ÖNCE, ardından ek numaralar `displayOrder`
 * sırasıyla. API zaten sıralı döndürüyor; burada yeniden sıralamak, listeyi
 * başka kaynaktan alan yüzeyleri de aynı kurala bağlar. Boş numara atılır.
 */
export function listCustomerPhones(customer: {
    phone?: string | null
    additionalPhones?: ReadonlyArray<{
        number: string
        label?: string | null
        displayOrder?: number
    }> | null
}): CustomerPhoneEntry[] {
    const primary = customer.phone?.trim()
    const additional = [...(customer.additionalPhones ?? [])]
        .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0))
        .filter((phone) => phone.number.trim())
        .map((phone) => ({
            number: phone.number.trim(),
            label: phone.label?.trim() || null,
            isPrimary: false,
        }))

    return primary
        ? [{ number: primary, label: null, isPrimary: true }, ...additional]
        : additional
}

/**
 * `tel:` bağlantısı. E.164'e inebiliyorsa uluslararası biçim ("tel:+905320000000"),
 * yoksa yalnız rakamlar ve `+` — boşluk/parantez telefon uygulamalarını şaşırtmasın.
 */
export function customerPhoneHref(value: string): string {
    const trimmed = value.trim()

    return `tel:${normalizePhoneNumberToE164(trimmed) ?? trimmed.replace(/[^\d+]/g, "")}`
}

/**
 * İstekten gelen ek numara listesini yazıma hazırlar:
 * - numara ve etiket kırpılır; boş numara atılır, boş etiket `null` olur;
 * - birincil numarayla ya da listede daha önce geçen bir numarayla AYNI HAT
 *   olan satır atılır (ilk geçen kazanır, kullanıcının sırası korunur);
 * - `displayOrder` kalan satırların sırasından yeniden üretilir;
 * - limitin üstü atılır (validator zaten sınırlıyor; bu bir emniyet).
 *
 * Tekrarı sessizce atmak bilinçli: aynı numarayı iki kez yazmak bir veri
 * girişi kazası, isteği 400 ile reddetmek kullanıcıya bir şey kazandırmıyor.
 */
export function normalizeCustomerAdditionalPhones(
    phones: readonly CustomerAdditionalPhoneInput[],
    options: { primaryPhone?: string | null } = {},
): NormalizedCustomerAdditionalPhone[] {
    const seenKeys = new Set<string>()
    const primaryPhone = options.primaryPhone?.trim()
    if (primaryPhone) seenKeys.add(customerPhoneKey(primaryPhone))

    const normalized: NormalizedCustomerAdditionalPhone[] = []

    for (const phone of phones) {
        if (normalized.length >= CUSTOMER_ADDITIONAL_PHONE_LIMIT) break

        const number = phone.number.trim()
        if (!number) continue

        const key = customerPhoneKey(number)
        if (seenKeys.has(key)) continue
        seenKeys.add(key)

        normalized.push({
            number,
            label: phone.label?.trim() || null,
            displayOrder: normalized.length,
        })
    }

    return normalized
}
