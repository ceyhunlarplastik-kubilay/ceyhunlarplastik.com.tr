/**
 * "Google ile devam et" akışı yalnız stage bayrağı açıksa vardır. Aynı bayrak altyapıda
 * (`infra/cognito.ts`) Google kimlik sağlayıcısını ve PreSignUp bağlama trigger'ını kurar —
 * yani bayrak kapalıyken Cognito'da Google yoktur ve buton/NextAuth sağlayıcısı da olmamalı.
 *
 * Çalışma zamanında okunur (`NEXT_PUBLIC_*` değil): sayfa Server Component'te bayrağı okuyup
 * butona prop olarak geçirir.
 */
export function isGoogleLoginEnabled() {
    return process.env.GOOGLE_LOGIN_ENABLED === "true"
}
