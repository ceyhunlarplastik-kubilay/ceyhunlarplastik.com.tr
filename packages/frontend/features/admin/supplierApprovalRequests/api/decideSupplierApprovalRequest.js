import { adminApiClient } from "@/lib/http/client";
export async function decideSupplierApprovalRequest({ id, ...payload }) {
    const res = await adminApiClient.post(`/supplier-approval-requests/${id}/decision`, payload);
    return res.data.payload;
}
