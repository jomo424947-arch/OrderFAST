# دليل تفعيل تسجيل الدخول عبر Google وتأكيد البريد الإلكتروني في FastOrder

يشرح هذا الدليل الخطوات البسيطة المطلوبة لتفعيل **تسجيل الدخول باستخدام Google (Google OAuth)** و**تأكيد الحساب بالبريد الإلكتروني (Email Confirmation)** في منصة **FastOrder**.

---

## 1. إعداد Google Cloud Console

للحصول على معرف العميل والمفتاح السري (`Client ID` و `Client Secret`):

1. ادخل إلى [Google Cloud Console](https://console.cloud.google.com/).
2. أنشئ مشروعاً جديداً (أو اختر مشروعك الحالي): **FastOrder**.
3. من القائمة الجانبية، اذهب إلى **APIs & Services** ➡️ **OAuth consent screen**:
   - اختر نوع المستخدم: **External**.
   - املأ اسم التطبيق: `FastOrder`.
   - املأ بريد التواصل ودعم المستخدم.
   - احفظ وانتقل للخطوات التالية مع إبقاء النطاقات الافتراضية (`email`, `profile`, `openid`).
4. اذهب إلى **APIs & Services** ➡️ **Credentials**:
   - اضغط على **Create Credentials** ➡️ واختر **OAuth client ID**.
   - نوع التطبيق (Application type): **Web application**.
   - الاسم: `FastOrder Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - *(أضف أيضاً نطاق الإنتاج الخاص بك إذا كان متوفراً مثل https://orderfast.app)*
   - **Authorized redirect URIs**:
     - ضع رابط الـ Callback الخاص بمشروعك في Supabase بالشكل التالي:
       ```
       https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback
       ```
       *(يمكنك نسخ هذا الرابط مباشرة من لوحة تحكم Supabase في الخطوة التالية).*
5. اضغط **Create**، وانسخ كل من:
   - **Client ID**
   - **Client Secret**

---

## 2. تفعيل Google Provider في Supabase

1. افتح لوحة تحكم [Supabase Dashboard](https://supabase.com/dashboard).
2. اختر مشروع FastOrder الخاص بك.
3. من القائمة الجانبية، اذهب إلى **Authentication** ➡️ **Providers**.
4. ابحث عن **Google** واضغط عليها:
   - فعّل خيار **Enable Sign in with Google**.
   - الصق **Client ID** الذي نسخته من Google Cloud.
   - الصق **Client Secret** الذي نسخته من Google Cloud.
   - *(ستجد في نفس الصفحة رابط Callback URL الذي تم وضعه في الخطوة 1 للتأكد من مطابقته).*
5. اضغط **Save**.

---

## 3. ضبط روابط التوجيه (Redirect URLs) في Supabase

1. من القائمة الجانبية في Supabase، اذهب إلى **Authentication** ➡️ **URL Configuration**.
2. في حقل **Site URL**:
   - ضع: `http://localhost:3000` *(أو نطاق موقعك في الإنتاج)*.
3. في قائمة **Redirect URLs**، اضغط **Add URL** وأضف:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`
   - *(وعند الرفع للإنتاج، أضف رابط الموقع مثل `https://yourdomain.com/auth/callback`)*.
4. اضغط **Save**.

---

## 4. تفعيل تأكيد البريد الإلكتروني (Email Confirmation)

للتأكد من إرسال رسائل التفعيل لجميع الحسابات الجديدة:

1. في Supabase Dashboard، اذهب إلى **Authentication** ➡️ **Providers** ➡️ **Email**.
2. تأكد من تفعيل خيار **Confirm email**.
3. (اختياري) يمكنك تخصيص قالب الرسالة من:
   - **Authentication** ➡️ **Email Templates** ➡️ **Confirm signup**.
   - يمكنك استخدام القالب الجاهز والجميل الموجود في المشروع داخل:
     `docs/supabase-templates/confirm-signup.html`.

---

## 5. تجربة المنظومة في التطبيق

1. **الموافقة الإلزامية على الشروط:**
   - افتح صفحة الدخول `http://localhost:3000/auth/login` أو التسجيل `http://localhost:3000/auth/register`.
   - جرب الضغط على "المتابعة باستخدام Google" دون تفعيل مربع الشروط ⬅️ سيظهر تنبيه أحمر يمنع المتابعة ويسلط الضوء على مربع الشروط.
   - حدد المربع واضغط الزر ⬅️ ستفتح نافذة Google فوراً.
2. **العودة واختيار الكلية (لأول مرة):**
   - بعد الموافقة في Google، ستعود إلى صفحة `/auth/callback`.
   - ستظهر نافذة أنيقة تسألك عن كليتك (الخيار ب).
   - بمجرد اختيار الكلية، يتم حفظ بيانات الطالب في PostgreSQL وتحويلك فوراً لصفحة الطالب الرئيسية `/student`.
3. **تأكيد البريد الإلكتروني:**
   - عند إنشاء حساب بالبريد وكلمة المرور، تظهر شاشة التأكيد مع زر **"إعادة إرسال الرابط"** بمؤقت 60 ثانية.
   - وعند محاولة تسجيل الدخول ببريد لم يتم تفعيله، يظهر خيار إعادة إرسال الرابط مباشرة.
