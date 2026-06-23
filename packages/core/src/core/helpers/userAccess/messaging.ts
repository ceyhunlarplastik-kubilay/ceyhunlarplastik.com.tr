import type { UserAccessStatus } from "@/core/helpers/prisma/users/repository"
import type { UserGroup } from "@/core/helpers/userAccess/types"

const GROUP_LABELS: Record<UserGroup, string> = {
    owner: "Owner",
    admin: "Admin",
    user: "İnceleme Bekleyen Kullanıcı",
    supplier: "Tedarikçi",
    purchasing: "Satın Alma",
    sales: "Satış",
    sales_director: "Satış Direktörü",
    customer: "Müşteri Portalı",
    content_editor: "Veri Girişi",
}

const ACCESS_STATUS_LABELS: Record<UserAccessStatus, string> = {
    PENDING_REVIEW: "İnceleniyor",
    ACTIVE: "Aktif",
    SUSPENDED: "Askıya Alındı",
    REJECTED: "Reddedildi",
}

export function getUserGroupLabel(group: string) {
    return GROUP_LABELS[group as UserGroup] ?? group
}

export function getUserAccessStatusLabel(status: UserAccessStatus) {
    return ACCESS_STATUS_LABELS[status] ?? status
}

export function buildUserAccessChangedMessage(input: {
    nextGroup: string
    nextAccessStatus: UserAccessStatus
    reason?: string | null
}) {
    const roleLabel = getUserGroupLabel(input.nextGroup)
    const statusLabel = getUserAccessStatusLabel(input.nextAccessStatus)
    const reasonSuffix = input.reason ? ` Not: ${input.reason}` : ""

    if (input.nextAccessStatus === "ACTIVE") {
        return {
            title: "Erişim yetkiniz güncellendi",
            message: `Hesabınız ${roleLabel} rolü ile aktif edildi.${reasonSuffix}`.trim(),
        }
    }

    return {
        title: "Hesap durumunuz güncellendi",
        message: `Hesap durumunuz ${statusLabel} olarak güncellendi.${reasonSuffix}`.trim(),
    }
}
