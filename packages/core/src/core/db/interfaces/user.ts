export interface IUser {
  id: string
  cognitoSub: string
  email: string
  identifier: string
  imageKey?: string | null
  groups: string[]
  accessStatus: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
  accessStatusChangedAt?: Date | string | null
  accessStatusChangedByUserId?: string | null
  accessStatusReason?: string | null
  supplierId?: string | null
  customerId?: string | null
  isActive: boolean
}
