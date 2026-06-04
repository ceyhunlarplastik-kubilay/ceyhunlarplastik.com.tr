export type CustomerCompanyContactAssignmentInput = {
    companyContactId: string
    isActive?: boolean
    displayOrder?: number
    note?: string | null
}

export function normalizeCompanyContactAssignments(
    assignments: CustomerCompanyContactAssignmentInput[] = [],
) {
    return Array.from(
        new Map(
            assignments
                .filter((assignment) => assignment.companyContactId)
                .map((assignment, index) => [
                    assignment.companyContactId,
                    {
                        companyContactId: assignment.companyContactId,
                        isActive: assignment.isActive ?? true,
                        displayOrder: assignment.displayOrder ?? index,
                        note: assignment.note?.trim() || null,
                    },
                ]),
        ).values(),
    )
}
