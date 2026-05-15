"use client";
import { Badge } from "@/components/ui/badge";
import { SUPPLIER_APPROVAL_STATUS_BADGE_CLASSES, SUPPLIER_APPROVAL_STATUS_LABELS, } from "@/features/admin/supplierApprovalRequests/config";
export function SupplierApprovalRequestStatusBadge({ status }) {
    return (<Badge variant="outline" className={SUPPLIER_APPROVAL_STATUS_BADGE_CLASSES[status] ?? "border-neutral-200 bg-neutral-50 text-neutral-700"}>
            {SUPPLIER_APPROVAL_STATUS_LABELS[status] ?? status}
        </Badge>);
}
