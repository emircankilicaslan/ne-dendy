# Ne Dendy? — Anket İçgörüleri Modülü

Dendy.ai'nin "Ne Dendy?" bileşeninin React tabanlı frontend implementasyonu.

---

## Kurulum & Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini açın.

> `data.csv` dosyası zaten `public/` klasöründe bulunmaktadır.

---

## Teknik Tercihler

| Seçim | Neden |
|---|---|
| **Vite + React** | Sıfır-config, hızlı geliştirme ortamı. CRA'ya kıyasla çok daha hızlı HMR. |
| **Papaparse** | CSV parse için endüstri standardı; type-safe, streaming destekli. |
| **Saf CSS-in-JS (inline styles)** | Harici UI kütüphanesi kurmadan tam kontrol. Tailwind CDN yok, bundle bloat yok. |
| **Tek dosya bileşen mimarisi** | Proje ölçeği için overkill olmadan okunabilir; gerçek üründe `components/` klasörüne taşınır. |
| **Google Fonts (Syne + DM Mono + Plus Jakarta Sans)** | Ürünün amacına uygun "data-tool" hissi veren tipografi. |

---

## Özellikler

- **Survey ID filtreleme** — Dropdown ile tek ankete veya tüm ankete geçiş
- **Aksiyon ve duygu filtreleri** — `watch`, `escalate`, `ignore` + `positive`/`negative`/`neutral`
- **İstatistik kartları** — Ortalama skor, toplam yanıt, izleme listesi, risk bayrağı sayısı
- **Duygu dağılımı çubuğu** — Olumlu / nötr / olumsuz yüzdeleri
- **Tema analizi** — Hangi temalar kaç kez geçiyor, ortalama skor renk kodlu
- **İçgörü feed'i** — `should_display: true` olan tüm etiketler; aksiyon rengine göre sol kenar çizgisi

---

## Yapılamadıklar (zaman kısıtlaması)

- Katılımcı bazlı drill-down (participant_id → tüm cevapları)
- Tarih bazlı filtreleme / trend grafiği
- CSV upload arayüzü (şu an `public/data.csv` hardcoded)
- Mobil responsive iyileştirmeler
- Skeleton loading animasyonları
- Dark/light tema toggle
- Tablo görünümü seçeneği
