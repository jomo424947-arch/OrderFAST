import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Magic byte signatures for allowed image types
const IMAGE_MAGIC_BYTES: Record<string, number[][]> = {
  png: [[0x89, 0x50, 0x4e, 0x47]],
  jpg: [[0xff, 0xd8, 0xff]],
  jpeg: [[0xff, 0xd8, 0xff]],
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF header
};

function validateImageMagicBytes(buffer: Buffer, ext: string): boolean {
  const signatures = IMAGE_MAGIC_BYTES[ext];
  if (!signatures) return false;
  return signatures.some((sig) =>
    sig.every((byte, i) => buffer.length > i && buffer[i] === byte)
  );
}

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

    // Verify User Role (Active students, staff, and admins can upload)
    if (!profile.system_role) {
      return NextResponse.json(
        { success: false, error: 'نوع الحساب غير محدد' },
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

    // Reject SVG files explicitly (prevents Stored XSS via embedded JavaScript)
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      return NextResponse.json(
        { success: false, error: 'ملفات SVG غير مسموح بها لأسباب أمنية. يرجى استخدام PNG أو JPG أو WebP' },
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

    // Validate image magic bytes to prevent type spoofing
    if (!validateImageMagicBytes(buffer, ext)) {
      return NextResponse.json(
        { success: false, error: 'محتوى الملف لا يتطابق مع نوع الصورة المتوقع. يرجى رفع صورة صالحة' },
        { status: 400 }
      );
    }

    const prefix = profile.system_role === 'student' ? 'receipt' : 'kiosk';
    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('kiosk-images')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'فشل رفع الصورة إلى السحابة' },
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
    // Sanitized error response — never leak internal error details to clients
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء رفع الصورة' },
      { status: 500 }
    );
  }
}
