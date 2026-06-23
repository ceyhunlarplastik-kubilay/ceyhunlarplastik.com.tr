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
    portalOnboardingState?: "INVITED" | "ACTIVE"
}

function sortCustomerContacts(left: UserSummary, right: UserSummary) {
    if (Boolean(left.isPrimaryCustomerContact) !== Boolean(right.isPrimaryCustomerContact)) {
        return left.isPrimaryCustomerContact ? -1 : 1
    }

    return left.id.localeCompare(right.id, "tr")
}

function mapPortalUserToContact(customer: AdminCustomer, user: UserSummary): CustomerContactCardModel {
    const isInvited = user.portalOnboardingState === "INVITED"
    const name = getUserDisplayName(user) || user.email || customer.fullName

    return {
        id: user.id,
        name,
        roleLabel: user.customerContactTitle || (user.isPrimaryCustomerContact ? "Müşteri Yetkilisi" : "Müşteri İletişimi"),
        subtitle: user.customerContactDepartment || (isInvited ? "Portal daveti bekleniyor" : customer.companyName || "Portal hesabı"),
        email: user.email || customer.email,
        phone: user.phone || customer.phone,
        imageUrl: user.imageUrl ?? null,
        isPrimary: Boolean(user.isPrimaryCustomerContact),
        portalOnboardingState: user.portalOnboardingState,
    }
}

export function buildCustomerContactCards(customer: AdminCustomer): CustomerContactCardModel[] {
    const portalUsers = [...(customer.portalUsers ?? [])].sort(sortCustomerContacts)

    return portalUsers.map((user) => mapPortalUserToContact(customer, user))
}

export function getPrimaryCustomerContact(customer: AdminCustomer) {
    return buildCustomerContactCards(customer)[0] ?? null
}

export function buildCompanyContactCards(customer: AdminCustomer): CustomerContactCardModel[] {
    return [...(customer.companyContactAssignments ?? [])]
        .filter((assignment) => assignment.isActive && assignment.companyContact?.isActive)
        .sort((left, right) => {
            if (left.displayOrder !== right.displayOrder) return left.displayOrder - right.displayOrder
            if (left.companyContact.displayOrder !== right.companyContact.displayOrder) {
                return left.companyContact.displayOrder - right.companyContact.displayOrder
            }
            return left.companyContact.name.localeCompare(right.companyContact.name, "tr")
        })
        .map((assignment) => {
            const contact = assignment.companyContact

            return {
                id: assignment.id,
                name: contact.name,
                roleLabel: contact.roleLabel || contact.department,
                subtitle: contact.department,
                email: contact.email,
                phone: contact.whatsappPhone || contact.phone,
                imageUrl: null,
                isPrimary: false,
            }
        })
}
