import { MachineDowntimesSection } from "@/features/production/downtimes/components/MachineDowntimesSection"
import { ProductionMachinesPageClient } from "@/features/production/machines/components/ProductionMachinesPageClient"

export default function ProductionMachinesPage() {
    return (
        <div className="space-y-10">
            <ProductionMachinesPageClient />
            <MachineDowntimesSection />
        </div>
    )
}
