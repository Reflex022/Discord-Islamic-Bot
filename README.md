# 🕌 Discord Islamic Bot | بوت إسلامي للديسكورد

بوت ديسكورد متكامل يوفر القرآن الكريم، الأذكار، والأدعية لسيرفرك.

A complete Discord bot providing Quran, Azkar, and Duas for your server.

---

## المميزات | Features

### 📖 القرآن الكريم | Quran
- عرض صفحات المصحف (1-604)
- إذاعة مباشرة من القاهرة والسعودية
- تلاوات كاملة بصوت الشيخ أحمد الحواشي

Display Mushaf pages (1-604)  
Live radio from Cairo & Saudi Arabia  
Full recitations by Sheikh Ahmed Al-Hawashi

### 📿 الأذكار | Azkar
- أكثر من 3500 ذكر

Over 3500 Azkar  

### 🤲 الأدعية | Duas
- أكثر من 3500 دعاء

Over 3500 Duas 

---

## التثبيت | Installation

### المتطلبات | Requirements
- **Node.js 16.0.0+**
- **Discord Bot Token** من | from [Discord Developer Portal](https://discord.com/developers/applications)

### الخطوات | Steps

**1. تحميل المشروع | Download**
```bash
git clone <repository-url>
cd Islamic-Bot
npm install
```

**2. إعداد البيئة | Setup**

انسخ `.env.example` إلى `.env` وأضف التوكن:  
Copy `.env.example` to `.env` and add your token:

```env
DISCORD_BOT_TOKEN=your_token_here
DISCORD_CLIENT_ID=your_client_id_here
```

**3. تشغيل البوت | Start**
```bash
npm start
```
أو | or
```bash
node index.js
```

---

## الأوامر | Commands

| الأمر | Command | الوصف | Description |
|------|---------|-------|-------------|
| `/صفحة_قرآن` | - | عرض صفحة من القرآن | Display Quran page |
| `/تشغيل_قران` | - | تشغيل القرآن | Play Quran |
| `/اذكار` | - | بدء الأذكار | Start Azkar |
| `/دعاء` | - | بدء الأدعية | Start Duas |
| `/توقف` | - | إيقاف القرآن | Stop Quran |
| `/توقف_الاذكار` | - | إيقاف الأذكار | Stop Azkar |
| `/توقف_الدعاء` | - | إيقاف الأدعية | Stop Duas |

---

## ملاحظات | Notes

### صور القرآن | Quran Images
صور القرآن مستضافة على **Cloudinary** ومتاحة للجميع. لا تحتاج لرفعها بنفسك.

Quran images are hosted on **Cloudinary** and available for everyone. No need to upload them yourself.

**الرابط المستخدم | Used URL:**
```
https://res.cloudinary.com/waleed022/image/upload/quran_pages/001.png
```

**مثال | Example:**
```
https://res.cloudinary.com/waleed022/image/upload/quran_pages/001.png
https://res.cloudinary.com/waleed022/image/upload/quran_pages/604.png
```

### الصلاحيات المطلوبة | Required Permissions
- **Administrator**
- **Connect & Speak**
- **Send Messages**

---

## 🙏 شكر وتقدير | Credits & Acknowledgments

- **Islamic-Api** by [itsSamBz](https://github.com/itsSamBz/Islamic-Api) لبيانات سور القرآن، الأحاديث، والأذكار | for Quran Surahs data, Hadiths, and Azkar

---

## 💝 كلمة أخيرة | Final Note

هذا المشروع صدقة جارية، نسأل الله أن يتقبله ويجعله في ميزان حسناتنا.

This project is an ongoing charity (Sadaqah Jariyah). May Allah accept it and place it in our scale of good deeds.

**نتمنى من كل من يستخدم هذا المشروع أو يستفيد منه أن يدعو لجميع المسلمين الأحياء والأموات.**

**We hope that everyone who uses or benefits from this project will pray for all Muslims, the living and the deceased.**

**جزاكم الله خيراً | JazakAllahu Khairan** 🌟
