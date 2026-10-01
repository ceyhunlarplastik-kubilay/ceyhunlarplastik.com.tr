import { lambdaHandler } from "@/core/middy"
import { auditLogRepository } from "@/core/helpers/prisma/auditLogs/repository"
import { listAuditLogsHandler } from "@/functions/AdminApi/functions/auditLogs/handlers"
import {
    listAuditLogsValidator,
    listAuditLogsResponseValidator,
} from "@/functions/AdminApi/validators/auditLogs"
import type { IAuditLogDependencies, IListAuditLogsEvent } from "@/functions/AdminApi/types/auditLogs"

// Geçmiş, diğer çalışanların adını, e-postasını ve IP'sini taşır: en dar yetkiyle açık.
// `owner` rol hiyerarşisiyle geçer; kaydı DÜZENLEYEBİLEN roller (`content_editor` gibi)
// geçmişi göremez — yetkiyi genişletmeden önce yanıtın ne taşıdığına bak.
const auditLogReaderGroups = ["admin"]

export const listAuditLogs = lambdaHandler(
    async (event) => {
        const deps: IAuditLogDependencies = {
            auditLogRepository: auditLogRepository(),
        }

        return listAuditLogsHandler(deps)(
            event as IListAuditLogsEvent
        )
    },
    {
        auth: { requiredPermissionGroups: auditLogReaderGroups },
        requestValidator: listAuditLogsValidator,
        responseValidator: listAuditLogsResponseValidator,
    }
)
