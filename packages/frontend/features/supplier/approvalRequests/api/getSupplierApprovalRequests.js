import { protectedApiClient } from "@/lib/http/client";
export async function getSupplierApprovalRequests(params = {}) {
    const res = await protectedApiClient.get("/supplier/approval-requests", { params });
    return res.data.payload;
}
