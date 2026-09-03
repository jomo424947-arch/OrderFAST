import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: NextRequest) {
  try {
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

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

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
