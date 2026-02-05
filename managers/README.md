 مديرو الموارد - Resource Managers

هذا المجلد يحتوي على جميع المديرين المسؤولين عن إدارة موارد Discord Bot الإسلامي.

## البنية

```
managers/
├── DataManager.js          # مدير البيانات - تحميل وإدارة ملفات JSON
├── IntervalManager.js      # مدير الفواصل - تتبع وإدارة setInterval instances
├── MemoryManager.js        # مدير الذاكرة - تنظيف البيانات القديمة وإدارة الذاكرة
├── ConnectionPool.js       # مجمع الاتصالات - إدارة الاتصالات الصوتية
├── MonitoringManager.js    # مدير المراقبة - تتبع وتسجيل استخدام الموارد
├── CacheManager.js         # مدير التخزين المؤقت - إدارة cache للبيانات
├── ResourceManager.js      # مدير الموارد الرئيسي - تنسيق جميع المديرين
└── index.js               # نقطة دخول موحدة
```

## المديرون

### 1. DataManager (مدير البيانات)

**المسؤولية**: تحميل وإدارة ملفات JSON (azkar.json و dua.json)

**الوظائف الرئيسية**:
- `loadAllData()` - تحميل جميع البيانات عند بدء التشغيل
- `loadAzkar()` - تحميل ملف الأذكار
- `loadDuas()` - تحميل ملف الأدعية
- `getRandomAzkar()` - الحصول على ذكر عشوائي
- `getRandomDua()` - الحصول على دعاء عشوائي

**المتطلبات المعالجة**: 1.1, 1.2, 1.3, 1.4, 1.5

### 2. IntervalManager (مدير الفواصل)

**المسؤولية**: تتبع وإدارة جميع setInterval instances

**الوظائف الرئيسية**:
- `register(name, callback, delay)` - تسجيل فاصل زمني جديد
- `clear(id)` - إيقاف فاصل محدد
- `clearAll()` - إيقاف جميع الفواصل
- `getActiveCount()` - الحصول على عدد الفواصل النشطة
- `getActiveIntervals()` - الحصول على قائمة الفواصل النشطة

**المتطلبات المعالجة**: 2.1, 2.2, 2.3, 2.4, 2.5

### 3. MemoryManager (مدير الذاكرة)

**المسؤولية**: تنظيف البيانات القديمة وإدارة الذاكرة

**الوظائف الرئيسية**:
- `startCleanup()` - بدء التنظيف الدوري
- `cleanupOldData()` - تنظيف الطوابع الزمنية القديمة
- `forceGC()` - تشغيل garbage collection يدوياً
- `getMemoryUsage()` - الحصول على إحصائيات الذاكرة

**المتطلبات المعالجة**: 4.1, 4.2, 4.3, 4.4, 9.4, 10.3

### 4. ConnectionPool (مجمع الاتصالات)

**المسؤولية**: إدارة وإعادة استخدام الاتصالات الصوتية

**الوظائف الرئيسية**:
- `getConnection(guildId, channelId, adapterCreator)` - الحصول على اتصال
- `createConnection(guildId, channelId, adapterCreator)` - إنشاء اتصال جديد
- `removeConnection(guildId)` - إزالة اتصال
- `cleanupInactive()` - تنظيف الاتصالات غير النشطة
- `closeAll()` - إغلاق جميع الاتصالات
- `getActiveCount()` - الحصول على عدد الاتصالات النشطة

**المتطلبات المعالجة**: 7.1, 7.2, 7.3, 7.4, 7.5

### 5. MonitoringManager (مدير المراقبة)

**المسؤولية**: تتبع وتسجيل استخدام الموارد

**الوظائف الرئيسية**:
- `startMonitoring()` - بدء المراقبة الدورية
- `logStats()` - تسجيل الإحصائيات
- `getCurrentStats()` - الحصول على الإحصائيات الحالية

**المتطلبات المعالجة**: 9.1, 9.2, 9.3, 9.4, 9.5, 10.3, 10.4, 10.5

### 6. CacheManager (مدير التخزين المؤقت)

**المسؤولية**: إدارة cache للبيانات المستخدمة بكثرة

**الوظائف الرئيسية**:
- `get(key)` - الحصول على بيانات من cache
- `set(key, data)` - تخزين بيانات في cache
- `delete(key)` - حذف عنصر من cache
- `clear()` - مسح جميع البيانات
- `cleanup()` - تنظيف العناصر منتهية الصلاحية
- `evictLRU()` - إزالة العنصر الأقدم استخداماً

**المتطلبات المعالجة**: 8.1, 8.2, 8.3, 8.4, 8.5

### 7. ResourceManager (مدير الموارد الرئيسي)

**المسؤولية**: تنسيق جميع المديرين الفرعيين

**الوظائف الرئيسية**:
- `initialize()` - تهيئة جميع المديرين
- `checkGuildLimit()` - فحص حد السيرفرات
- `handleGuildJoin(guild)` - معالجة انضمام سيرفر جديد
- `shutdown()` - إغلاق نظيف

**المتطلبات المعالجة**: جميع المتطلبات

## الاستخدام

```javascript
const { ResourceManager } = require('./managers');

// في index.js
const client = new Client({ /* ... */ });
const resourceManager = new ResourceManager(client);

// عند بدء التشغيل
await resourceManager.initialize();

// عند الإغلاق
process.on('SIGINT', () => resourceManager.shutdown());
process.on('SIGTERM', () => resourceManager.shutdown());
```

## الاختبارات

جميع المديرين لديهم اختبارات شاملة في مجلد `__tests__/managers/`:

```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل الاختبارات مع المراقبة
npm run test:watch

# تشغيل الاختبارات مع تغطية الكود
npm run test:coverage
```

## معايير الجودة

- ✅ تغطية كود 80%+
- ✅ اختبارات وحدة لكل دالة عامة
- ✅ اختبارات خصائص للسلوكيات العامة
- ✅ معالجة شاملة للأخطاء
- ✅ توثيق JSDoc لجميع الدوال

## المساهمة

عند إضافة مدير جديد:
1. إنشاء ملف في `managers/`
2. إضافة JSDoc comments
3. تصدير المدير في `index.js`
4. كتابة اختبارات في `__tests__/managers/`
5. تحديث هذا README
