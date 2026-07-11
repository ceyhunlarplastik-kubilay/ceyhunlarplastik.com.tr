// OpenNext yapılandırması — SST (sst.aws.Nextjs) deploy build'inde
// `npx @opennextjs/aws build` bu dosyayı okur.
//
// aws-lambda-streaming: server function'ı Lambda response streaming
// (RESPONSE_STREAM invoke mode) ile çalıştırır. Buffered moddaki 6MB yanıt
// limiti kalkar (soft limit ~20MB, ilk 6MB sonrası bant genişliği kısıtlı)
// ve TTFB düşer. Bu bir güvenlik ağıdır; sayfa payload'larını küçük tutma
// sorumluluğu asıl olarak veri katmanındadır (bkz. toSimilarProductItems,
// productRepository card view).
//
// Not: `@opennextjs/aws` bilinçli olarak dependency değildir (SST npx ile
// çalıştırır); bu yüzden burada type import kullanılmaz.
const config = {
    default: {
        override: {
            wrapper: "aws-lambda-streaming",
        },
    },
}

export default config
