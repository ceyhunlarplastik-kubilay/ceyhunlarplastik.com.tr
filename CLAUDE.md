@AGENTS.md
@PROJECT_OVERVIEW.md

## Bu dosyanın amacı
AGENTS.md ve PROJECT_OVERVIEW.md yukarıda import edildi — asıl kurallar ve indeks
oralarda. Buradaki notlar sadece Claude Code'a özel, tekrar etmeyen ek talimatlar.

## Genel operasyon kuralları
- Migration gerektiren bir şema değişikliği öneriyorsan, migration dosyasını kendin
  oluşturmadan önce planı göster ve onay iste.
- `infra/` altında `prod` stage `protect: true` ve `removal: "retain"` ile korunuyor.
  Bu stage'i etkileyebilecek bir infra değişikliği yapmadan önce mutlaka planı göster.
- PROJECT_OVERVIEW.md'nin "Bilinen Doküman/Kod Sapmaları" bölümündeki noktalarda
  AGENTS.md/ARCHITECTURE.md'ye değil, gerçek koda güven.
- Büyük refactor (birden fazla feature/package'ı etkileyen) önerilerinde önce kısa bir
  plan sun, onay almadan uygulamaya başlama.