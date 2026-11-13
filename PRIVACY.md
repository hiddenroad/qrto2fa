# QR to 2FA — Gizlilik Politikası / Privacy Policy

Yürürlük / Effective: 13 Kasım 2026 / November 13, 2026

## Türkçe

QR to 2FA ticari olmayan, tek amaçlı bir tarayıcı eklentisidir: ekranda seçtiğin QR kodu okur ve içeriğini (2FA kurulum anahtarı dahil) eklentinin yan panelinde gösterir.

**Toplanan veri: yok.** Eklenti hiçbir kişisel veriyi toplamaz, saklamaz, satmaz veya paylaşmaz. Ağ isteği yapmaz; analiz, reklam veya takip kodu içermez. Hesap veya kayıt gerektirmez.

**Cihazda işlenen veri.** Yalnız sen **QR tara** butonuna basıp bir alan seçtiğinde:

- O anda görünen sekmenin ekran görüntüsü alınır, seçtiğin alan kırpılır ve QR kod tarayıcının içinde çözülür. Chromium'da tarayıcının yerleşik barkod okuyucusu varsa önce o denenir; sonuç yoksa eklentinin içindeki `jsQR` kullanılır. İkisi de cihazda çalışır.
- Ekran görüntüsü yalnız bellekte tutulur ve çözümden hemen sonra atılır. Diske yazılmaz.
- Çözülen içerik (`otpauth://` anahtarı veya bir Google Authenticator dışa aktarma kodundaki hesaplar) yalnız eklentinin kendi panelinde gösterilir. Panel kapanınca veya yeni tarama yapılınca silinir. Tarayıcı depolamasına kaydedilmez.
- Pano: içerik yalnız sen **Kopyala** butonuna bastığında panoya yazılır.

**İzinler.**

- `activeTab`: yalnız eklenti simgesine tıkladığın sekmeye, o sekme kapanana veya başka adrese gidene kadar geçici erişim. Başka sekmeye geçince yeniden tıklamak gerekir. Başka sitelere kalıcı erişim yok.
- `scripting`: o sekmede alan seçimi için gereken katmanı göstermek.
- `clipboardWrite`: Kopyala butonu.
- `sidePanel` (yalnız Chrome): sonucu gösteren yan panel.

**Üçüncü taraflar.** Veri hiçbir üçüncü tarafa gönderilmez. QR çözme kütüphanesi (`jsQR`, Apache-2.0) eklentinin içinde paketlenmiştir, dışarıdan kod yüklenmez. Yerleşik barkod okuyucusu da tarayıcının parçasıdır ve görüntüyü dışarı göndermez.

**Değişiklikler.** Bu politika değişirse güncel metin bu sayfada yayımlanır ve yürürlük tarihi güncellenir.

**İletişim.** https://github.com/hiddenroad/qrto2fa/issues

## English

QR to 2FA is a non-commercial, single-purpose browser extension: it reads a QR code you select on screen and shows its content (including a 2FA setup key) in the extension's side panel.

**Data collected: none.** The extension does not collect, store, sell or share any personal data. It makes no network requests and contains no analytics, advertising or tracking code. No account is required.

**Data processed on your device.** Only when you press **QR tara** (Scan QR) and select an area:

- A screenshot of the currently visible tab is taken, cropped to your selection, and the QR code is decoded inside the browser. On Chromium the browser's built-in barcode detector is tried first; if it finds nothing, the bundled `jsQR` library is used. Both run on the device.
- The screenshot is kept in memory only and discarded right after decoding. It is never written to disk.
- The decoded content (an `otpauth://` secret, or the accounts inside a Google Authenticator export code) is shown only in the extension's own panel. It is cleared when the panel closes or a new scan starts, and is never saved to browser storage.
- Clipboard: content is written to the clipboard only when you press a **Copy** button.

**Permissions.**

- `activeTab`: temporary access only to the tab where you clicked the extension icon, until that tab is closed or navigates. Switching tabs requires another click. No standing access to other sites.
- `scripting`: shows the selection overlay in that tab.
- `clipboardWrite`: the Copy button.
- `sidePanel` (Chrome only): the side panel that shows the result.

**Third parties.** No data is sent to any third party. The QR decoding library (`jsQR`, Apache-2.0) is bundled inside the extension; no remote code is loaded. The built-in barcode detector is part of the browser and does not send the image anywhere.

**Changes.** If this policy changes, the updated text is published on this page with a new effective date.

**Contact.** https://github.com/hiddenroad/qrto2fa/issues
