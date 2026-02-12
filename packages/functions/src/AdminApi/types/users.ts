import { IPrismaUserRepository } from "@/core/helpers/prisma/users/repository"

export interface IListUsersDependencies {
    userRepository: IPrismaUserRepository
}