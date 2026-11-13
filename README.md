# QR to 2FA

Chrome ve Firefox eklentisi. Tek arayüz: tarayıcının yan paneli. Panelde boş bir "okunan kod" alanı ve **QR tara** butonu var. Butona basınca sayfada QR'ın çevresini fareyle seçersin; eklenti o alanın ekran görüntüsünü alıp QR'ı yerelde çözer ve sonucu aynı alanda gösterir. `otpauth://` (2FA) QR'larında servis, hesap ve **anahtar** ayrı gösterilir; **Anahtarı kopyala** boşluksuz anahtarı panoya yazar. Sorun olursa alan ne yapılacağını adım adım yazar.

## Kullanım

1. Araç çubuğundaki simgeye tıkla: yan panel açılır (Chrome Side Panel, Firefox Sidebar).
2. **QR tara**'ya bas, sayfada QR'ın çevresini sürükleyerek seç. Vazgeçmek için paneldeki **İptal**, sayfada `Esc` veya sağ tık.
3. Sonuç paneldeki alanda: **Anahtarı kopyala** / **Metni kopyala**.

Eklenti yalnız simgesine tıkladığın sekmeye erişir. Başka sekmeye geçince veya sayfa yenilenince panel bunu söyler; simgeye bir kez tıklayıp tekrar taramak yeter.

## Build

```bash
bun install
bun run test
bun run typecheck
bun run dev        # sourcemap, minify kapalı
bun run build      # dist/chrome ve dist/firefox
bun run pack       # dist/packages: Chrome zip, Firefox zip, kaynak tar.gz
bun run lint:ext   # dist/firefox için web-ext lint
```

## Yükleme (geliştirici)

**Chrome / Edge / Brave:** `chrome://extensions` → Geliştirici modu → Paketlenmemiş öğe yükle → `dist/chrome`.

**Firefox:** `about:debugging#/runtime/this-firefox` → Geçici eklenti yükle → `dist/firefox/manifest.json`. Tarayıcı kapanınca gider.

## Yayın

Mağaza metinleri ve izin gerekçeleri `STORE.md`, gizlilik politikası `PRIVACY.md`. Yeni sohbete devam: `firstPrompt.md`.

| Mağaza | Hesap | Yüklenen | Ek |
|--------|-------|----------|----|
| Chrome Web Store | Geliştirici kaydı (tek seferlik ücret), 2 adımlı doğrulama | `qrto2fa-chrome-<sürüm>.zip` | Gizlilik sekmesi, izin gerekçeleri, gizlilik politikası URL'si |
| Microsoft Edge Add-ons | Partner Center (ücretsiz) | Aynı Chrome zip'i | Aynı listeleme bilgileri |
| Firefox (AMO) | addons.mozilla.org hesabı (ücretsiz) | `qrto2fa-firefox-<sürüm>.zip` | Kaynak kodu `qrto2fa-source-<sürüm>.tar.gz` ve build adımları |

Her yeni sürümde `package.json` içindeki `version` artırılır, sonra `bun run pack`.

Firefox'u mağazada listelemeden kalıcı kurmak için "unlisted" imza:

```bash
bunx web-ext sign --source-dir dist/firefox --channel unlisted --api-key <JWT issuer> --api-secret <JWT secret>
```

## Yapı

| Dosya | İş |
|-------|-----|
| `src/background.ts` | Simgeye tıklanınca yan paneli açar |
| `src/panel/` | Yan panel: alan, buton, tarama akışı, yönlendirme metinleri |
| `src/content.ts`, `src/content/` | Sayfada fare ile alan seçimi |
| `src/lib/decode.ts` | Kırpma (X/Y ayrı ölçek), beyaz kenar, küçük QR'da büyütme, büyük seçimde küçültme, `BarcodeDetector` sonra `jsQR` |
| `src/lib/otpauth.ts` | `otpauth://` ayrıştırma |
| `src/lib/migration.ts` | Google Authenticator `otpauth-migration://` protobuf'unu yerelde çözer |
| `src/lib/page.ts` | Taranamayan sayfa ve `file://` ayrımı |
| `scripts/` | Bun bundle, hedefe göre manifest, PNG ikonlar |

## Gizlilik

- İzinler: `activeTab`, `scripting`, `clipboardWrite`, Chrome'da ek olarak `sidePanel`. Tüm sitelere kalıcı erişim yok.
- Ağ isteği yok, hiçbir şey saklanmaz. Ekran görüntüsü bellekte çözülüp atılır; anahtar yalnız eklentinin kendi panelinde görünür. Chromium'da varsa önce tarayıcının yerleşik barkod okuyucusu denenir, sonra paketlenmiş `jsQR`.

## Sınırlar

- `chrome://`, `about:`, yeni sekme, eklenti mağazaları ve tarayıcının PDF görüntüleyicisi taranamaz.
- `file://` sayfaları Chrome ve Edge'de eklenti ayrıntılarından dosya erişimi açılmadan taranamaz. Firefox'ta bu sayfalar çoğu zaman kapalıdır.
- Dialog ve popover içindeki QR seçilebilir; seçim katmanı sayfanın üst katmanına çıkar.
- Google Authenticator dışa aktarma QR'ı (`otpauth-migration://`) yerelde hesaplara ayrılır. Aktarım birkaç QR'a bölündüyse panel kalan parçayı da taramayı söyler.
- Varsayılan olmayan algoritma, hane veya süre panelde görünür; kopyalanan değer yalnız anahtardır, bu alanları authenticator uygulamasında ayrıca seçmek gerekir.
