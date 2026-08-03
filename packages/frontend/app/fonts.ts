import { Geist, Geist_Mono, Montserrat } from "next/font/google";

// İki root layout ([locale] ve (panels)) aynı font setini paylaşır;
// tek yerde tanımlı olması drift'i önler.
// Montserrat yalnızca .font-heading ile Enviroment section'ında kullanılıyor
// (font-light=300 ve font-extrabold=800). Diğer weight'ler boşuna indiriliyordu;
// 300 ise hiç yüklenmediği için font-light yanlış weight'e düşüyordu.
// latin-ext ŞART: Türkçe (ı, ğ, ş) ve Lehçe (ł, ą, ę, ż) harfleri `latin`
// unicode-range'inin dışında. Eksik olduğunda tarayıcı o harflerde sistem
// fontuna düşüyor ve kelime ortasında karakter değişiyor. Maliyeti yok sayılır:
// Google Fonts unicode-range kullanıyor, ek dosya yalnız o harfler geçtiğinde iniyor.
const montserrat = Montserrat({
    subsets: ["latin", "latin-ext"],
    variable: "--font-heading",
    weight: ["300", "800"],
});

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin", "latin-ext"],
});

export const bodyFontClassName = `${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased`;
