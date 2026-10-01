# Minik Bahçe Diyarı

Firebase destekli, çok oyunculu tarayıcı bahçe oyunu. Kayıt, bulut kayıt, oyuncu pazarı ve sıralama var.

## Kurulum
1. https://console.firebase.google.com adresinde yeni proje oluştur.
2. **Authentication > Sign-in method**: E-posta/Şifre'yi etkinleştir.
3. **Firestore Database**: veritabanı oluştur, ardından **Rules** sekmesine `firestore.rules` içeriğini yapıştırıp yayınla.
4. **Proje ayarları > Web uygulaması ekle**: çıkan config değerlerini `firebase-config.js` dosyasına yapıştır.
5. Yerelde dene: `npx serve` (ES modülleri için `file://` ile açılmaz).

## GitHub Pages
1. Klasörü yeni bir GitHub deposuna yükle.
2. **Settings > Pages**: Branch `main`, klasör `/ (root)`.
3. Firebase **Authentication > Settings > Authorized domains** listesine `kullaniciadi.github.io` ekle. Eklemezsen giriş çalışmaz.

## Bilinen sınırlar
- Oyun mantığı istemcide çalışır. Kurallar başkasının verisini korur ama kendi verisini değiştiren hileciyi engellemez. Gerçek koruma için Cloud Functions gerekir.
- Takma adlar benzersiz değil.
- Yok: lonca, sohbet, başka bahçeyi ziyaret, siparişler, dekorasyon.
