import { FederationDeniedError, type FederationDenyReason } from "./errors"
import {
    assessFederatedIdentity,
    decideFederatedSignUp,
    type FederatedIdentity,
    type NativeUserSummary,
} from "./decideFederatedSignUp"

export type LocalUserInput = {
    email: string
    firstName: string | null
    lastName: string | null
    name: string | null
}

/** Cognito SDK adaptörü (bkz. repository.ts) — testte sahtesi verilir. */
export interface FederationRepository {
    listUsersByEmail(userPoolId: string, email: string): Promise<NativeUserSummary[]>
    createLocalUser(userPoolId: string, input: LocalUserInput): Promise<{ username: string }>
    linkProvider(
        userPoolId: string,
        input: FederatedIdentity & { nativeUsername: string },
    ): Promise<void>
}

/** `PreSignUpExternalProviderTriggerEvent`in bu modülün ihtiyaç duyduğu dar yüzü. */
export type PreSignUpEventLike = {
    userPoolId: string
    userName?: string
    request: { userAttributes: Record<string, string | undefined> }
}

export type FederatedPreSignUpOutcome = "PASSTHROUGH" | "LINKED_EXISTING" | "CREATED_AND_LINKED"

type Log = (message: string, meta?: Record<string, unknown>) => void

const defaultLog: Log = (message, meta) => {
    console.log(JSON.stringify({ scope: "cognito.federation", message, ...meta }))
}

/** Loglara ham e-posta yazılmaz (PII): `ali@firma.com` → `a***@firma.com`. */
export function maskEmail(email: string) {
    const [local = "", domain = ""] = email.split("@")
    return `${local.slice(0, 1)}***@${domain}`
}

function isUsernameExistsError(error: unknown) {
    return error instanceof Error && error.name === "UsernameExistsException"
}

/**
 * E-postaya göre yerel profili arar. Google e-postayı küçük harfle verir ama eski kayıtlar
 * yazıldığı harfle saklanmış olabilir (Cognito `email` filtresi büyük/küçük harfe duyarlı) —
 * bu yüzden sırayla küçük harfli ve Google'ın ilettiği orijinal yazımla denenir.
 */
async function findNativeUsers(
    repository: FederationRepository,
    userPoolId: string,
    email: string,
    originalEmail: string | undefined,
) {
    const candidates = Array.from(new Set([email, originalEmail?.trim()].filter((value): value is string => Boolean(value))))

    for (const candidate of candidates) {
        const found = await repository.listUsersByEmail(userPoolId, candidate)
        if (found.length > 0) return found
    }

    return []
}

/**
 * Federe (Google) İLK girişte, kullanıcı havuza yazılmadan hemen önce çalışır: kimliği yerel
 * bir profile bağlar (yoksa açar). Reddedilecekse `FederationDeniedError` fırlatır —
 * Cognito bu mesajı OAuth dönüşünde `error_description` olarak taşır.
 *
 * NOT (bilinen davranış): trigger içinde `AdminLinkProviderForUser` çağırınca Cognito o ilk
 * denemeyi "Already found an entry for username Google_…" ile düşürür; bağ kalıcı olduğundan
 * ikinci deneme yerel profille başarıyla girer. Frontend bunu tek seferlik yeniden denemeyle
 * karşılar (AWS'nin "inbound federation" trigger'ı bunu ortadan kaldırır ama SST'nin sabit
 * Pulumi AWS sürümünde henüz yok).
 */
export async function handleFederatedPreSignUp({
    event,
    repository,
    log = defaultLog,
}: {
    event: PreSignUpEventLike
    repository: FederationRepository
    log?: Log
}): Promise<FederatedPreSignUpOutcome> {
    const attributes = event.request.userAttributes
    const assessment = assessFederatedIdentity(event.userName, attributes)

    if (assessment.kind === "PASSTHROUGH") return "PASSTHROUGH"

    // Teşhis: yalnız öznitelik ADLARI ve `email_verified` bayrağı loglanır (değer/PII değil) —
    // Cognito'nun federe PreSignUp olayına hangi özniteliklerin (özellikle map'lenen
    // `email_verified`in) gerçekten geldiği CloudWatch/`sst dev` çıktısında bu satırdan okunur.
    const deny = (reason: FederationDenyReason): never => {
        log("federated sign-up denied", {
            reason,
            attributeKeys: Object.keys(attributes).sort(),
            emailVerified: attributes.email_verified ?? null,
        })
        throw new FederationDeniedError(reason)
    }

    if (assessment.kind === "DENY") return deny(assessment.reason)

    const { identity, email } = assessment
    const userPoolId = event.userPoolId

    const decide = async () =>
        decideFederatedSignUp(await findNativeUsers(repository, userPoolId, email, attributes.email))

    const linkTo = async (nativeUsername: string) => {
        await repository.linkProvider(userPoolId, { ...identity, nativeUsername })
    }

    const first = await decide()
    if (first.action === "DENY") return deny(first.reason)

    if (first.action === "LINK_EXISTING") {
        await linkTo(first.nativeUsername)
        log("federated identity linked to existing local user", { provider: identity.providerName, email: maskEmail(email) })
        return "LINKED_EXISTING"
    }

    const firstName = attributes.given_name?.trim() || null
    const lastName = attributes.family_name?.trim() || null
    const displayName = attributes.name?.trim() || [firstName, lastName].filter(Boolean).join(" ") || null

    try {
        const created = await repository.createLocalUser(userPoolId, { email, firstName, lastName, name: displayName })
        await linkTo(created.username)
        log("local user created and federated identity linked", { provider: identity.providerName, email: maskEmail(email) })
        return "CREATED_AND_LINKED"
    } catch (error) {
        if (!isUsernameExistsError(error)) throw error
    }

    // Eşzamanlı ilk giriş: aynı e-postayla yerel profil arada oluştu → yeniden karar ver.
    const second = await decide()
    if (second.action === "LINK_EXISTING") {
        await linkTo(second.nativeUsername)
        log("federated identity linked after concurrent local user creation", { provider: identity.providerName, email: maskEmail(email) })
        return "LINKED_EXISTING"
    }
    if (second.action === "DENY") return deny(second.reason)

    throw new Error("Federated sign-up: local user could neither be created nor found")
}
