import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { profiles } from '../../db/schema.js';
import { AppError } from '../../shared/errors/index.js';

const AKEDLY_BASE = 'https://api.akedly.io/api/v1.2';

// In-memory map to track pending transactionReqID by normalized phone
const pendingTransactions = new Map<string, string>();

function getAkedlyCredentials() {
  const apiKey = process.env.AKEDLY_API_KEY;
  const pipelineId = process.env.AKEDLY_PIPELINE_ID;
  const isConfigured = Boolean(
    apiKey &&
    pipelineId &&
    apiKey !== 'your-akedly-api-key' &&
    pipelineId !== 'your-akedly-pipeline-id'
  );
  return { apiKey, pipelineId, isConfigured };
}

/**
 * Normalizes an Egyptian phone number to E.164 format (+20...)
 * Accepts: 01012345678, +201012345678, 201012345678
 */
function normalizeEgyptianPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // If starts with 0, replace with +20
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+2${cleaned}`;
  }
  // If starts with 20 without +
  if (cleaned.startsWith('20') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  // If already +20
  if (cleaned.startsWith('+20') && cleaned.length === 13) {
    return cleaned;
  }

  throw AppError.badRequest('رقم الهاتف غير صالح. يرجى إدخال رقم مصري صحيح (11 رقم يبدأ بـ 01)');
}

/**
 * Validates that the phone is a valid Egyptian mobile number
 */
function validateEgyptianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^(0|\+?20)1[0-9]{9}$/.test(cleaned);
}

/**
 * Fetches challenge from Akedly and solves SHA-256 Proof-of-Work puzzle
 */
async function solvePoW(apiKey: string, pipelineId: string) {
  const chalRes = await fetch(
    `${AKEDLY_BASE}/transactions/challenge?APIKey=${apiKey}&pipelineID=${pipelineId}`
  );
  const chalData = await chalRes.json();

  if (!chalRes.ok || !chalData?.data) {
    console.error('[OTP] Failed to get challenge:', chalData);
    throw AppError.internal('فشل في بدء عملية التحقق مع مزود الخدمة');
  }

  const { challenge, difficulty, challengeToken } = chalData.data;
  const targetPrefix = '0'.repeat(difficulty || 3);
  let nonce = 0;

  while (true) {
    const hash = crypto.createHash('sha256').update(`${challenge}:${nonce}`).digest('hex');
    if (hash.startsWith(targetPrefix)) {
      break;
    }
    nonce++;
  }

  return {
    challengeToken,
    nonce,
  };
}

export class OtpService {
  /**
   * Get challenge from Akedly (optional client-side PoW)
   */
  async getChallenge() {
    const { apiKey, pipelineId, isConfigured } = getAkedlyCredentials();
    if (!isConfigured) return { challenge: 'dev_mock_challenge' };
    const chalRes = await fetch(
      `${AKEDLY_BASE}/transactions/challenge?APIKey=${apiKey}&pipelineID=${pipelineId}`
    );
    return chalRes.json();
  }

  /**
   * Step 1: Send OTP to the user's phone number via Akedly
   * Automatically solves PoW if not provided by client
   */
  async sendOtp(phone: string, clientPowSolution?: any, _turnstileToken?: string) {
    if (!validateEgyptianPhone(phone)) {
      throw AppError.badRequest('رقم الهاتف غير صالح. يرجى إدخال رقم مصري صحيح (11 رقم يبدأ بـ 01)');
    }

    const { apiKey, pipelineId, isConfigured } = getAkedlyCredentials();
    const normalizedPhone = normalizeEgyptianPhone(phone);

    // Development fallback when Akedly credentials are not configured
    if (!isConfigured) {
      console.log(`\n======================================================`);
      console.log(`🧪 [DEV OTP] Generated verification code for ${normalizedPhone}: 123456`);
      console.log(`(Configure AKEDLY_API_KEY and AKEDLY_PIPELINE_ID for live SMS)`);
      console.log(`======================================================\n`);
      return {
        success: true,
        message: 'تم إرسال كود التحقق بنجاح (كود تجريبي للتطوير: 123456)',
        transactionId: `mock_tx_${Date.now()}`,
      };
    }

    try {
      // 1. Solve Proof-of-Work challenge (or use client provided)
      const powSolution = clientPowSolution || (await solvePoW(apiKey!, pipelineId!));

      // 2. Dispatch OTP via Akedly v1.2 API
      const response = await fetch(`${AKEDLY_BASE}/transactions/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          APIKey: apiKey,
          pipelineID: pipelineId,
          verificationAddress: { phoneNumber: normalizedPhone },
          powSolution,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[OTP] Akedly send error:', data);
        const errorMsg = data?.error?.message || data?.message || data?.code || '';

        if (errorMsg.includes('rate') || errorMsg.includes('limit') || errorMsg.includes('cooldown')) {
          throw AppError.badRequest('تم إرسال كود مسبقاً. انتظر قليلاً قبل إعادة المحاولة.');
        }

        throw AppError.badRequest(data?.message || 'فشل في إرسال كود التحقق. حاول مرة أخرى.');
      }

      const transactionReqID = data.data?.transactionReqID || data.data?.transactionID;
      if (transactionReqID) {
        pendingTransactions.set(normalizedPhone, transactionReqID);
      }

      return {
        success: true,
        message: 'تم إرسال كود التحقق بنجاح',
        transactionReqID,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      console.error('[OTP] Unexpected error in sendOtp:', err);
      throw AppError.internal('فشل في إرسال كود التحقق. حاول مرة أخرى.');
    }
  }

  /**
   * Step 2: Verify the OTP code entered by the user
   * On success, update the user's phone and phoneVerified status in database
   */
  async verifyOtp(userId: string, phone: string, otp: string) {
    if (!validateEgyptianPhone(phone)) {
      throw AppError.badRequest('رقم الهاتف غير صالح');
    }

    if (!otp || otp.length < 4 || otp.length > 8) {
      throw AppError.badRequest('كود التحقق غير صالح');
    }

    const { apiKey, pipelineId, isConfigured } = getAkedlyCredentials();
    const normalizedPhone = normalizeEgyptianPhone(phone);

    // Development fallback
    if (!isConfigured) {
      if (otp !== '123456' && otp !== '000000') {
        throw AppError.badRequest('كود التحقق غير صحيح. كود التطوير التجريبي هو: 123456');
      }
    } else {
      const transactionReqID = pendingTransactions.get(normalizedPhone);

      const verifyBody: Record<string, any> = {
        APIKey: apiKey,
        pipelineID: pipelineId,
        otp,
      };

      if (transactionReqID) {
        verifyBody.transactionReqID = transactionReqID;
      } else {
        verifyBody.verificationAddress = { phoneNumber: normalizedPhone };
      }

      const response = await fetch(`${AKEDLY_BASE}/transactions/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyBody),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[OTP] Akedly verify error:', data);
        const errorMsg = data?.error?.message || data?.message || data?.code || '';

        if (
          errorMsg.includes('INVALID_OTP') ||
          errorMsg.includes('invalid') ||
          errorMsg.includes('incorrect') ||
          errorMsg.includes('wrong')
        ) {
          throw AppError.badRequest('كود التحقق غير صحيح. تأكد من الكود وحاول مرة أخرى.');
        }
        if (errorMsg.includes('expired') || errorMsg.includes('timeout')) {
          throw AppError.badRequest('كود التحقق منتهي الصلاحية. أعد إرسال كود جديد.');
        }
        if (errorMsg.includes('attempts') || errorMsg.includes('locked')) {
          throw AppError.badRequest('تم تجاوز عدد المحاولات المسموح. أعد إرسال كود جديد.');
        }

        throw AppError.badRequest(data?.message || 'فشل التحقق من الكود. حاول مرة أخرى.');
      }

      // Cleanup
      pendingTransactions.delete(normalizedPhone);
    }

    // Verification successful — update the user's profile
    const localPhone = phone.replace(/[\s\-\(\)]/g, '');
    const displayPhone = localPhone.startsWith('0') ? localPhone : `0${localPhone.replace(/^\+?20/, '')}`;

    const [updated] = await db
      .update(profiles)
      .set({
        phone: displayPhone,
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning();

    if (!updated) {
      throw AppError.notFound('الملف الشخصي غير موجود');
    }

    return {
      success: true,
      message: 'تم تأكيد رقم الهاتف بنجاح',
      phone: displayPhone,
      phoneVerified: true,
    };
  }

  /**
   * Check if a user's phone is already verified
   */
  async getPhoneStatus(userId: string) {
    const [profile] = await db
      .select({
        phone: profiles.phone,
        phoneVerified: profiles.phoneVerified,
        phoneVerifiedAt: profiles.phoneVerifiedAt,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      throw AppError.notFound('الملف الشخصي غير موجود');
    }

    return {
      phone: profile.phone,
      phoneVerified: profile.phoneVerified || false,
      phoneVerifiedAt: profile.phoneVerifiedAt,
    };
  }
}

export const otpService = new OtpService();
