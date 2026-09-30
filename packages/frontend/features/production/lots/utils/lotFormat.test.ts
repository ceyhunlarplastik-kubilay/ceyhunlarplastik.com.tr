import { describe, expect, it } from "vitest"

import { formatLotShiftDay, formatLotTimeRange, lotDetailPath, lotPlannedQuantity } from "./lotFormat"

describe("lot biçimleri", () => {
    it("vardiya günü, saat aralığı, adet ve adres", () => {
        expect(formatLotShiftDay({ shiftDate: "2026-09-28", shiftCode: "C" })).toBe("28.09.2026 Pzt · C")
        // C vardiyası: 29.09 00:00–08:00 (TR)
        expect(formatLotTimeRange({ plannedStartAt: "2026-09-28T21:00:00.000Z", plannedEndAt: "2026-09-29T05:00:00.000Z" })).toBe("00:00–08:00")
        expect(lotPlannedQuantity([{ plannedQuantity: 4000 }, { plannedQuantity: 4000 }])).toBe(8000)
        expect(lotDetailPath("1000-2")).toBe("/uretim/lotlar/1000-2")
    })
})
