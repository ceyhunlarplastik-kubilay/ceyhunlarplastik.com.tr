export interface IUser {
  id: string
  cognitoSub: string
  email: string
  identifier: string
  groups: string[]
  supplierId?: string | null
  isActive: boolean
}
