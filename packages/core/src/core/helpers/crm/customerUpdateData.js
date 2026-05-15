import { validateCustomerAttributeSelection } from "@/core/helpers/crm/customerAttributes";
export async function buildCustomerUpdateData(productAttributeValueRepository, input) {
    const { usageAreaIds } = await validateCustomerAttributeSelection(productAttributeValueRepository, {
        sectorValueId: input.sectorValueId,
        productionGroupValueId: input.productionGroupValueId,
        usageAreaValueIds: input.usageAreaValueIds,
    });
    const data = {
        ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.assignedSalesUserId !== undefined
            ? input.assignedSalesUserId
                ? { assignedSalesUser: { connect: { id: input.assignedSalesUserId } } }
                : { assignedSalesUser: { disconnect: true } }
            : {}),
        ...(input.sectorValueId !== undefined
            ? input.sectorValueId
                ? { sectorValue: { connect: { id: input.sectorValueId } } }
                : { sectorValue: { disconnect: true } }
            : {}),
        ...(input.productionGroupValueId !== undefined
            ? input.productionGroupValueId
                ? { productionGroupValue: { connect: { id: input.productionGroupValueId } } }
                : { productionGroupValue: { disconnect: true } }
            : {}),
        ...(input.usageAreaValueIds !== undefined
            ? {
                usageAreaValues: {
                    set: usageAreaIds.map((id) => ({ id })),
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
                        country: address.country?.trim() || "Turkiye",
                        city: address.city,
                        district: address.district ?? null,
                        line1: address.line1,
                        line2: address.line2 ?? null,
                        postalCode: address.postalCode ?? null,
                        taxOffice: address.taxOffice ?? null,
                        isPrimary: Boolean(address.isPrimary),
                        isBilling: Boolean(address.isBilling),
                        isShipping: address.isShipping ?? true,
                        note: address.note ?? null,
                        displayOrder: index,
                    })),
                },
            }
            : {}),
    };
    return data;
}
