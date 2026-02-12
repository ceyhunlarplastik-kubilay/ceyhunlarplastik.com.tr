import { prisma } from "@/core/db/prisma"
import type { Prisma } from "@/prisma/generated/prisma/client"
import type { IUser } from "@/core/db/interfaces/user"

export interface IPrismaUserRepository {
  listUsers(): Promise<IUser[]>
  getUserById(id: string): Promise<IUser | null>
  getUserByCognitoSub(sub: string): Promise<IUser | null>
  createUser(data: Prisma.UserCreateInput): Promise<IUser>
  updateGroups(id: string, groups: string[]): Promise<IUser>
}

export const userRepository = (): IPrismaUserRepository => {

  const listUsers = async () => {
    return prisma.user.findMany();
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
