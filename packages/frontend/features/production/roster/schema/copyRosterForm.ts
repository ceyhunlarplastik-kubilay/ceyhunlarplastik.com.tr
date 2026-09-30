import { z } from "zod"

import { addDaysToDateKey } from "@core/helpers/production/productionCalendar"
import { findRosterCopyIssue } from "@core/helpers/production/shiftAssignments"

/** Kopyalama aralığı; kural sunucuyla aynı fonksiyondan (`findRosterCopyIssue`). */
export function copyRosterFormSchema(fromDate: string) {
    return z.object({ toStart: z.string(), toEnd: z.string() }).superRefine((values, ctx) => {
        const issue = findRosterCopyIssue({ fromDate, ...values })
        if (issue) ctx.addIssue({ code: "custom", path: ["toEnd"], message: issue })
    })
}

export type CopyRosterFormValues = { toStart: string; toEnd: string }

/** Varsayılan: ertesi günden itibaren 5 gün (bir iş haftası). */
export function copyRosterDefaults(fromDate: string): CopyRosterFormValues {
    return { toStart: addDaysToDateKey(fromDate, 1), toEnd: addDaysToDateKey(fromDate, 5) }
}
