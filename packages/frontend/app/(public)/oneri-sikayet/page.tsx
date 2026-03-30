import type { Metadata } from "next";
import { SuggestionForm } from "@/features/public/suggestion/components/SuggestionForm";

export const metadata: Metadata = {
    title: "Öneri & Şikayet | Ceyhunlar Plastik",
    description:
        "Ceyhunlar Plastik öneri ve şikayet formu. Görüşlerinizi bizimle paylaşın.",
};

export default function SuggestionPage() {
    return (
        <main>
            <SuggestionForm />
        </main>
    );
}