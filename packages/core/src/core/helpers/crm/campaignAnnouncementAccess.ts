import type { IAuthenticatedUser } from "@/core/helpers/utils/api/types"
import { canManageCustomer } from "@/core/helpers/crm/access"

/**
 * Kampanya duyurusu erişim kuralları — saf, bu yüzden testlenebilir.
 *
 * Temel kural: satış temsilcisi YALNIZ kendisine atanmış müşterilere duyuru
 * yapabilir ve yalnız kendi duyurularını görebilir. Satış müdürü, admin ve owner
 * kısıtsızdır. Bu kural sunucuda zorlanmazsa bir temsilci başka temsilcinin
 * müşteri portföyüne erişebilirdi.
 */

type CustomerLike = {
    id: string
    assignedSalesUserId?: string | null
}

type AnnouncementLike = {
    createdByUserId: string
    recipients?: Array<{
        customer?: { assignedSalesUserId?: string | null } | null
    }>
}

/** Kısıtsız roller: müdür/admin/owner tüm portföyü yönetir. */
function hasFullScope(user: IAuthenticatedUser) {
    return user.isOwner || user.isAdmin || user.isSalesDirector
}

/**
 * Duyuruya eklenemeyecek müşterilerin kimliklerini döner. Boş dizi = hepsi uygun.
 * Hata fırlatmak yerine liste döner ki çağıran hangi müşterinin reddedildiğini
 * kullanıcıya söyleyebilsin.
 */
export function findInaccessibleCustomerIds(
    user: IAuthenticatedUser,
    customers: CustomerLike[],
): string[] {
    if (hasFullScope(user)) return []

    return customers
        .filter((customer) => !canManageCustomer(user, customer))
        .map((customer) => customer.id)
}

/**
 * Temsilci bir duyuruyu İKİ nedenden görebilir:
 *  1. duyuruyu kendisi oluşturmuştur,
 *  2. duyuru KENDİ müşterilerinden en az birini hedefliyordur.
 *
 * İkincisi şart: satış müdürü/admin bir temsilcinin portföyü için duyuru
 * oluşturabiliyor ve takibi yapacak kişi o temsilci. Yalnız "oluşturan" kuralı
 * uygulansaydı yöneticinin oluşturduğu duyuru, işi yapacak kişiye görünmezdi.
 */
export function canViewCampaignAnnouncement(
    user: IAuthenticatedUser,
    announcement: AnnouncementLike,
) {
    if (hasFullScope(user)) return true
    if (!user.isSales) return false

    if (announcement.createdByUserId === user.id) return true

    return (announcement.recipients ?? []).some(
        (recipient) => recipient.customer?.assignedSalesUserId === user.id,
    )
}

/**
 * Liste sorgusunda uygulanacak KAPSAM daraltması. Temsilci için kendi kimliği
 * döner (repository bunu "oluşturan VEYA müşterisi hedeflenen" olarak çevirir);
 * kısıtsız roller için `undefined`.
 */
export function resolveAnnouncementSalesScope(user: IAuthenticatedUser): string | undefined {
    return hasFullScope(user) ? undefined : user.id
}

/**
 * Yöneticinin açık temsilci filtresi. Temsilcinin kendisi için anlamsız olduğu
 * için yok sayılır — onun görünürlüğünü `resolveAnnouncementSalesScope` belirler.
 */
export function resolveAnnouncementOwnerFilter(
    user: IAuthenticatedUser,
    requestedCreatedByUserId?: string,
): string | undefined {
    return hasFullScope(user) ? requestedCreatedByUserId : undefined
}
