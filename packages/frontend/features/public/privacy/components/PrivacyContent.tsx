import { useTranslations } from "next-intl";

type Section = {
    title: string;
    body: string;
};

export function PrivacyContent() {
    const t = useTranslations("public.privacy");
    const sections = t.raw("sections") as Section[];

    return (
        <main className="bg-white">
            <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
                <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
                    {t("title")}
                </h1>
                <p className="mt-2 text-sm text-neutral-500">{t("updatedAt")}</p>

                <p className="mt-8 leading-relaxed text-neutral-700">{t("intro")}</p>

                <div className="mt-10 space-y-8">
                    {sections.map((section) => (
                        <section key={section.title}>
                            <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                            <p className="mt-3 leading-relaxed text-neutral-700">{section.body}</p>
                        </section>
                    ))}
                </div>
            </div>
        </main>
    );
}
