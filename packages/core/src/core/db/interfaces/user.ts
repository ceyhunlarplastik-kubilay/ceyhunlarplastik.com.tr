export interface IUser {
  id: string
  cognitoSub: string
  email: string
  identifier: string
  groups: string[]
  supplierId?: string | null
  customerId?: string | null
  isActive: boolean
}
