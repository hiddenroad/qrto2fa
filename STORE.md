# Mağaza metinleri

Arayüz Türkçe. İngilizce metinler mağazanın İngilizce listelemesi ve inceleme formları için. Depo: https://github.com/hiddenroad/qrto2fa

## Ortak

- **Ad:** QR to 2FA
- **Kategori:** Chrome / Edge → Tools (Araçlar) · Firefox → Privacy & Security
- **Dil:** Türkçe
- **Gizlilik politikası URL'si:** https://github.com/hiddenroad/qrto2fa/blob/main/PRIVACY.md
- **Destek URL'si:** https://github.com/hiddenroad/qrto2fa/issues
- **Ücret:** Ücretsiz, ticari değil. Chrome "Trader status" → **Non-trader** (ticari faaliyet değil).

## Kısa açıklama

Chrome / Edge özeti en fazla 132 karakter. Firefox özeti en fazla 250 karakter.

**TR:**

> 2FA QR kodunu ekranda seç, anahtarını cihazında çöz ve kopyala. Hiçbir veri dışarı gitmez; QR'ı AI sohbetine yüklemen gerekmez.

**EN:**

> Select a 2FA QR on screen and copy its setup key. Decoded on your device, nothing leaves it. No need to paste QRs into AI chats.

## Uzun açıklama

**TR:**

> Siteler iki adımlı doğrulamayı (2FA) açarken bir QR kod gösterir. Bu QR, hesabının kalıcı gizli anahtarını içerir. Bazı kullanıcılar QR'ı okutmak için ekran görüntüsünü bir AI sohbetine veya çevrimiçi bir QR okuyucuya yüklüyor. Bu durumda anahtar o servisin sunucularına ve kayıtlarına gider; anahtarı ele geçiren herkes doğrulama kodlarını üretebilir.
>
> QR to 2FA bu riski ortadan kaldırmak için yapıldı. QR'ı tarayıcının içinde, internete bağlanmadan çözer.
>
> Nasıl kullanılır:
> 1. Eklenti simgesine tıkla, yan panel açılır.
> 2. "QR tara"ya bas ve sayfada QR kodun çevresini fareyle seç.
> 3. Panelde servis, hesap ve anahtar görünür. "Anahtarı kopyala" ile authenticator uygulamandaki "kurulum anahtarı gir" alanına yapıştır.
>
> Okunamazsa veya sayfa taranamıyorsa panel ne yapman gerektiğini adım adım yazar.
>
> Bilerek basit tutuldu:
> - Hesap, ayar, geçmiş veya senkron yok.
> - Ağ isteği, analiz, reklam yok. Hiçbir şey saklanmaz.
> - Yalnız simgesine tıkladığın sekmeye geçici erişir; tüm sitelere izin istemez.
> - Ekran görüntüsü yalnız bellekte işlenir ve hemen atılır.
>
> 2FA olmayan QR'larda içerik metin olarak gösterilir ve kopyalanabilir. Google Authenticator dışa aktarma QR'ındaki hesaplar yerelde ayrıştırılır; aktarım birden fazla QR'a bölündüyse panel kalan parçayı da taramayı söyler. Algoritma, hane sayısı veya süre varsayılandan farklıysa panel bunu yazar; kopyalanan değer yalnız anahtardır.
>
> Ticari değildir, ücretsizdir.

**EN:**

> When a site turns on two-factor authentication (2FA), it shows a QR code that contains your account's permanent secret key. Some people upload a screenshot of that QR to an AI chat or an online QR reader just to read it. The secret then ends up on that service's servers and logs, and anyone who obtains it can generate your login codes.
>
> QR to 2FA was made to avoid that risk. It decodes the QR inside your browser, without any network connection.
>
> How to use:
> 1. Click the extension icon to open the side panel.
> 2. Press "QR tara" (Scan QR) and drag a box around the QR code on the page.
> 3. The panel shows the service, account and secret key. Use "Anahtarı kopyala" (Copy key) and paste it into your authenticator app's "enter setup key" option.
>
> If the QR can't be read or the page can't be scanned, the panel explains what to do step by step.
>
> Deliberately minimal:
> - No account, settings, history or sync.
> - No network requests, analytics or ads. Nothing is stored.
> - Temporary access only to the tab where you click the icon; no "all sites" permission.
> - The screenshot is processed in memory and discarded immediately.
>
> Non-2FA QR codes are shown as copyable text. Accounts inside a Google Authenticator export QR are decoded on the device; if the export is split across several QRs, the panel says to scan the remaining parts. When the algorithm, digit count or period is not the default, the panel says so; the copied value is only the secret.
>
> The interface is in Turkish. Free and non-commercial.

## Chrome Web Store → Privacy practices

**Single purpose:**

> Read a QR code that the user selects on the current page and show its content, especially a 2FA setup key, so the user can copy it into an authenticator app without uploading the QR anywhere.

**Permission justifications:**

| İzin | Gerekçe (EN) |
|------|--------------|
| `activeTab` | Needed to inject the selection overlay into, and capture a screenshot of, only the tab where the user clicked the extension icon. Used only after the user presses "Scan QR". |
| `scripting` | Injects the bundled selection overlay so the user can drag a box around the QR code on the current page. |
| `clipboardWrite` | Copies the decoded key or text to the clipboard when the user presses a Copy button. |
| `sidePanel` | The single user interface: shows the scan button and the decoded result. |

- **Host permissions:** yok / none.
- **Remote code:** "No, I am not using remote code." Tüm kod pakette, `jsQR` paketlenmiş.
- **Data usage:** Hiçbir kategoriyi işaretleme. Veri cihazdan çıkmaz ve saklanmaz; yerel işleme gizlilik politikasında açıklanıyor. Üç beyan kutusunu işaretle (veri satılmaz, amaç dışı kullanılmaz, kredi değerlendirmesi için kullanılmaz).

## Firefox (AMO) → İnceleyici notu

Kod Bun ile paketlendiği için kaynak kodu zorunlu. `bun run pack` → `dist/packages/qrto2fa-source-<sürüm>.tar.gz` yüklenir.

> Build: Bun 1.4.3. `bun install --frozen-lockfile` then `bun run test`, `bun run typecheck` and `bun run build`. The Firefox package is generated in `dist/firefox`. `scripts/build.ts` bundles `src/background.ts`, `src/content.ts` and `src/panel/panel.ts` with Bun (minified IIFE), copies `src/panel/panel.html` and `panel.css`, writes `manifest.json` from `scripts/manifest.ts`, generates PNG icons in `scripts/icons.ts`, and copies `LICENSE`, `THIRD_PARTY_NOTICES.md` and `licenses/jsQR-Apache-2.0.txt`. The only runtime dependency is `jsqr` 1.4.0 from npm (Apache-2.0). Chromium may use the browser's built-in BarcodeDetector first; that API is local. The extension makes no network requests and loads no remote code. Gecko id: `qrto2fa@hiddenroad.github.io`.

- **Lisans:** AMO formunda seç (öneri: MIT).
- **Veri toplama:** manifest'te `data_collection_permissions: none`.

## Görseller

- Simge 128×128: `dist/chrome/icons/128.png`
- Ekran görüntüsü: Chrome 1280×800 (en az 1). Firefox için de aynısı kullanılabilir.
- Chrome küçük tanıtım görseli: 440×280.
