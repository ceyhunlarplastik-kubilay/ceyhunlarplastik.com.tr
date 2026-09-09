import {
    Geist,
    Geist_Mono,
    Montserrat,
    Noto_Sans_Arabic,
    Noto_Sans_Devanagari,
    Noto_Sans_JP,
    Noto_Sans_KR,
    Noto_Sans_SC,
} from "next/font/google";

// İki root layout ([locale] ve (panels)) aynı font setini paylaşır;
// tek yerde tanımlı olması drift'i önler.
// Montserrat artık `.font-heading` ile SİTE GENELİNDE h1/h2 varsayılanı
// (bkz. globals.css @layer base) — Enviroment section'ın kendi font-light(300)/
// font-extrabold(800) gibi özel ağırlıkları da aynı ailede sürüyor. Sabit
// `weight: ["300","800"]` iki statik dosyaya kilitliyordu; normal başlıklarda
// gereken ara ağırlıklar (600/700) o iki dosyada YOK sayılıp tarayıcının en
// yakın statik ağırlığa (300 ya da 800) düşmesine ya da sahte kalınlaştırmaya
// yol açardı. Montserrat'ın Google Fonts'taki `wght` ekseni (100-900) `variable`
// ile tek dosyada geliyor — her ağırlık doğru render olur, ek dosya inmez.
// latin-ext ŞART: Türkçe (ı, ğ, ş) ve Lehçe (ł, ą, ę, ż) harfleri `latin`
// unicode-range'inin dışında. Eksik olduğunda tarayıcı o harflerde sistem
// fontuna düşüyor ve kelime ortasında karakter değişiyor. Maliyeti yok sayılır:
// Google Fonts unicode-range kullanıyor, ek dosya yalnız o harfler geçtiğinde iniyor.
//
// cyrillic Dalga 2'de (ru) eklendi — aynı unicode-range mantığı: Latin alfabeli
// sayfaları gezen ziyaretçi bu dosyaları HİÇ indirmez, yalnız Kiril karakter
// geçen sayfada iner. Üç font da bu subset'i sunuyor (Next font-data ile
// doğrulandı); biri eksik olsaydı Rusça metin sistem fontuna düşerdi.
// Rusça `cyrillic` ile tam karşılanır; `cyrillic-ext` (Ukraynaca/Bulgarca ek
// karakterleri) BİLEREK eklenmedi — Geist ailesi zaten sunmuyor ve ru için
// gereksiz. O diller açılırsa burası yeniden değerlendirilmeli.
const montserrat = Montserrat({
    subsets: ["latin", "latin-ext", "cyrillic"],
    variable: "--font-heading",
    weight: "variable",
});

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin", "latin-ext", "cyrillic"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin", "latin-ext", "cyrillic"],
});

// Arapça (Dalga 3) için AYRI BİR AİLE gerekti — ru'daki "subset ekle" hamlesi
// burada işlemiyor: Geist, Geist Mono ve Montserrat'ın hiçbiri `arabic` sunmuyor
// (Next font-data ile doğrulandı), eksik bırakılsaydı tüm Arapça metin sistem
// fontuna düşerdi.
//
// Yalnız `arabic` subset'i alınıyor; Latin karakterleri Geist zaten karşılıyor,
// Noto'nun Latin'ini de indirmek gereksiz bayt olurdu. Bağlanma biçimi
// globals.css'te YEDEK olarak: `--font-sans: var(--font-geist-sans), var(--font-arabic)`.
// Böylece tarayıcı Latin glifleri Geist'ten, Geist'te bulunmayan Arapça glifleri
// Noto'dan alır — locale'e bağlı koşullu sınıf gerekmiyor ve Arapça olmayan
// sayfada unicode-range sayesinde tek bayt inmez.
const notoSansArabic = Noto_Sans_Arabic({
    subsets: ["arabic"],
    variable: "--font-arabic",
});

// Dalga 4 (ko/ja/zh/hi). İki noktada Arapça'dan ayrılıyor:
//
// 1. CJK ailelerinde `subsets` VERİLEMİYOR. Next'in font verisinde Noto Sans
//    KR/JP/SC yalnız cyrillic/latin/latin-ext/vietnamese listeliyor; CJK yüzlerce
//    unicode-range parçasına bölündüğü için subset olarak ifade edilmiyor.
//    `preload: false` bunun için: parçalar önden yüklenmez, tarayıcı sayfada
//    geçen karaktere göre yalnız gerekli parçayı ister.
// 2. `--font-cjk` globals.css'te `:lang()` ile seçiliyor, düz yedek zincirine
//    KONMUYOR. Sebep: ja ve zh AYNI Han kod noktalarını paylaşır ama bölgesel
//    olarak farklı glif biçimleriyle yazılır. Düz zincirde hangisi önce gelirse
//    diğerinin sayfaları yanlış biçimleri alırdı; kod noktası aynı olduğu için
//    tarayıcı ayrım yapamaz. `<html lang>` zaten doğru ayarlı.
//
// Devanagari'nin gerçek bir subset'i var, Arapça gibi düz zincire giriyor.
const notoSansKR = Noto_Sans_KR({ preload: false, variable: "--font-kr" });
const notoSansJP = Noto_Sans_JP({ preload: false, variable: "--font-jp" });
const notoSansSC = Noto_Sans_SC({ preload: false, variable: "--font-sc" });

const notoSansDevanagari = Noto_Sans_Devanagari({
    subsets: ["devanagari"],
    variable: "--font-devanagari",
});

export const bodyFontClassName = [
    geistSans.variable,
    geistMono.variable,
    montserrat.variable,
    notoSansArabic.variable,
    notoSansDevanagari.variable,
    notoSansKR.variable,
    notoSansJP.variable,
    notoSansSC.variable,
    "antialiased",
].join(" ");
