export interface IUser {
  id: string
  cognitoSub: string
  email: string
  identifier: string
  firstName?: string | null
  lastName?: string | null
  imageKey?: string | null
  phone?: string | null
  groups: string[]
  accessStatus: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED"
  accessStatusChangedAt?: Date | string | null
  accessStatusChangedByUserId?: string | null
  accessStatusReason?: string | null
  supplierId?: string | null
  customerId?: string | null
  customerContactTitle?: string | null
  customerContactDepartment?: string | null
  isPrimaryCustomerContact?: boolean
  isActive: boolean
}
