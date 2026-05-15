import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthFeedbackMessage } from "@/features/auth/components/AuthFeedbackMessage"

type Props = {
    callbackUrl: string
    email?: string
}

export function AwaitingApprovalPageContent({ callbackUrl, email }: Props) {
    return (
        <div className="space-y-6">
            <AuthFeedbackMessage
                variant="info"
                title="Hesabınız oluşturuldu"
                description="Yetkilendirme bekleniyor. Bir yönetici hesabınızı inceleyip uygun role ataması yaptıktan sonra erişim sağlayabileceksiniz. Durum: İnceleniyor."
            />

            {email ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    Bildirimler <span className="font-medium text-slate-900">{email}</span> adresine gönderilecektir.
                </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
                <Button asChild variant="brand" size="lg" className="h-11 rounded-xl px-5">
                    <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}&email=${encodeURIComponent(email ?? "")}`}>
                        Giriş ekranına dön
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 rounded-xl px-5">
                    <Link href="/">
                        Ana sayfaya git
                    </Link>
                </Button>
            </div>
        </div>
    )
}
