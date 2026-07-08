// Auth hata mesajları i18n kataloğunda: auth.errors.<code>.{title,description}
// (bkz. messages/tr.json). Bu lib yalnız gelen kodu geçerli bir katalog
// anahtarına indirger; çeviri, bileşende useTranslations("auth.errors") ile yapılır.
const AUTH_ERROR_CODES = [
    "Configuration",
    "AccessDenied",
    "Verification",
    "OAuthSignin",
    "OAuthCallback",
    "Callback",
    "SessionRequired",
    "INVALID_CREDENTIALS",
    "USER_NOT_CONFIRMED",
    "CODE_MISMATCH",
    "EXPIRED_CODE",
    "USERNAME_EXISTS",
    "TOO_MANY_REQUESTS",
    "UNSUPPORTED_CHALLENGE",
    "WEAK_PASSWORD",
    "PASSWORD_RESET_REQUIRED",
    "INVALID_PARAMETER",
    "AUTH_SERVICE_UNAVAILABLE",
    "RefreshTokenError",
    "UNKNOWN_AUTH_ERROR",
    "Default",
] as const

/**
 * Gelen hata kodunu `auth.errors` altında var olan bir anahtara indirger.
 * Bilinmeyen/eksik kodlar "Default"a düşer. `null` = gösterilecek hata yok.
 */
export function resolveAuthErrorKey(error?: string | null): string | null {
    if (!error) return null
    return (AUTH_ERROR_CODES as readonly string[]).includes(error) ? error : "Default"
}
