import { protectedServerClientWithToken } from "@/lib/http/serverClient"
import { getUserDisplayName } from "@/lib/users/displayName"

/**
 * Kullanıcının erişim durumu — panel kapılarının okuduğu şey.
 *
 * ## Neden artık DB'ye değil API'ye gidiyor (P2.8)
 * Bu dosya frontend'de KALAN TEK doğrudan `prisma` kullanıcısıydı; onun yüzünden
 * frontend Lambda'sı VPC'ye ve RDS'e bağlıydı. Artık dar `GET /me/auth-state`
 * ucunu çağırıyor.
 *
 * ## Neden bu YAVAŞLATMIYOR
 * Naif çeviri (prisma → HTTP) en sıcak yolu yavaşlatırdı: bu fonksiyon next-auth
 * `session` callback'inden çağrılıyordu, yani HER `getServerSession()` ve her
 * `/api/auth/session` isteğinde. Onun yerine sonuç JWT'ye yazılıyor ve `session`
 * callback token'dan okuyor — session okumalarında artık SIFIR I/O var.
 * Tazeleme yalnız `jwt` callback'inde ve en fazla `ACCESS_STATE_MAX_AGE_MS`'de
 * bir yapılıyor.
 *
 * ## Bedeli
 * Erişim durumu o süre kadar bayat kalabilir: askıya alınan bir kullanıcı
 * panel SAYFALARINI kısa süre görebilir. Veriye erişemez — backend
 * `authMiddleware` her API çağrısında erişimi yeniden kontrol ediyor.
 */

export type AuthUserAccessState = {
    dbUserId: string
    identifier: string
    firstName?: string | null
    lastName?: string | null
    displayName: string
    imageUrl?: string | null
    groups: string[]
    accessStatus: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
    customerId?: string | null
    supplierId?: string | null
    isActive: boolean
}

/** Token'daki erişim durumunun tazelenmeden önce yaşayabileceği süre. */
export const ACCESS_STATE_MAX_AGE_MS = 5 * 60 * 1000

type MeAuthStateResponse = {
    statusCode: number
    payload: {
        user: {
            id: string
            email: string
            identifier: string
            firstName?: string | null
            lastName?: string | null
            imageUrl?: string | null
            imageKey?: string | null
            groups?: string[]
            accessStatus: AuthUserAccessState["accessStatus"]
            customerId?: string | null
            supplierId?: string | null
            isActive?: boolean
        }
    }
}

function buildUserImageUrl(imageUrl?: string | null, imageKey?: string | null) {
    if (imageUrl) return imageUrl
    if (!imageKey) return null

    const base = process.env.ASSET_PUBLIC_BASE_URL?.replace(/\/$/, "")
    return base ? `${base}/${imageKey}` : null
}

/**
 * Erişim durumunu dar `GET /me/auth-state` ucundan okur.
 *
 * `idToken` çağıranda AÇIKÇA istenir: bu fonksiyon auth callback'lerinden
 * çağrılıyor ve orada oturumdan token okumak döngüsel olurdu.
 */
export async function fetchAuthUserAccessState(
    idToken: string,
): Promise<AuthUserAccessState | null> {
    const client = protectedServerClientWithToken(idToken)
    const res = await client.get<MeAuthStateResponse>("/me/auth-state")
    const user = res.data?.payload?.user

    if (!user) return null

    return {
        dbUserId: user.id,
        identifier: user.identifier,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        displayName: getUserDisplayName(user),
        imageUrl: buildUserImageUrl(user.imageUrl, user.imageKey),
        groups: user.groups ?? [],
        accessStatus: user.accessStatus,
        customerId: user.customerId ?? null,
        supplierId: user.supplierId ?? null,
        isActive: user.isActive ?? user.accessStatus === "ACTIVE",
    }
}
