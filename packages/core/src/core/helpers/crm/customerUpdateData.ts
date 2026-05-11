import type { Prisma } from "@/prisma/generated/prisma/client"
import type { IPrismaProductAttributeValueRepository } from "@/core/helpers/prisma/productAttributeValues/repository"
import { validateCustomerAttributeSelection } from "@/core/helpers/crm/customerAttributes"

type Input = {
    companyName?: string | null
    fullName?: string
    phone?: string
    email?: string
    note?: string | null
    status?: "LEAD" | "CUSTOMER"
    assignedSalesUserId?: string | null
    sectorValueId?: string | null
    productionGroupValueId?: string | null
    usageAreaValueIds?: string[]
}

export async function buildCustomerUpdateData(
    productAttributeValueRepository: IPrismaProductAttributeValueRepository,
    input: Input,
): Promise<Prisma.CustomerUpdateInput> {
    const { usageAreaIds } = await validateCustomerAttributeSelection(
        productAttributeValueRepository,
        {
            sectorValueId: input.sectorValueId,
            productionGroupValueId: input.productionGroupValueId,
            usageAreaValueIds: input.usageAreaValueIds,
        },
    )

    const data: Prisma.CustomerUpdateInput = {
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
    }

    return data
}
