export const AUTH_ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
    Configuration: {
        title: "Kimlik doğrulama yapılandırması hatalı",
        description: "Sistem yapılandırmasında bir sorun oluştu. Lütfen teknik ekiple iletişime geçin.",
    },
    AccessDenied: {
        title: "Erişim izni verilmedi",
        description: "Bu çalışma alanına giriş yetkiniz bulunmuyor veya giriş politikanız erişimi engelledi.",
    },
    Verification: {
        title: "Doğrulama bağlantısı geçersiz",
        description: "Doğrulama bağlantısının süresi dolmuş veya bağlantı daha önce kullanılmış olabilir.",
    },
    OAuthSignin: {
        title: "Giriş akışı başlatılamadı",
        description: "Cognito oturumu başlatılırken bir hata oluştu. Sayfayı yenileyip tekrar deneyin.",
    },
    OAuthCallback: {
        title: "Giriş yanıtı işlenemedi",
        description: "Kimlik sağlayıcıdan gelen yanıt tamamlanamadı. Tekrar deneyin.",
    },
    Callback: {
        title: "Kimlik doğrulama tamamlanamadı",
        description: "Oturum açma işlemi sırasında beklenmeyen bir hata oluştu.",
    },
    SessionRequired: {
        title: "Oturum gerekli",
        description: "Bu sayfayı görüntülemek için önce giriş yapmanız gerekiyor.",
    },
    INVALID_CREDENTIALS: {
        title: "Giriş bilgileri hatalı",
        description: "E-posta adresinizi ve şifrenizi kontrol edip tekrar deneyin.",
    },
    USER_NOT_CONFIRMED: {
        title: "Hesap doğrulanmamış",
        description: "Devam etmek için hesabınızı doğrulamanız gerekiyor. Doğrulama kodu ekranına geçebilirsiniz.",
    },
    CODE_MISMATCH: {
        title: "Kod doğrulanamadı",
        description: "Girdiğiniz doğrulama kodu geçerli değil. Kodu kontrol edip tekrar deneyin.",
    },
    EXPIRED_CODE: {
        title: "Kodun süresi doldu",
        description: "Doğrulama kodunun süresi dolmuş görünüyor. Yeni kod isteyip tekrar deneyin.",
    },
    USERNAME_EXISTS: {
        title: "Bu e-posta zaten kayıtlı",
        description: "Bu adres için mevcut bir hesap var. Giriş yapabilir veya şifre sıfırlama akışını kullanabilirsiniz.",
    },
    TOO_MANY_REQUESTS: {
        title: "Çok fazla deneme yapıldı",
        description: "Kısa süre içinde çok sayıda istek gönderildi. Birkaç dakika sonra tekrar deneyin.",
    },
    UNSUPPORTED_CHALLENGE: {
        title: "Ek doğrulama gerekiyor",
        description: "Bu hesap için ilk sürümde desteklenmeyen bir güvenlik adımı gerekiyor. Teknik ekiple iletişime geçin.",
    },
    WEAK_PASSWORD: {
        title: "Şifre yeterince güçlü değil",
        description: "Daha güçlü bir şifre seçip tekrar deneyin.",
    },
    PASSWORD_RESET_REQUIRED: {
        title: "Şifre sıfırlama gerekli",
        description: "Bu hesap için önce şifre sıfırlama işlemini tamamlamanız gerekiyor.",
    },
    INVALID_PARAMETER: {
        title: "Gönderilen bilgi geçersiz",
        description: "Form alanlarını kontrol edip tekrar deneyin.",
    },
    AUTH_SERVICE_UNAVAILABLE: {
        title: "Kimlik servisine ulaşılamıyor",
        description: "Giriş altyapısına geçici olarak ulaşılamıyor. Lütfen birkaç dakika sonra tekrar deneyin.",
    },
    RefreshTokenError: {
        title: "Oturum yenilenemedi",
        description: "Oturum süreniz dolmuş olabilir. Lütfen yeniden giriş yapın.",
    },
    UNKNOWN_AUTH_ERROR: {
        title: "Kimlik doğrulama işlemi tamamlanamadı",
        description: "Beklenmeyen bir sorun oluştu. Lütfen tekrar deneyin.",
    },
    Default: {
        title: "Giriş işlemi tamamlanamadı",
        description: "Kimlik doğrulama sırasında beklenmeyen bir sorun oluştu. Lütfen tekrar deneyin.",
    },
}

export function getAuthErrorMessage(error?: string | null) {
    if (!error) return null
    return AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default
}
