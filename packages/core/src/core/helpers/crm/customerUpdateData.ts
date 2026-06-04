import type { Prisma } from "@/prisma/generated/prisma/client"
import type { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { resolveCustomerAttributeAssignments } from "@/core/helpers/crm/customerAttributes"

type Input = {
    companyName?: string | null
    fullName?: string
    phone?: string
    email?: string
    note?: string | null
    status?: "LEAD" | "CUSTOMER"
    generalDiscountPercent?: number | null
    defaultPaymentTermDays?: number | null
    creditLimit?: number | null
    paymentTermNote?: string | null
    assignedSalesUserId?: string | null
    attributeValueIds?: string[]
    sectorValueId?: string | null
    productionGroupValueId?: string | null
    usageAreaValueIds?: string[]
    addresses?: Array<{
        label: string
        contactName?: string | null
        phone?: string | null
        email?: string | null
        countryId?: number | null
        stateId?: number | null
        cityId?: number | null
        country?: string | null
        city: string
        district?: string | null
        line1: string
        line2?: string | null
        postalCode?: string | null
        taxOffice?: string | null
        taxNumber?: string | null
        isPrimary?: boolean
        isBilling?: boolean
        isShipping?: boolean
        note?: string | null
    }>
}

export async function buildCustomerUpdateData(
    productAttributeValueRepository: IPrismaProductAttributeValueRepository,
    input: Input,
): Promise<Prisma.CustomerUpdateInput> {
    const resolvedAttributes = await resolveCustomerAttributeAssignments(productAttributeValueRepository, {
        attributeValueIds: input.attributeValueIds,
        sectorValueId: input.sectorValueId,
        productionGroupValueId: input.productionGroupValueId,
        usageAreaValueIds: input.usageAreaValueIds,
    })

    const data: Prisma.CustomerUpdateInput = {
        ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.generalDiscountPercent !== undefined ? { generalDiscountPercent: input.generalDiscountPercent } : {}),
        ...(input.defaultPaymentTermDays !== undefined ? { defaultPaymentTermDays: input.defaultPaymentTermDays } : {}),
        ...(input.creditLimit !== undefined ? { creditLimit: input.creditLimit } : {}),
        ...(input.paymentTermNote !== undefined ? { paymentTermNote: input.paymentTermNote } : {}),
        ...(input.assignedSalesUserId !== undefined
            ? input.assignedSalesUserId
                ? { assignedSalesUser: { connect: { id: input.assignedSalesUserId } } }
                : { assignedSalesUser: { disconnect: true } }
            : {}),
        ...(resolvedAttributes
            ? resolvedAttributes.sectorValueId
                ? { sectorValue: { connect: { id: resolvedAttributes.sectorValueId } } }
                : { sectorValue: { disconnect: true } }
            : input.sectorValueId !== undefined
                ? input.sectorValueId
                    ? { sectorValue: { connect: { id: input.sectorValueId } } }
                    : { sectorValue: { disconnect: true } }
            : {}),
        ...(resolvedAttributes
            ? resolvedAttributes.productionGroupValueId
                ? { productionGroupValue: { connect: { id: resolvedAttributes.productionGroupValueId } } }
                : { productionGroupValue: { disconnect: true } }
            : input.productionGroupValueId !== undefined
                ? input.productionGroupValueId
                    ? { productionGroupValue: { connect: { id: input.productionGroupValueId } } }
                    : { productionGroupValue: { disconnect: true } }
            : {}),
        ...(resolvedAttributes
            ? {
                usageAreaValues: {
                    set: resolvedAttributes.usageAreaIds.map((id) => ({ id })),
                },
                attributeValueAssignments: {
                    deleteMany: {},
                    create: resolvedAttributes.assignmentValueIds.map((id) => ({
                        source: resolvedAttributes.source,
                        attributeValue: {
                            connect: { id },
                        },
                    })),
                },
            }
            : input.usageAreaValueIds !== undefined
                ? {
                    usageAreaValues: {
                        set: [],
                    },
                }
            : {}),
        ...(input.addresses !== undefined
            ? {
                addresses: {
                    deleteMany: {},
                    create: input.addresses.map((address, index) => ({
                        label: address.label,
                        contactName: address.contactName ?? null,
                        phone: address.phone ?? null,
                        email: address.email ?? null,
                        countryId: address.countryId ?? null,
                        stateId: address.stateId ?? null,
                        cityId: address.cityId ?? null,
                        country: address.country?.trim() || "Turkiye",
                        city: address.city,
                        district: address.district ?? null,
                        line1: address.line1,
                        line2: address.line2 ?? null,
                        postalCode: address.postalCode ?? null,
                        taxOffice: address.taxOffice ?? null,
                        taxNumber: address.taxNumber ?? null,
                        isPrimary: Boolean(address.isPrimary),
                        isBilling: Boolean(address.isBilling),
                        isShipping: address.isShipping ?? true,
                        note: address.note ?? null,
                        displayOrder: index,
                    })),
                },
            }
            : {}),
    }

    return data
}
