/**
 * Federe (Google) ilk girişte PreSignUp trigger'ının reddetme nedenleri.
 *
 * Kodlar kısa ve SABİTTİR: Cognito, trigger'ın fırlattığı hatanın mesajını OAuth
 * dönüşünde `error_description` içinde ("PreSignUp failed with error <mesaj>")
 * tarayıcıya taşır; frontend kullanıcıya gösterilecek metni bu koddan seçer.
 * Bu dosya SAF tutulur (import yok) ki Lambda ve Next.js aynı sabitleri paylaşabilsin.
 */
export const FEDERATION_DENY_CODES = {
    EMAIL_MISSING: "FED_DENY_EMAIL_MISSING",
    EMAIL_NOT_VERIFIED: "FED_DENY_EMAIL_NOT_VERIFIED",
    INVITATION_PENDING: "FED_DENY_INVITATION_PENDING",
    ACCOUNT_NOT_CONFIRMED: "FED_DENY_ACCOUNT_NOT_CONFIRMED",
    ACCOUNT_UNAVAILABLE: "FED_DENY_ACCOUNT_UNAVAILABLE",
} as const

export type FederationDenyReason = keyof typeof FEDERATION_DENY_CODES

export class FederationDeniedError extends Error {
    readonly reason: FederationDenyReason

    constructor(reason: FederationDenyReason) {
        super(FEDERATION_DENY_CODES[reason])
        this.name = "FederationDeniedError"
        this.reason = reason
    }
}
