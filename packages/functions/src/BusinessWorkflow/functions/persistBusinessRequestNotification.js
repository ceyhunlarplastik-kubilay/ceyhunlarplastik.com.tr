import { userNotificationRepository } from "@/core/helpers/prisma/userNotifications/repository";
import { userRepository } from "@/core/helpers/prisma/users/repository";
import { getApprovalRoleLabel, getBusinessRequestTypeLabel } from "@/core/helpers/businessRequests/messaging";
function resolveRoleGroups(role) {
    switch (role) {
        case "SALES":
            return ["sales"];
        case "SALES_DIRECTOR":
            return ["sales_director"];
        case "PURCHASING":
            return ["purchasing"];
        case "ADMIN":
            return ["admin", "owner"];
        case "OWNER":
            return ["owner"];
        default:
            return [];
    }
}
async function resolveTargetUsers(event) {
    const detail = event.detail;
    const repo = userRepository();
    switch (event["detail-type"]) {
        case "business-request.created":
        case "business-request.completed":
        case "business-request.rejected":
            if (!detail.requestedByUserId)
                return [];
            return [
                {
                    id: detail.requestedByUserId,
                    email: detail.requestedByEmail ?? "",
                    identifier: detail.requestedByEmail ?? detail.requestedByUserId,
                    groups: [],
                },
            ];
        case "business-request.pending-approval":
            if (detail.assignedUserId) {
                const assigned = await userRepository().getUserById(detail.assignedUserId);
                return assigned
                    ? [{
                            id: assigned.id,
                            email: assigned.email,
                            identifier: assigned.identifier,
                            groups: assigned.groups,
                        }]
                    : [];
            }
            return repo.listActiveUsersByGroups(resolveRoleGroups(detail.requiredRole));
        default:
            return [];
    }
}
function buildNotificationCopy(event) {
    const detail = event.detail;
    const typeLabel = getBusinessRequestTypeLabel(detail.type);
    switch (event["detail-type"]) {
        case "business-request.created":
            return {
                type: "REQUEST_CREATED",
                title: "Talebiniz kaydedildi",
                message: `${typeLabel} talebiniz onay akışına alındı.`,
            };
        case "business-request.pending-approval":
            return {
                type: "APPROVAL_REQUIRED",
                title: "Onay bekleyen yeni talep",
                message: `${detail.title} için ${getApprovalRoleLabel(detail.requiredRole ?? "ADMIN")} onayı bekleniyor.`,
            };
        case "business-request.completed":
            return {
                type: "REQUEST_DECIDED",
                title: "Talebiniz onaylandı",
                message: `${typeLabel} talebiniz onaylandı.`,
            };
        case "business-request.rejected":
            return {
                type: "REQUEST_DECIDED",
                title: "Talebiniz reddedildi",
                message: `${typeLabel} talebiniz reddedildi.`,
            };
        default:
            return null;
    }
}
export async function handler(event) {
    const copy = buildNotificationCopy(event);
    if (!copy)
        return;
    const targets = await resolveTargetUsers(event);
    if (targets.length === 0)
        return;
    const repository = userNotificationRepository();
    await Promise.all(targets.map((target) => repository.createNotification({
        userId: target.id,
        type: copy.type,
        title: copy.title,
        message: copy.message,
        data: event.detail,
    })));
}
