# firstPrompt — yeni AI sohbeti için

Aşağıdaki bloğu yeni sohbetin ilk mesajı olarak yapıştır.

```
QR to 2FA tarayıcı eklentisi üzerinde çalış.
Workspace: C:\Users\Xmr\Desktop\dev\qrTo2fa — yalnızca bu repo.
Önce firstPrompt.md, README.md, PRIVACY.md ve STORE.md oku.
Yeni bilgisayarsa: bun install, sonra bun run typecheck ve bun run build.
Özellik ekleme; eklenti bilerek minimal. Arayüz metni Türkçe.
Commit/push yalnız istenince; Conventional Commits.
```

## Amaç

İnsanlar 2FA QR'ını okutmak için AI sohbetlerine veya çevrimiçi QR okuyuculara yüklüyor; QR'daki kalıcı anahtar böylece başka sunuculara gidiyor. Bu eklenti QR'ı tarayıcının içinde, ağ isteği olmadan çözer ve anahtarı kopyalatır. Ticari değil, ücretsiz.

## Kapsam kuralları (bozma)

- **Tek arayüz:** yan panel (Chrome `side_panel`, Firefox `sidebar_action`). Popup yok, sayfa içi sonuç kutusu yok, klavye kısayolu yok. Sayfada yalnız seçim katmanı görünür.
- Panel: boş "okunan kod" alanı + **QR tara** butonu. Tarama sırasında buton **İptal** olur. Sonuç veya yönlendirme aynı alanda.
- Her sorun durumu kullanıcıyı adım adım yönlendirir (`src/panel/guidance.ts`).
- İzinler yalnız `activeTab`, `scripting`, `clipboardWrite` (+ Chrome `sidePanel`). Host izni, `<all_urls>`, `tabs`, `storage` ekleme.
- Ağ isteği yok, depolama yok, analiz yok, uzaktan kod yok. Ekran görüntüsü yalnız bellekte.
- Bunlardan biri değişirse `PRIVACY.md` ve `STORE.md` (izin gerekçeleri) birlikte güncellenir.
- Gereksiz özellik (geçmiş, ayar, TOTP kodu üretme, senkron, çoklu dil) ekleme; istenirse önce gizlilik etkisini söyle.

## Stack

- Bun 1.4.3, TypeScript 7.0.2 (`tsc --noEmit`), `@types/chrome`, `@types/bun`
- Çalışma zamanı bağımlılığı yalnız `jsqr` 1.4.0 (paketlenir)
- Manifest V3, Chrome 116+, Firefox 142+ (`data_collection_permissions: none`, gecko id `qrto2fa@hiddenroad.github.io`)
- Build: `scripts/build.ts` → `dist/chrome`, `dist/firefox` (IIFE, minify). Manifest `scripts/manifest.ts`, ikonlar `scripts/icons.ts` (PNG kodla üretilir)

## Akış

1. Simge tıklanır → `src/background.ts` yan paneli açar (Chrome `sidePanel.open`, Firefox `sidebarAction.open`). Bu tıklama `activeTab` iznini verir.
2. Panel **QR tara** → `src/panel/scan.ts`: aktif sekmeye `content.js` enjekte, sonra `window.__qrTo2faSelect()` çağrılır (seçim promise'i).
3. `src/content/selection.ts` kapalı shadow DOM ve `popover="manual"` üst katmanında fare ile dikdörtgen seçtirir. Modal dialog açıksa katman dialogun içine eklenir; aksi halde dialog tıklamayı yutar. `Esc`, sağ tık veya paneldeki İptal (`__qrTo2faCancel`) iptal eder. Panel kapanınca `pagehide` aynı iptali çalıştırır.
4. Seçilen sekme hâlâ öndeyse panel `tabs.captureVisibleTab` çağırır → `src/lib/decode.ts` (X/Y ayrı ölçek, beyaz kenar, küçükse ×2/×3, büyükse uzun kenar 1200 px, önce `BarcodeDetector`, sonra `jsQR` ters renk dahil).
5. `src/lib/otpauth.ts` `otpauth://` ise servis/hesap/anahtar. `src/lib/migration.ts` `otpauth-migration://` ise hesap listesi. Biçimi bozuk `otpauth` ayrı not alır. Anahtar boşluksuz kopyalanır, ekranda 4'lü gruplu. Varsayılan olmayan algoritma/hane/süre ayrıca yazılır.

Hata kodları (`src/lib/types.ts`): `noTab`, `blocked` (adres `src/lib/page.ts` ile, mesaj metni yedek), `permission` (activeTab düştü → simgeye bir kez tıkla), `file` (`file://`), `interrupted` (sekme değişti veya sayfa kapandı), `capture`, `notFound`.

## Dosyalar

| Yol | İş |
|-----|-----|
| `src/background.ts` | Simge → yan panel |
| `src/panel/panel.html`, `panel.css`, `panel.ts` | Tek arayüz |
| `src/panel/scan.ts` | Enjekte, seçim, ekran görüntüsü, çözüm |
| `src/panel/view.ts` | Alan içerikleri (boş, bekliyor, sonuç, hata) |
| `src/panel/guidance.ts` | Türkçe yönlendirme metinleri |
| `src/content.ts`, `src/content/*` | Sayfadaki seçim katmanı |
| `src/lib/*` | `api` (`globalThis` üzerindeki browser veya chrome), `decode`, `otpauth`, `migration`, `page`, `clipboard`, `dom`, `types` |
| `scripts/pack.ts` | `bun run pack` → `dist/packages`: Chrome zip, Firefox zip, kaynak `tar.gz` |
| `PRIVACY.md` | Gizlilik politikası (TR + EN) |
| `STORE.md` | Mağaza açıklamaları, izin gerekçeleri, AMO inceleyici notu |

## Komutlar

```bash
bun install
bun run test
bun run typecheck
bun run build
bun run pack
bun run lint:ext
```

Geliştirici kurulumu: Chrome `chrome://extensions` → Paketlenmemiş → `dist/chrome`. Firefox `about:debugging#/runtime/this-firefox` → Geçici eklenti → `dist/firefox/manifest.json`.

## Durum (13 Kasım 2026)

Bitti:

- Yan panel akışı, üst katman seçimi, iptal bayrağı, sekme kontrolü, çözüm, kopyalama, hata yönlendirmeleri.
- `otpauth` bozuk etiketinde çökme yok; boş anahtar ayrı not. `otpauth-migration://` yerelde hesap listesine ayrılır.
- Kalıcı birim testleri: `bun test` (`otpauth`, `migration`, kırpma ölçeği, sayfa sınıfı).
- MIT lisansı ve jsQR Apache-2.0 metni pakete kopyalanır. Gecko kimliği `qrto2fa@hiddenroad.github.io`.
- `PRIVACY.md` ve `STORE.md` içinde depo adresi `https://github.com/hiddenroad/qrto2fa`.

Açık:

- Gerçek Chrome ve Firefox'ta kurulup denenmedi (simgeden panel, `activeTab` ile `captureVisibleTab`, dialog üstündeki seçim). Gömülü tarayıcı eklenti yükleyemez.
- GitHub deposu boş oluşturulacak; yerel commit push edilince gizlilik URL'si açılır. Form: ad `qrto2fa`, Public, README / .gitignore / lisans kapalı.
- Mağaza görselleri yok: 1280×800 ekran görüntüsü, Chrome 440×280 tanıtım görseli. Gerçek tarayıcıdan alınacak.
- Mağaza hesapları: Chrome Web Store (non-trader), Edge Partner Center, AMO.

## Test notu

Cursor'ın gömülü tarayıcısı eklenti yükleyemez ve iframe içine tıklama gönderemez. UI testi için geçici bir klasörde `chrome` API'sini taklit eden bir stub + QR'lı sayfa + panel iframe'i kuruldu; fare olayları `PointerEvent` ile gönderildi. Gerekirse aynı yöntemle yeniden kurulur, repoya eklenmez.
