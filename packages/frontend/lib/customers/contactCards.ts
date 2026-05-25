import type { AdminCustomer, UserSummary } from "@/features/admin/customers/api/types"
import { getUserDisplayName } from "@/lib/users/displayName"

export type CustomerContactCardModel = {
    id: string
    name: string
    roleLabel: string
    subtitle: string
    email?: string | null
    phone?: string | null
    imageUrl?: string | null
    isPrimary: boolean
}

function sortCustomerContacts(left: UserSummary, right: UserSummary) {
    if (Boolean(left.isPrimaryCustomerContact) !== Boolean(right.isPrimaryCustomerContact)) {
        return left.isPrimaryCustomerContact ? -1 : 1
    }

    return left.id.localeCompare(right.id, "tr")
}

function mapPortalUserToContact(customer: AdminCustomer, user: UserSummary): CustomerContactCardModel {
    const name = getUserDisplayName(user) || customer.fullName

    return {
        id: user.id,
        name,
        roleLabel: user.customerContactTitle || (user.isPrimaryCustomerContact ? "Müşteri Yetkilisi" : "Müşteri İletişimi"),
        subtitle: user.customerContactDepartment || customer.companyName || "Portal hesabı",
        email: user.email || customer.email,
        phone: user.phone || customer.phone,
        imageUrl: user.imageUrl ?? null,
        isPrimary: Boolean(user.isPrimaryCustomerContact),
    }
}

export function buildCustomerContactCards(customer: AdminCustomer): CustomerContactCardModel[] {
    const portalUsers = [...(customer.portalUsers ?? [])].sort(sortCustomerContacts)

    if (portalUsers.length > 0) {
        return portalUsers.map((user) => mapPortalUserToContact(customer, user))
    }

    return [{
        id: `fallback-${customer.id}`,
        name: customer.fullName,
        roleLabel: "Müşteri Yetkilisi",
        subtitle: customer.companyName || "Portal hesabı",
        email: customer.email,
        phone: customer.phone,
        imageUrl: null,
        isPrimary: true,
    }]
}

export function getPrimaryCustomerContact(customer: AdminCustomer) {
    return buildCustomerContactCards(customer)[0] ?? null
}
