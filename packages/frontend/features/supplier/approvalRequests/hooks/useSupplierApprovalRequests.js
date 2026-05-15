"use client";
import { useQuery } from "@tanstack/react-query";
import { getSupplierApprovalRequests } from "@/features/supplier/approvalRequests/api/getSupplierApprovalRequests";
export function useSupplierApprovalRequests(params = {}) {
    const { enabled = true, ...query } = params;
    return useQuery({
        queryKey: ["supplier-approval-requests", query],
        queryFn: () => getSupplierApprovalRequests(query),
        enabled,
    });
}
