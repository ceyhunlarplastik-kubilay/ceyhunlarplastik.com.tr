import { adminApiClient } from "@/lib/http/client";
export async function getSupplierApprovalRequests(params = {}) {
    const res = await adminApiClient.get("/supplier-approval-requests", { params });
    return res.data.payload;
}
