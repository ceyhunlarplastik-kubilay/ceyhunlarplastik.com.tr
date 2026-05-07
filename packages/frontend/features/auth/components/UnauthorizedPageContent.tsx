import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthFeedbackMessage } from "@/features/auth/components/AuthFeedbackMessage"

type Props = {
    homeHref: string
    from?: string
}

export function UnauthorizedPageContent({ homeHref, from }: Props) {
    return (
        <div className="space-y-6">
            <AuthFeedbackMessage
                variant="error"
                title="Bu alan için yetkiniz bulunmuyor"
                description="İlgili sayfayı görüntülemek için gerekli role sahip değilsiniz. Uygun çalışma alanına veya ana sayfaya dönebilirsiniz."
            />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                Talep edilen alan: <span className="font-medium text-slate-800">{from ?? "Bilinmiyor"}</span>
            </div>

            <div className="flex flex-wrap gap-3">
                <Button asChild variant="brand" size="lg" className="h-11 rounded-xl px-5">
                    <Link href={homeHref}>Uygun Panele Git</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 rounded-xl px-5">
                    <Link href="/">Ana Sayfaya Dön</Link>
                </Button>
            </div>
        </div>
    )
}
