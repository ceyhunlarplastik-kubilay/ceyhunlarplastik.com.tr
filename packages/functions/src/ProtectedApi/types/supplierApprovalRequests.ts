import { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import { IPrismaProductVariantSupplierRepository } from "@/core/helpers/prisma/productVariantSuppliers/repository"
import { IPrismaSupplierApprovalRequestRepository } from "@/core/helpers/prisma/supplierApprovalRequests/repository"
import { IPrismaSupplierRepository } from "@/core/helpers/prisma/suppliers/repository"

export interface ISupplierApprovalRequestDependencies {
    productVariantSupplierRepository: IPrismaProductVariantSupplierRepository
    supplierApprovalRequestRepository: IPrismaSupplierApprovalRequestRepository
    supplierRepository: IPrismaSupplierRepository
    workflowArn: string
}

export type IListSupplierApprovalRequestsEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {},
        {},
        {
            page?: string
            limit?: string
            search?: string
            sort?: string
            order?: "asc" | "desc"
            status?: string
            type?: string
        }
    >

export type IRequestSupplierProfileApprovalEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {
            name?: string
            contactName?: string
            phone?: string
            address?: string
            taxNumber?: string
            defaultPaymentTermDays?: number
        },
        {},
        {}
    >

export type IRequestSupplierVariantPricingApprovalEvent =
    IAPIGatewayProxyEventWithUserGeneric<
        {
            price: number
            operationalCostRate?: number
            netCost?: number
            profitRate?: number
            listPrice?: number
            paymentTermDays?: number
            supplierVariantCode?: string
            supplierNote?: string
            minOrderQty?: number
            stockQty?: number
            currency?: string
        },
        { id: string },
        {}
    >
