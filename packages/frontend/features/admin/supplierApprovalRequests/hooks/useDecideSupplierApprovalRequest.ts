"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { decideSupplierApprovalRequest } from "@/features/admin/supplierApprovalRequests/api/decideSupplierApprovalRequest"
import type { AdminSupplierApprovalRequestListResponse } from "@/features/admin/supplierApprovalRequests/api/types"

type ApprovalRequestsQueryData = AdminSupplierApprovalRequestListResponse["payload"]

export function useDecideSupplierApprovalRequest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: decideSupplierApprovalRequest,
        onSuccess: (data) => {
            toast.success(data.approvalRequest ? "Talep sonuçlandırıldı" : "Onay kararı workflow'a iletildi")

            if (data.approvalRequest) {
                queryClient.setQueriesData<ApprovalRequestsQueryData>(
                    { queryKey: ["admin-supplier-approval-requests"] },
                    (current) => {
                        if (!current) return current

                        return {
                            ...current,
                            data: current.data.map((request) =>
                                request.id === data.approvalRequest?.id ? data.approvalRequest : request
                            ),
                        }
                    }
                )
            }

            queryClient.invalidateQueries({ queryKey: ["admin-supplier-approval-requests"] })
            queryClient.invalidateQueries({ queryKey: ["supplier-approval-requests"] })

            if (!data.approvalRequest) {
                window.setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ["admin-supplier-approval-requests"] })
                    queryClient.invalidateQueries({ queryKey: ["supplier-approval-requests"] })
                }, 1500)
            }
        },
        onError: () => {
            toast.error("Onay kararı iletilemedi")
        },
    })
}
