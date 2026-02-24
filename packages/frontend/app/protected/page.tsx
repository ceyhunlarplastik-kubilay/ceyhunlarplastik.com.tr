import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function ProtectedPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/")
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
            <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                        Korumalı Sayfa
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Bu sayfayı sadece kimlik doğrulaması yapmış olanlar (SST Cognito) görebilir.
                    </p>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg text-sm border border-zinc-200 dark:border-zinc-700">
                    <h2 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-4 whitespace-nowrap">
                        Sunucu Tarafı (Server-Session) Bilgileri:
                    </h2>
                    <div className="space-y-3">
                        <pre className="overflow-x-auto text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {JSON.stringify(session.user, null, 2)}
                        </pre>
                    </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <a
                        href="/"
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                    >
                        &larr; Ana Sayfaya Dön
                    </a>
                </div>
            </div>
        </div>
    )
}
