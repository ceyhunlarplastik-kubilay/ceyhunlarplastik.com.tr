import Link from "next/link"
import { redirect } from "next/navigation"
import {
    ArrowRight,
    Boxes,
    ClipboardList,
    ClipboardCheck,
    Folder,
    ShieldCheck,
    Truck,
    UserRoundCog,
    Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth/require-role"

const quickLinks = [
    {
        href: "/admin/potansiyel-musteriler",
        title: "Potansiyel Müşteriler",
        description: "Lead havuzunu, satış temsilcisi atamalarını ve dönüşüm sürecini takip edin.",
        icon: Users,
    },
    {
        href: "/admin/cari-musteriler",
        title: "Cari Müşteriler",
        description: "Aktif müşteri portföyünü, sektör eşleşmelerini ve tanımlı ürünleri yönetin.",
        icon: UserRoundCog,
    },
    {
        href: "/admin/onaylar",
        title: "İş Talep Onayları",
        description: "Customer, sales ve purchasing tarafındaki workflow taleplerini tek listede yönetin.",
        icon: ClipboardCheck,
    },
    {
        href: "/admin/supplier-approval-requests",
        title: "Tedarikçi İş Talepleri",
        description: "Supplier profil ve varyant fiyat taleplerini generic workflow ve fark görünümüyle inceleyin.",
        icon: ShieldCheck,
    },
]

const operations = [
    {
        href: "/admin/products",
        title: "Ürün Modelleri",
        description: "Kategori, attribute ve medya ilişkileriyle ürün model kütüphanesini düzenleyin.",
        icon: Boxes,
    },
    {
        href: "/admin/categories",
        title: "Kategoriler",
        description: "Attribute izinleri ve görsel yapısıyla kategori mimarisini koruyun.",
        icon: Folder,
    },
    {
        href: "/admin/suppliers",
        title: "Tedarikçiler",
        description: "Satın almacı atamalarını ve operasyonel tedarikçi kayıtlarını yönetin.",
        icon: Truck,
    },
    {
        href: "/admin/users",
        title: "Kullanıcılar",
        description: "Rol, müşteri ve tedarikçi eşleşmelerini tek yerden yönetin.",
        icon: UserRoundCog,
    },
    {
        href: "/admin/web-requests",
        title: "Web Talepleri",
        description: "Form ve sepet tabanlı public talepleri operasyon ekibine aktarın.",
        icon: ClipboardList,
    },
]

export default async function AdminPage() {
    try {
        await requireRole(["admin", "owner"])
    } catch {
        redirect("/?error=unauthorized")
    }

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
                <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_minmax(0,0.9fr)] lg:p-8">
                    <div className="space-y-5">
                        <Badge variant="outline" className="rounded-full border-neutral-200 bg-neutral-50 text-neutral-700">
                            Yönetim Başlangıç Ekranı
                        </Badge>

                        <div className="space-y-3">
                            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-neutral-950 lg:text-4xl">
                                Operasyon, CRM ve tedarik süreçlerini tek bakışta yönetin.
                            </h1>
                            <p className="max-w-2xl text-sm leading-7 text-neutral-600 lg:text-base">
                                Bu alan ürün mimarisi, müşteri portföyü, tedarikçi ilişkileri ve onay akışları için ana kontrol noktasıdır.
                                Günlük operasyonu hızlandırmak için önce aşağıdaki kısa yollarla başlayın.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button asChild>
                                <Link href="/admin/potansiyel-musteriler">
                                    {/* Lead Havuzunu Aç */}
                                    Potansiyel Müşterileri Yönet
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/admin/supplier-approval-requests">
                                    Tedarikçi Taleplerini Aç
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/admin/onaylar">
                                    İş Taleplerini Aç
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">CRM</div>
                            <p className="mt-3 text-sm leading-6 text-neutral-700">
                                Potansiyel ve cari müşteri kayıtlarını ayrı akışlarda yönetin.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">Onay</div>
                            <p className="mt-3 text-sm leading-6 text-neutral-700">
                                Supplier taleplerinde yalnızca değişen alanlara odaklanın.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">Ürün Yapısı</div>
                            <p className="mt-3 text-sm leading-6 text-neutral-700">
                                Ürün, kategori ve attribute kararlarını tek sistem altında tutun.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-neutral-950">Hızlı Erişim</h2>
                    <p className="text-sm text-neutral-500">
                        En sık kullanılan operasyon alanlarına kısa yoldan geçin.
                    </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    {quickLinks.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="inline-flex rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-neutral-700">
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-neutral-950">{item.title}</h3>
                                        <p className="mt-2 text-sm leading-6 text-neutral-600">{item.description}</p>
                                    </div>
                                </div>

                                <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-neutral-950">Operasyon Alanları</h2>
                    <p className="text-sm text-neutral-500">
                        Sistem mimarisini bozmadan günlük yönetim akışlarını sürdürebileceğiniz temel bölümler.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {operations.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-colors hover:border-neutral-300"
                        >
                            <div className="mb-4 inline-flex rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-neutral-700">
                                <item.icon className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-semibold text-neutral-950">{item.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-neutral-600">{item.description}</p>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    )
}
