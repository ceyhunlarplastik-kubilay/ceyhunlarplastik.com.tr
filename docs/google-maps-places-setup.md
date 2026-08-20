# Google Maps ve Places Kurulumu

Uygulama tarafı Google Maps JavaScript API + Places UI Kit kullanır. Sunucu yalnız
Place Details (New) ile `place_id` doğrular. Google Geocoding API bu akışta
kullanılmaz.

## 1. Google Cloud projesi

Billing hesabı bağlı Google Cloud projesinde şunları etkinleştirin:

- Maps JavaScript API
- Places UI Kit API
- Places API (New)

Production için bir Map ID oluşturun. Harita tipi JavaScript/Vector olmalıdır.

## 2. Anahtarlar

İki ayrı anahtar oluşturun:

### Tarayıcı anahtarı

- Application restriction: Websites (HTTP referrers)
- API restriction: Maps JavaScript API, Places UI Kit API ve Places API (New)
- `Places API (New)` gereklidir; sonuç seçildikten sonra `addressComponents`
  alanı tarayıcıda `Place.fetchFields()` ile alınır.
- Referrer listesi `DOMAIN` env'inden türetilir; sabit bir alan adı varsaymayın.
  Aktif değeri `.env` içindeki `DOMAIN`'den (deploy ortamında verilen gerçek
  değer) okuyun ve listeye şunları ekleyin:
  - `http://localhost:3000/*`
  - kubi stage frontend adresi
  - `https://<DOMAIN>/*` ve kullanılıyorsa `https://www.<DOMAIN>/*`
- Bugün canlı alan adı `ceyhunlarplastik.xyz`; `ceyhunlarplastik.com.tr`'ye geçiş
  yapılana kadar **her ikisini de** listeye ekleyin. Yalnız `.com.tr` girilirse
  canlı sitede tüm Maps/Places istekleri `RefererNotAllowedMapError` ile düşer ve
  adres seçici sessizce fallback moduna geçer.

### Sunucu anahtarı

- API restriction: yalnız Places API (New)
- Anahtarı tarayıcı referrer listesine veya frontend ortamına eklemeyin.
- Production NAT için sabit çıkış IP’si kullanılıyorsa ayrıca IP restriction
  uygulanabilir. Neon stage Lambda’larında sabit çıkış IP’si yoksa API restriction
  zorunlu minimum korumadır.

## 3. SST secret değerleri

Değerleri repoya veya `.env` dosyasına yazmayın. Her stage için ayrı girin:

```bash
npx sst secret set GoogleMapsBrowserApiKey '<browser-key>' --stage kubi
npx sst secret set GoogleMapsServerApiKey '<server-key>' --stage kubi
npx sst secret set GoogleMapsMapId '<map-id>' --stage kubi
```

Production için aynı komutları `--stage prod` ile ve production değerleriyle
tekrarlayın. Local smoke test için uygulamayı ilgili SST stage üzerinden başlatın;
çıplak `next dev` SST secret değerlerini enjekte etmez.

## 4. Maliyet koruması

Google Cloud Console > APIs & Services > Quotas bölümünde günlük sınırları
ayarlayın:

- Dynamic Maps: 250/gün
- Places UI Kit Query: 250/gün
- Place Details Essentials: 250/gün
- Place Details Pro: 120/gün

Billing > Budgets & alerts bölümünde 1 USD ve 5 USD uyarıları oluşturun. Bütçe
uyarısı servisi durdurmaz; harcamayı durduran koruma günlük API kotalarıdır.

Fiyat ve ücretsiz kota değerleri zamanla değişebileceği için deploy öncesinde
[Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
sayfasını yeniden kontrol edin.

## 5. Migration ve deploy

Kubi Neon veritabanında migration:

```bash
npx sst shell --target Prisma --stage kubi
cd packages/core
npx prisma migrate deploy
```

Bu migration `CustomerAddress.geocodingExpiresAt` alanını ve yaşam döngüsü
indeksini ekler. Migration uygulanmadan yeni backend deploy edilmemelidir.

Ardından normal SST deploy akışını çalıştırın. `GoogleMapsLocationRefresh`
cron'u YALNIZ `prod` stage'inde oluşturulur (her gün 00:30 UTC); kubi ve diğer
non-prod stage'ler aynı Google kotasını tüketmesin diye zamanlanmış iş açmaz.
Non-prod'da yenilemeyi denemek isterseniz handler'ı elle çağırın.

## 6. Kubi smoke testi

- Firma adı, tam adres, şehir ve farklı ülke araması yapın.
- Sonuç seçildiğinde pinin taşındığını ve Google listesinin klavyeyle
  seçilebildiğini doğrulayın.
- Google sonucundan açık adres, mahalle/bölge ve posta kodunun; kendi referans
  verilerimizden de ülke, il ve ilçenin otomatik seçildiğini doğrulayın.
- Adresi kaydedip tekrar açın.
- Veritabanında `geocodingProvider = google_places`, `geocodingPlaceId` ve
  yaklaşık 29 gün sonraki `geocodingExpiresAt` değerini doğrulayın.
- `geocodingRaw` ve `geocodingLabel` Google kayıtlarında boş olmalıdır.
- Browser key’i geçici olarak kaldırıp manuel koordinat, tarayıcı konumu ve
  “Google Maps’te Ara” fallback’lerini kontrol edin.
- Admin ve satış haritalarında bounds filtreleme, cluster, popup, müşteri detayı
  ve yol tarifi akışlarını kontrol edin.

Google Console'daki API etkinleştirme, anahtar restriction, quota ve budget
ayarları kod deploy'u tarafından oluşturulmaz; bunlar hesap sahibi tarafından
bir kez yapılmalıdır.

## 7. `403 PERMISSION_DENIED` sorun giderme

Tarayıcıda haritanın ve firma aramasının çalışması sunucu anahtarını doğrulamaz.
Tarayıcı `GoogleMapsBrowserApiKey` ile çalışır; sonuç seçildikten sonraki
`addressComponents` çağrısı bu anahtar üzerinden Place Details Essentials
kullanır. Adres kaydı sırasındaki koordinat doğrulama isteği ise Lambda içindeki
`GoogleMapsServerApiKey` ile çalışır.

Harita ve arama çalıştığı halde adres alanları otomatik dolmuyorsa tarayıcı
anahtarının API restrictions listesine `Places API (New)` eklendiğini ve HTTP
referrer listesinin doğru olduğunu kontrol edin.

Kubi stage Lambda'larının sabit çıkış IP'si yoksa sunucu anahtarını şu şekilde
ayarlayın:

- Application restrictions: `None`.
- API restrictions: `Restrict key` ve yalnız `Places API (New)`.
- `Places API (New)` aynı Google Cloud projesinde etkin olmalı.
- Projeye aktif bir billing hesabı bağlı olmalı.
- Place Details kotası sıfır olmamalı ve günlük kota dolmamış olmalı.

Sunucu anahtarında `Websites (HTTP referrers)` kullanmayın; Lambda isteğinde
tarayıcı referrer'ı bulunmaz. `IP addresses` restriction ancak Lambda trafiği
sabit NAT/Elastic IP üzerinden çıkıyorsa kullanılabilir. Sabit IP eklenecekse
Google hata logunda bildirilen gerçek çıkış IP'sini izin listesine alın.

Secret değeri değiştirilirse yeniden kaydedin ve local SST sürecini yeniden
başlatın:

```bash
npx sst secret set GoogleMapsServerApiKey '<server-key>' --stage kubi
```

Uygulama Google'ın hata gövdesindeki `googleStatus`, `googleReason` ve
`googleMessage` alanlarını anahtarı göstermeden backend loguna yazar. `API_KEY_SERVICE_BLOCKED`,
`API_KEY_HTTP_REFERRER_BLOCKED`, billing veya API etkinleştirme mesajı bir sonraki
adımı doğrudan belirtir.
