import { prisma } from "@/core/db/prisma"
import type { Prisma, User } from "@/prisma/generated/prisma/client"

import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"

import type { IUser } from "@/core/db/interfaces/user"

export interface IPrismaUserRepository {
  listUsers(query: IPaginationQuery): Promise<{
    data: User[]
    meta: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>
  getUserById(id: string): Promise<IUser | null>
  getUserByCognitoSub(sub: string): Promise<IUser | null>
  createUser(data: Prisma.UserCreateInput): Promise<IUser>
  updateGroups(id: string, groups: string[]): Promise<IUser>
}

export const userRepository = (): IPrismaUserRepository => {

  const listUsers = async (query: IPaginationQuery) => {
    const {
      where,
      orderBy,
      skip,
      take,
      page,
      limit,
    } = buildPaginationQuery<User>(query, {
      searchableFields: ["email", "identifier"],
      defaultSort: "createdAt",
    })

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ])

    return buildPaginationResponse(data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  }

  const getUserById = async (id: string) => {
    return prisma.user.findUnique({
      where: { id },
    })
  }

  const getUserByCognitoSub = async (sub: string) => {
    return prisma.user.findUnique({ where: { cognitoSub: sub } })
  }

  const createUser = async (data: Prisma.UserCreateInput) => {
    return prisma.user.create({
      data,
    })
  }

  const updateGroups = async (id: string, groups: string[]) => {
    return prisma.user.update({
      where: { id },
      data: { groups },
    })
  }

  return {
    listUsers,
    getUserById,
    getUserByCognitoSub,
    createUser,
    updateGroups,
  }
}
