import { prisma } from "@/core/db/prisma"
import { Prisma, Supplier } from "@/prisma/generated/prisma/client"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"

export interface IPrismaSupplierRepository {
  listSuppliers(query: IPaginationQuery): Promise<{
    data: Supplier[]
    meta: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>
  getSupplier(id: string): Promise<Supplier | null>
  createSupplier(data: Prisma.SupplierCreateInput): Promise<Supplier>
  updateSupplier(id: string, data: Prisma.SupplierUpdateInput): Promise<Supplier>
  deleteSupplier(id: string): Promise<Supplier>
}

export const supplierRepository = (): IPrismaSupplierRepository => {

  const listSuppliers = async (query: IPaginationQuery) => {

    const {
      where,
      orderBy,
      skip,
      take,
      page,
      limit,
    } = buildPaginationQuery<Supplier>(query, {
      searchableFields: ["name"],
      defaultSort: "createdAt",
    })

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.supplier.count({ where }),
    ])

    return buildPaginationResponse(data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  }

  return {
    listSuppliers,
    getSupplier: (id) =>
      prisma.supplier.findUnique({ where: { id } }),

    createSupplier: (data) =>
      prisma.supplier.create({ data }),

    updateSupplier: (id, data) =>
      prisma.supplier.update({
        where: { id },
        data,
      }),

    deleteSupplier: (id) =>
      prisma.supplier.delete({
        where: { id },
      }),
  }
}
