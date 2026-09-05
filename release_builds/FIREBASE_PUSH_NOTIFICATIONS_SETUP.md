# دليل تفعيل الإشعارات الفورية (Firebase Push Notifications)

تم تجهيز وتضمين مكتبات الإشعارات الفورية (`@capacitor/push-notifications`) وإذن `POST_NOTIFICATIONS` في كود التطبيق بالفعل.

لتفعيل إرسال الإشعارات للطلاب عند تحديث حالة الطلب عبر Firebase Cloud Messaging (FCM):

---

### الخطوة 1: إنشاء مشروع على Firebase Console
1. ادخل على [Firebase Console](https://console.firebase.google.com/).
2. اضغط على **Add Project** وسمّه مثلاً: `FastOrder`.
3. اضغط على أيقونة **Android** لإضافة تطبيق أندرويد.
4. أدخل اسم الحزمة (Package name) بالضبط كما هو في تطبيقك:
   ```text
   com.fastorder.app
   ```
5. اضغط **Register App**.

---

### الخطوة 2: تحميل ملف `google-services.json`
1. حمّل ملف `google-services.json` من Firebase.
2. انسخ الملف وضعه في المسار التالي داخل المشروع:
   ```text
   apps/mobile/android/app/google-services.json
   ```

---

### الخطوة 3: إعادة بناء التطبيق
افتح PowerShell في المجلد الرئيسي وشغل السكريبت الآلي:
```powershell
.\scripts\build_mobile.ps1
```
سيقوم السكريبت تلقائياً بالتعرف على ملف `google-services.json` وربطه بمشروع الأندرويد وإخراج حزم الـ APK والـ AAB الموقعة والجاهزة فوراً!
