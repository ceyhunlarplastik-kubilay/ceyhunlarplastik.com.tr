import { Badge } from "@/components/ui/badge"
import {
    APPROVAL_ROLE_LABELS,
    APPROVAL_STEP_STATUS_LABELS,
} from "@/features/businessRequests/config"
import type { ApprovalRole, BusinessRequest } from "@/features/businessRequests/api/types"
import { getUserDisplayName } from "@/lib/users/displayName"

type ApprovalBadgeProps = {
    role: ApprovalRole
    status?: string
}

type Props = {
    request: BusinessRequest
}

export function BusinessRequestApprovalRoleBadge({ role, status }: ApprovalBadgeProps) {
    const variants: Record<string, "secondary" | "outline" | "default" | "destructive"> = {
        PENDING: "secondary",
        APPROVED: "default",
        REJECTED: "destructive",
        SKIPPED: "outline",
    }

    return (
        <Badge variant={variants[status ?? "SKIPPED"] ?? "outline"}>
            {APPROVAL_ROLE_LABELS[role]}
            {status ? ` • ${APPROVAL_STEP_STATUS_LABELS[status as keyof typeof APPROVAL_STEP_STATUS_LABELS]}` : ""}
        </Badge>
    )
}

export function BusinessRequestApprovalFlowPanel({ request }: Props) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="text-sm font-medium text-neutral-900">Onay Akışı</div>
            <div className="mt-3 flex flex-wrap gap-2">
                {request.approvalSteps?.map((step) => (
                    <div key={step.id} className="space-y-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                        <div>
                            <BusinessRequestApprovalRoleBadge role={step.requiredRole} status={step.status} />
                        </div>
                        <div className="text-xs text-neutral-500">
                            {step.assignedUser
                                ? (getUserDisplayName(step.assignedUser) || step.assignedUser.email)
                                : "Rol bazlı"}
                        </div>
                        {step.decisionNote ? (
                            <div className="max-w-[240px] text-xs text-neutral-600">{step.decisionNote}</div>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    )
}
