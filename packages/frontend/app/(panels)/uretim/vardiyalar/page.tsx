import { CalendarExceptionsSection } from "@/features/production/calendar/components/CalendarExceptionsSection"
import { ShiftPatternsPageClient } from "@/features/production/shiftPatterns/components/ShiftPatternsPageClient"

export default function ShiftPatternsPage() {
    return (
        <div className="space-y-10">
            <ShiftPatternsPageClient />
            <CalendarExceptionsSection />
        </div>
    )
}
