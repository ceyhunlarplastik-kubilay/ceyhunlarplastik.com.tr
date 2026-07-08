import { z } from "zod";

/**
 * PROJE GENELİ FORM+ZOD i18n DESENİ (ilk uygulama — auth şemaları da bunu izleyecek):
 *
 * Zod şemaları modül seviyesindedir ve React hook'larına (useTranslations)
 * erişemez. Bu yüzden hardcoded mesaj yerine, çeviri fonksiyonunu parametre
 * alan "factory" fonksiyonları export ediyoruz. Bileşen `useTranslations` ile
 * ilgili `validation` namespace'ini alıp şemayı kurar (bkz. ProductRequestDialog).
 *
 * Neden factory (mesajı key olarak saklayıp render'da çevirmek yerine):
 * - Hata mesajları zodResolver'dan zaten çevrilmiş çıkar; paylaşılan
 *   Form/FormMessage primitifini değiştirmeye gerek kalmaz.
 * - Şema saf kalır: `t` yerine düz bir `(key)=>string` alır, i18n'e bağlı değildir.
 */

type ValidationT = (key: string) => string;

export function buildProductRequestSchema(t: ValidationT) {
    return z.object({
        companyName: z.string().min(2, t("companyNameRequired")),
        fullName: z.string().min(2, t("fullNameMin")),
        phone: z.string().min(10, t("phoneInvalid")),
        email: z.email(t("emailInvalid")),
        product: z.string().min(2, t("productRequired")),
    });
}

export type ProductRequestValues = z.infer<
    ReturnType<typeof buildProductRequestSchema>
>;

export function buildCatalogRequestSchema(t: ValidationT) {
    return z.object({
        companyName: z.string().min(2, t("companyNameRequired")),
        fullName: z.string().min(2, t("fullNameMin")),
        phone: z.string().min(10, t("phoneInvalid")),
        address: z.string().min(10, t("addressMin")),
    });
}

export type CatalogRequestValues = z.infer<
    ReturnType<typeof buildCatalogRequestSchema>
>;

export function buildMailSchema(t: ValidationT) {
    return z.object({
        fullName: z.string().min(2, t("fullNameMin")),
        phone: z.string().min(10, t("phoneInvalid")),
        email: z.email(t("emailInvalid")),
        message: z.string().min(10, t("messageMin")),
    });
}

export type MailValues = z.infer<ReturnType<typeof buildMailSchema>>;
