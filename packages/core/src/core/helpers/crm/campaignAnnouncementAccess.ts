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

export function canViewCampaignAnnouncement(
    user: IAuthenticatedUser,
    announcement: AnnouncementLike,
) {
    if (hasFullScope(user)) return true
    return user.isSales && announcement.createdByUserId === user.id
}

/**
 * Liste sorgusunda uygulanacak sahiplik daraltması. Temsilci için kendi
 * kimliğine sabitlenir; müdür/admin isterse belirli bir temsilciyi filtreleyebilir.
 */
export function resolveAnnouncementOwnerFilter(
    user: IAuthenticatedUser,
    requestedCreatedByUserId?: string,
): string | undefined {
    if (hasFullScope(user)) return requestedCreatedByUserId
    return user.id
}
