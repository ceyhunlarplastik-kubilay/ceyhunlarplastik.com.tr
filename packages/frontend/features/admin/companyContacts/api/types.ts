export type CompanyContact = {
    id: string
    department: string
    name: string
    roleLabel?: string | null
    email?: string | null
    phone?: string | null
    whatsappPhone?: string | null
    note?: string | null
    isActive: boolean
    displayOrder: number
    createdAt: string
    updatedAt: string
}

export type CompanyContactInput = {
    department: string
    name: string
    roleLabel?: string | null
    email?: string | null
    phone?: string | null
    whatsappPhone?: string | null
    note?: string | null
    isActive?: boolean
    displayOrder?: number
}

export type CompanyContactListPayload = {
    data: CompanyContact[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export type CompanyContactListResponse = {
    statusCode: number
    payload: CompanyContactListPayload
}

export type CompanyContactResponse = {
    statusCode: number
    payload: {
        companyContact: CompanyContact
    }
}
