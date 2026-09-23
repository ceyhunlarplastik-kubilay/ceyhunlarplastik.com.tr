import type { FederationDenyReason } from "./errors"

/**
 * Federe (Google) ilk girişte "bu kimlik hangi yerel profile bağlanmalı?" kararı — SAF
 * fonksiyonlar, Cognito'ya hiç dokunmaz (bkz. handlePreSignUp.ts).
 *
 * Neden her zaman YEREL profil: uygulama DB'de `User.cognitoSub` ve `User.email` UNIQUE, ve
 * yönetim işlemleri (`addToGroup`, `deleteUser`...) `cognitoSub`'ı Cognito `Username` diye
 * gönderiyor — AWS federe-yalnız profilde `sub` kabul etmez (IdP kullanıcı adı `Google_…` şart).
 * Federe kimliği yerel profile bağlayınca token'lar hep yerel `sub` ile gelir ve mevcut
 * DB/grup/refresh mantığı hiç değişmez.
 */

export type FederatedIdentity = {
    providerName: string
    providerUserId: string
}

export type NativeUserSummary = {
    username: string
    /** Cognito `UserStatus`: CONFIRMED, UNCONFIRMED, FORCE_CHANGE_PASSWORD, EXTERNAL_PROVIDER, ... */
    status: string
}

export type FederatedAssessment =
    | { kind: "PASSTHROUGH" }
    | { kind: "DENY"; reason: FederationDenyReason }
    | { kind: "OK"; identity: FederatedIdentity; email: string }

export type FederatedSignUpDecision =
    | { action: "LINK_EXISTING"; nativeUsername: string }
    | { action: "CREATE_AND_LINK" }
    | { action: "DENY"; reason: FederationDenyReason }

/** Bağlama mantığı yalnız Google için yazıldı; başka sağlayıcı sessizce dokunulmadan geçer. */
const SUPPORTED_PROVIDER = "Google"

/** Cognito federe kullanıcı adı: `<Sağlayıcı>_<sağlayıcıdaki kimlik>` (ör. `Google_1084…`). */
export function parseFederatedUserName(userName: string | undefined): FederatedIdentity | null {
    if (!userName) return null

    const separator = userName.indexOf("_")
    if (separator <= 0) return null

    const providerName = userName.slice(0, separator)
    const providerUserId = userName.slice(separator + 1)
    if (!providerUserId) return null

    return { providerName, providerUserId }
}

/**
 * Cognito'ya gitmeden verilebilecek kararlar: desteklenmeyen sağlayıcı, e-posta yok,
 * e-posta doğrulanmamış. Doğrulanmamış e-posta ile ASLA bağlama yapılmaz —
 * `AdminLinkProviderForUser` başkasının profiline erişim verir (AWS: yalnız güvenilir
 * sağlayıcı öznitelikleriyle kullanılmalı).
 *
 * Sağlayıcı adı karşılaştırması BÜYÜK/küçük harfe DUYARSIZ olmak ZORUNDA: kubi havuzu
 * `UsernameConfiguration.CaseSensitive: false` (Cognito konsolunun güncel varsayılanı).
 * AWS dokümantasyonu: "case-insensitive havuzlarda Cognito federe kullanıcının TÜM kullanıcı
 * adını küçük harfe çevirir, IdP ön eki DAHİL" — yani `event.userName` `Google_…` değil
 * `google_…` gelir. Duyarlı karşılaştırma (`===`) burada SESSİZCE hep `PASSTHROUGH` üretirdi:
 * hiçbir hata fırlatmadan, hiçbir Google girişi asla bağlanmadı (kubi'de 2026-09-19 – 22
 * arası yaşandı — kanıt: Cognito'daki federe gölge kaydın `sub`'ı yerel profilin `sub`'ından
 * FARKLIYDI ve yerel profilin `identities` özniteliği tamamen boştu). Sonraki `authMiddleware`
 * çağrısı bu bilinmeyen `sub`'ı DB'de bulamayıp `email` üzerinde UNIQUE ihlaliyle çöktü.
 * `AdminLinkProviderForUser`'a giden `ProviderName` ise HAM (küçük harfli olabilen) değeri
 * DEĞİL, havuza KAYITLI kanonik adı (`SUPPORTED_PROVIDER`, "Google") kullanmalı — API bunu
 * bekliyor, kullanıcı adı büyük/küçük harf ayarından bağımsız.
 */
export function assessFederatedIdentity(
    userName: string | undefined,
    attributes: Record<string, string | undefined>,
): FederatedAssessment {
    const identity = parseFederatedUserName(userName)
    if (!identity || identity.providerName.toLowerCase() !== SUPPORTED_PROVIDER.toLowerCase()) {
        return { kind: "PASSTHROUGH" }
    }

    const email = attributes.email?.trim().toLowerCase()
    if (!email) return { kind: "DENY", reason: "EMAIL_MISSING" }

    if (String(attributes.email_verified).toLowerCase() !== "true") {
        return { kind: "DENY", reason: "EMAIL_NOT_VERIFIED" }
    }

    return { kind: "OK", identity: { ...identity, providerName: SUPPORTED_PROVIDER }, email }
}

/**
 * E-postası eşleşen kullanıcılara bakarak karar verir.
 *
 * - Yerel profil yok → yerel profil aç + bağla.
 * - `CONFIRMED` → bağla (e-postanın sahibi kodla kanıtladı).
 * - `FORCE_CHANGE_PASSWORD` → davet edilmiş ama kabul etmemiş: engelle. Davet akışı yetkili
 *   kalmalı (kabul, `acceptedAt`'i işaretler ve LEAD'i CUSTOMER'a çevirir; Google girişi
 *   bunu atlatmamalı).
 * - `UNCONFIRMED` → engelle: e-postanın sahibi olduğunu kimse kanıtlamadı (ön-ele-geçirme).
 */
export function decideFederatedSignUp(nativeUsers: NativeUserSummary[]): FederatedSignUpDecision {
    // Federe-yalnız (EXTERNAL_PROVIDER) kayıtlar bağlama hedefi olamaz.
    const locals = nativeUsers.filter((user) => user.status !== "EXTERNAL_PROVIDER")

    if (locals.length === 0) return { action: "CREATE_AND_LINK" }
    if (locals.length > 1) return { action: "DENY", reason: "ACCOUNT_UNAVAILABLE" }

    const [local] = locals

    switch (local.status) {
        case "CONFIRMED":
            return { action: "LINK_EXISTING", nativeUsername: local.username }
        case "FORCE_CHANGE_PASSWORD":
            return { action: "DENY", reason: "INVITATION_PENDING" }
        case "UNCONFIRMED":
            return { action: "DENY", reason: "ACCOUNT_NOT_CONFIRMED" }
        default:
            return { action: "DENY", reason: "ACCOUNT_UNAVAILABLE" }
    }
}
