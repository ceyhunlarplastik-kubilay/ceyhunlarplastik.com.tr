import { IUser } from '@/core/db/interfaces/user'

export interface IUserRespository {
    getUser: ({ table_name, id }: { table_name: string; id: string }) => Promise<IUser | null>
    createUser: ({ table_name, user }: { table_name: string; user: IUser }) => Promise<IUser>
}