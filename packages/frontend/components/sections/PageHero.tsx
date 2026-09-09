import { PageBreadcrumb, type PageBreadcrumbItem } from "@/components/sections/PageBreadcrumb";
import { PageHeroBanner } from "@/components/sections/PageHeroBanner";

interface PageHeroProps {
    title: string;
    breadcrumbs?: PageBreadcrumbItem[];
    backgroundImage?: string;
}

/**
 * `PageBreadcrumb` + `PageHeroBanner` için geriye dönük uyumlu sarmalayıcı —
 * 13 sayfa hâlâ bu tek prop imzasını (title/breadcrumbs/backgroundImage)
 * kullanıyor. İkisi ayrı ayrı da kullanılabilir (ör. banner istemeyen bir sayfa).
 */
export function PageHero(props: PageHeroProps) {
    return (
        <>
            <PageBreadcrumb items={props.breadcrumbs} />

            {/* GEÇİCİ (kullanıcı talebiyle): yalnız breadcrumb'ı görmek için banner
                yorumda — geri açmak için aşağıdaki satırı yorumdan çıkar. */}
            {/* <PageHeroBanner title={props.title} backgroundImage={props.backgroundImage} /> */}
        </>
    );
}
