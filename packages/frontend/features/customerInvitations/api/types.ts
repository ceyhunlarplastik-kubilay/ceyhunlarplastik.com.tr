export type CustomerInvitationSummary = {
    email: string
    customerName: string
    firstName?: string | null
    lastName?: string | null
    customerContactTitle?: string | null
    customerContactDepartment?: string | null
    isPrimaryCustomerContact: boolean
    expiresAt: string
}

export type CustomerInvitationResponse = {
    statusCode: number
    payload: {
        invitation: CustomerInvitationSummary
    }
}

export type AcceptCustomerInvitationResponse = {
    statusCode: number
    payload: {
        email: string
        customerName: string
    }
}
