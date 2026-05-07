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
    Default: {
        title: "Giriş işlemi tamamlanamadı",
        description: "Kimlik doğrulama sırasında beklenmeyen bir sorun oluştu. Lütfen tekrar deneyin.",
    },
}

export function getAuthErrorMessage(error?: string | null) {
    if (!error) return null
    return AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default
}
