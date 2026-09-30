import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
    productionModules,
    type ProductionModule,
} from "@/features/production/overview/productionModules"

function ModuleCardBody({ item }: { item: ProductionModule }) {
    const Icon = item.icon

    return (
        <>
            <div className="flex items-start justify-between gap-3">
                <div className="inline-flex rounded-2xl border bg-muted p-3 text-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                </div>
                <Badge variant={item.href ? "secondary" : "outline"}>
                    {item.href ? "Hazır" : `${item.phase} · Yakında`}
                </Badge>
            </div>
            <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
        </>
    )
}

/**
 * `/uretim` genel bakışı. Planlama tahtası gelene kadar (Faz 3) panelin giriş
 * sayfası budur: hangi modülün hazır, hangisinin sırada olduğunu gösterir.
 */
export function ProductionOverview() {
    return (
        <div className="space-y-8">
            <section className="space-y-3">
                <Badge variant="outline" className="rounded-full">
                    Üretim Planlama
                </Badge>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Enjeksiyon üretimini planlayın, vardiya vardiya takip edin.
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                    Kalıbı ona uyan makineyle buluşturun, işi vardiya takvimine yerleştirin ve her
                    üretimi lot numarasıyla izleyin. Modüller aşağıdaki sırayla devreye giriyor.
                </p>
            </section>

            <section aria-labelledby="production-modules-heading" className="space-y-4">
                <h2 id="production-modules-heading" className="text-lg font-semibold tracking-tight">
                    Modüller
                </h2>
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {productionModules.map((item) => (
                        <li key={item.title}>
                            {item.href ? (
                                <Link
                                    href={item.href}
                                    className="block h-full rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-foreground/20"
                                >
                                    <ModuleCardBody item={item} />
                                </Link>
                            ) : (
                                <div className="h-full rounded-2xl border border-dashed bg-card p-5">
                                    <ModuleCardBody item={item} />
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    )
}
