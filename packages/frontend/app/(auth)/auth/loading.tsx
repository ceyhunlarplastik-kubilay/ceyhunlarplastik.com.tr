import { Spinner } from "@/components/ui/spinner"

export default function AuthLoading() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#f6f0e8,transparent_38%),linear-gradient(180deg,#fcfaf7_0%,#f6f4ef_100%)]">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(15,23,42,0.025)_45%,transparent_100%)]" />
            <div className="relative flex min-h-screen items-center justify-center px-6">
                <div className="flex flex-col items-center gap-4 rounded-[28px] border border-slate-200/70 bg-white/92 px-8 py-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                    <Spinner className="size-6 text-brand" />
                    <div className="space-y-1 text-center">
                        <div className="text-sm font-semibold text-slate-900">Kimlik doğrulama ekranı hazırlanıyor</div>
                        <div className="text-sm text-slate-500">Lütfen kısa bir an bekleyin.</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
