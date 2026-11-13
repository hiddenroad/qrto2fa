import type { ScanError } from "../lib/types";

export type Guidance = { title: string; steps: string[] };

const CLICK_ICON = "Araç çubuğundaki QR to 2FA simgesine bir kez tıkla, sonra tekrar QR tara'ya bas.";

export const GUIDANCE: Record<ScanError, Guidance> = {
  noTab: {
    title: "Açık sekme bulunamadı",
    steps: ["QR'ın olduğu sayfayı aç.", "Tekrar QR tara'ya bas."],
  },
  blocked: {
    title: "Bu sayfa taranamıyor",
    steps: [
      "Tarayıcı ayar sayfaları, yeni sekme, PDF görüntüleyici ve eklenti mağazası güvenlik nedeniyle taranamaz.",
      "QR'ın olduğu siteye geç ve tekrar QR tara'ya bas.",
    ],
  },
  permission: {
    title: "Bu sekmeye erişim izni yok",
    steps: [
      "Eklenti yalnız simgesine tıkladığın sekmeyi görebilir. Başka sekmeye geçince veya sayfa yenilenince yeniden tıklamak gerekir.",
      CLICK_ICON,
    ],
  },
  file: {
    title: "Dosya sayfası taranamıyor",
    steps: [
      "file:// ile açılmış bir sayfa, site sayfasından daha kısıtlıdır.",
      "Chrome ve Edge'de eklenti ayrıntılarından “Dosya URL'lerine erişime izin ver” seçeneğini aç.",
      "Seçenek yoksa QR'ı normal bir site sekmesinde aç, simgeye tıkla ve tekrar tara.",
    ],
  },
  interrupted: {
    title: "Seçim yarıda kaldı",
    steps: [
      "Seçim sırasında sekme değişti, sayfa yenilendi veya kapandı.",
      "QR'ın olduğu sekme öndeyken tekrar QR tara'ya bas.",
    ],
  },
  capture: {
    title: "Ekran görüntüsü alınamadı",
    steps: ["QR'ın olduğu sekmenin önde ve görünür olduğundan emin ol.", CLICK_ICON],
  },
  notFound: {
    title: "QR okunamadı",
    steps: [
      "QR'ın tamamını, çevresindeki beyaz kenarla birlikte seç.",
      "QR küçükse sayfayı yakınlaştır (Ctrl ve +), sonra tekrar seç.",
      "QR bulanıksa veya süresi dolduysa sitede yeni QR oluştur.",
    ],
  },
};
