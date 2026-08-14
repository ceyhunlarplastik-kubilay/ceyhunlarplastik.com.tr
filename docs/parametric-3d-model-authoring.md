# Parametrik 3D Model Hazırlama Standardı

Ürün sayfası yalnız tek dosyalık glTF 2.0 `.glb` modellerini kabul eder. Texture ve buffer verileri GLB içine gömülmelidir. Parametrik manifest taşımayan geçerli GLB dosyaları `<model-viewer>` ile statik gösterilir; geçerli manifest taşıyanlar React Three Fiber görüntüleyicisine yönlendirilir.

## Modelleme kuralları

- Blender/CAD sahnesi metre cinsinden ve ürünün nötr `baseValue` ölçülerinde hazırlanır.
- Geometrik olarak sabit kalacak uç, delik, radyüs ve geçme bölgeleri ayrı node'lardır.
- Ölçeklenecek orta bölgelerin pivotu deformasyonun sabit kalacak kenarına yerleştirilir.
- Taşınacak uç parçalar ayrı node'lardır. Bir ölçü için ölçeklenen orta bölgeye ek olarak uç node'a `translate` kuralı verilir.
- Manifestte kullanılan node, materyal ve animasyon adları sahnede benzersiz olmalıdır.
- Topoloji değişen varyantlar tek parametrik GLB ile temsil edilmez; ayrı ürün modeli hazırlanır.
- Ölçü kodları veritabanındaki `MeasurementType.code` değerleriyle birebir aynı olmalıdır.

## Manifest konumu

Manifest aşağıdaki konumlardan birinde `ceyhunlarModel3d` anahtarıyla saklanabilir:

1. glTF `asset.extras`
2. Aktif scene'in `extras` alanı
3. `CEYHUNLAR_CONFIG` isimli node'un `extras` alanı

Blender'da kök scene veya `CEYHUNLAR_CONFIG` empty nesnesine custom property eklenip GLB export sırasında custom properties etkinleştirilebilir. Export sonrası admin yükleme ekranı manifesti ve referansları doğrular.

```json
{
  "ceyhunlarModel3d": {
    "version": 1,
    "renderer": "r3f-parametric",
    "measurementUnit": "millimeter",
    "parameters": [
      {
        "measurementCode": "L",
        "baseValue": 100,
        "min": 80,
        "max": 160,
        "rules": [
          { "kind": "scale", "node": "L_STRETCH", "axis": "x" },
          { "kind": "translate", "node": "L_END", "axis": "x", "factor": 1 }
        ]
      }
    ],
    "materialSlots": [
      {
        "id": "body",
        "materialNames": ["Body"],
        "colorFromVariant": true,
        "materialPresets": {
          "PP": { "metalness": 0, "roughness": 0.72 },
          "PA": { "metalness": 0, "roughness": 0.58 }
        }
      }
    ],
    "animations": [
      { "clipName": "Assembly", "label": "Montaj" }
    ]
  }
}
```

`scale` hedef ölçünün `baseValue` değerine oranını node'un belirtilen yerel eksenine uygular. `translate`, hedef ve temel ölçü farkını milimetreden metreye çevirir ve `factor` ile çarpar. Negatif `factor` ters yönlü hareket içindir.

## Kabul kontrolü

- GLB yükleme ekranında statik veya parametrik olarak başarıyla doğrulanmalıdır.
- Her parametrik ölçü grubu manifestin `min`/`max` aralığında olmalıdır.
- Bilinen test ölçüsünde doğrulama noktaları hedef ölçüye en fazla `0,1 mm` farkla ulaşmalıdır.
- Et kalınlığı, delik çapı ve köşe radyüsleri ölçü değişiminde değişmemelidir; bunlar ölçeklenen node'un dışında modellenmelidir.
