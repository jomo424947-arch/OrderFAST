import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Authentication Token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بالوصول - يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'رمز الدخول غير صالح' },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify token with Supabase Auth
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userData?.user) {
      return NextResponse.json(
        { success: false, error: 'جلسة تسجيل الدخول منتهية أو غير صالحة' },
        { status: 401 }
      );
    }

    // Verify User Role (Must be staff or admin to upload kiosk/menu images)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('system_role, is_active')
      .eq('id', userData.user.id)
      .single();

    if (profileError || !profile || !profile.is_active) {
      return NextResponse.json(
        { success: false, error: 'الحساب غير موجود أو تم تعطيله' },
        { status: 403 }
      );
    }

    if (profile.system_role !== 'admin' && profile.system_role !== 'staff') {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية رفع الصور (تتطلب حساب موظف أو مشرف)' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'لم يتم اختيار أي ملف للرفع' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'الملف المختار يجب أن يكون صورة صالحة (PNG, JPG, WebP)' },
        { status: 400 }
      );
    }

    // Max 5MB file size
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const ext = ['png', 'jpg', 'jpeg', 'webp'].includes(rawExt) ? rawExt : 'jpg';
    const fileName = `kiosk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('kiosk-images')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: uploadError.message || 'فشل رفع الصورة إلى السحابة' },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('kiosk-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
    });
  } catch (err: any) {
    console.error('Upload handler exception:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'حدث خطأ أثناء رفع الصورة' },
      { status: 500 }
    );
  }
}
