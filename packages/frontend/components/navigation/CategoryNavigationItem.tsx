"use client";

import {
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
} from "@/components/ui/navigation-menu";

import { CategoryCard } from "@/components/navigation/CategoryCard";
import type { Category } from "@/features/public/categories/types";

export function CategoryNavigationItem({
    categories,
}: {
    categories: Category[];
}) {
    if (!categories?.length) return null;

    return (
        <NavigationMenuItem>
            <NavigationMenuTrigger className="nav-pill text-base font-medium bg-transparent">
                Kategoriler
            </NavigationMenuTrigger>

            <NavigationMenuContent className="!fixed !left-0 !right-0 !w-screen !max-w-none data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out">
                <div className="w-full bg-popover border-t shadow-lg py-6">
                    <div className="w-full px-6 md:px-8">
                        <ul className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
                            {categories.map((category) => {
                                const primaryImage = category.assets?.find((a) => a.role === "PRIMARY")?.url;
                                const animatedImage = category.assets?.find((a) => a.role === "ANIMATION")?.url;

                                return (
                                    <CategoryCard
                                        key={category.id}
                                        title={category.name}
                                        code={category.code}
                                        href={`/urun-kategori/${category.slug}`}
                                        // href={`/urunler/filtre?category=${category.slug}`}
                                        imageStatic={primaryImage ?? "/categories/img/1.jpg"}
                                        imageAnimated={animatedImage ?? "/categories/gif/1.gif"}
                                        asNavigationItem
                                    >
                                        {category.name}
                                    </CategoryCard>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </NavigationMenuContent>
        </NavigationMenuItem>
    );
}


/* "use client";

import {
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import { CategoryCard } from "@/components/navigation/CategoryCard";

import { useCategories } from "@/features/public/categories/hooks/useCategories";

export function CategoryNavigationItem() {
    const { data, isLoading, error } = useCategories();

    console.log(data);

    if (isLoading) {
        return <div className="text-muted-foreground">Loading categories...</div>;
    }

    if (error) {
        return <div className="text-red-600">Hata: {(error as Error).message}</div>;
    }

    if (!data || data.length === 0) {
        return <div className="text-muted-foreground">No categories found</div>;
    }

    return (
        <NavigationMenuItem>
            <NavigationMenuTrigger className="text-base font-medium bg-transparent">
                Kategoriler
            </NavigationMenuTrigger>
            <NavigationMenuContent className="!fixed !left-0 !right-0 !w-screen !max-w-none data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out">
                <div className="w-full bg-popover border-t shadow-lg py-6">
                    <div className="w-full px-6 md:px-8">
                        <ul className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
                            {data.map((category) => (
                                <CategoryCard
                                    key={category.id}
                                    title={category.name}
                                    code={category.code}
                                    href={`/urun-kategori/${category.id}`}
                                    imageStatic={`/categories/img/${category.code}.jpg`}
                                    imageAnimated={`/categories/gif/${category.code}.gif`}
                                    // unoptimized
                                    asNavigationItem
                                >
                                    {category.name}
                                </CategoryCard>
                            ))}
                        </ul>
                    </div>
                </div>
            </NavigationMenuContent>
        </NavigationMenuItem>
    );
}
 */