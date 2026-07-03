import { Skeleton } from "@/components/ui/skeleton"

export function ProductAttributeValuesSkeleton() {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={index}
                    className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm"
                >
                    <div className="grid gap-0 sm:grid-cols-[180px_minmax(0,1fr)]">
                        <Skeleton className="min-h-[180px] rounded-none" />
                        <div className="space-y-4 p-4">
                            <Skeleton className="h-5 w-2/3" />
                            <Skeleton className="h-4 w-1/2" />
                            <div className="flex gap-2 pt-8">
                                <Skeleton className="h-9 w-28" />
                                <Skeleton className="h-9 w-24" />
                                <Skeleton className="h-9 w-9" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
