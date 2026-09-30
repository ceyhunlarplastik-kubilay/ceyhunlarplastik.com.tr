export type ProductionOperator = {
    id: string
    firstName: string
    lastName: string
    employeeNo: string | null
    phone: string | null
    isActive: boolean
    notes: string | null
    createdAt: string
    updatedAt: string
}

export type ProductionOperatorInput = Omit<ProductionOperator, "id" | "createdAt" | "updatedAt">
