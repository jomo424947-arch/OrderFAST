import { z } from 'zod';

// ==========================================
// 1. Common / Primitive Schemas
// ==========================================

export const uuidSchema = z.string().uuid({ message: 'معرف UUID غير صالح' });

export const egpPiastersSchema = z
  .number()
  .int({ message: 'السعر يجب أن يكون رقماً صحيحاً بالقروش' })
  .positive({ message: 'السعر يجب أن يكون أكبر من الصفر' });

// ==========================================
// 2. Auth & Profiles Schemas
// ==========================================

export const registerStudentSchema = z.object({
  email: z.string().email({ message: 'بريد إلكتروني غير صالح' }),
  password: z.string().min(6, { message: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' }),
  fullName: z.string().min(2, { message: 'الاسم بالكامل مطلوب' }),
  phone: z.string().optional(),
  universityId: z.string().min(3, { message: 'الرقم الجامعي مطلوب' }),
  college: z.string().min(2, { message: 'اسم الكلية مطلوب' }),
});

export const registerStaffSchema = z.object({
  email: z.string().email({ message: 'بريد إلكتروني غير صالح' }),
  password: z.string().min(6, { message: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' }),
  fullName: z.string().min(2, { message: 'الاسم بالكامل مطلوب' }),
  phone: z.string().optional(),
  kioskId: uuidSchema.optional(),
  role: z.enum(['owner', 'cashier']).default('cashier'),
});

export const assignKioskStaffSchema = z.object({
  userId: uuidSchema,
  role: z.enum(['owner', 'cashier']).default('cashier'),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'بريد إلكتروني غير صالح' }),
  password: z.string().min(1, { message: 'كلمة المرور مطلوبة' }),
});

export const updateStudentStatusSchema = z.object({
  accountStatus: z.enum(['active', 'warning', 'restricted'], {
    required_error: 'حالة الحساب مطلوبة',
  }),
});

// ==========================================
// 3. Kiosk & Catalog Schemas
// ==========================================

export const updateKioskStatusSchema = z.object({
  isOpen: z.boolean({ required_error: 'حالة الفتح/الإغلاق مطلوبة' }),
  isRushMode: z.boolean().optional(),
});

export const updateKioskSettingsSchema = z.object({
  openingHours: z.string().min(2).optional(),
  defaultPrepTimeMins: z.number().int().min(1).max(120).optional(),
  acceptanceTimeoutSecs: z.number().int().min(60).max(1800).optional(),
  phone: z.string().optional(),
  acceptsOnlineOrders: z.boolean().optional(),
  imageUrl: z.string().optional().nullable(),
});

export const createMenuCategorySchema = z.object({
  kioskId: uuidSchema,
  name: z.string().min(2, { message: 'اسم التصنيف مطلوب' }),
  displayOrder: z.number().int().default(0),
});

export const comboItemSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
});

export const createMenuItemSchema = z.object({
  kioskId: uuidSchema,
  categoryId: uuidSchema,
  name: z.string().min(2, { message: 'اسم الصنف مطلوب' }),
  description: z.string().optional(),
  price: egpPiastersSchema, // in piasters (e.g. 2000 for 20 EGP)
  originalPrice: egpPiastersSchema.nullable().optional(),
  offerTag: z.string().max(50).nullable().optional(),
  isCombo: z.boolean().optional(),
  comboItems: z.array(comboItemSchema).nullable().optional(),
  preparationTimeMins: z.number().int().min(1).max(60).default(5),
  imageUrl: z.string().url().optional(),
});

export const updateMenuItemSchema = z.object({
  name: z.string().min(2).optional(),
  categoryId: uuidSchema.optional(),
  description: z.string().optional(),
  price: egpPiastersSchema.optional(),
  originalPrice: egpPiastersSchema.nullable().optional(),
  offerTag: z.string().max(50).nullable().optional(),
  isCombo: z.boolean().optional(),
  comboItems: z.array(comboItemSchema).nullable().optional(),
  preparationTimeMins: z.number().int().min(1).max(60).optional(),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().optional(),
});

export const toggleItemAvailabilitySchema = z.object({
  isAvailable: z.boolean({ required_error: 'حالة التوفر مطلوبة' }),
});

// ==========================================
// 4. Order Operations Schemas
// ==========================================

export const orderItemInputSchema = z.object({
  menuItemId: uuidSchema,
  quantity: z.number().int().min(1, { message: 'الكمية يجب أن تكون 1 على الأقل' }).max(50),
  specialInstructions: z.string().max(200).optional(),
});

export const createOrderSchema = z.object({
  kioskId: uuidSchema,
  items: z
    .array(orderItemInputSchema)
    .min(1, { message: 'يجب اختيار صنف واحد على الأقل' }),
  paymentMethod: z.enum(['cash', 'digital_wallet']).default('cash'),
});

export const acceptOrderSchema = z.object({
  customPrepTimeMins: z
    .number()
    .int()
    .min(1, { message: 'وقت التحضير يجب أن يكون دقيقة واحدة على الأقل' })
    .max(120)
    .optional(),
});

export const rejectOrderSchema = z.object({
  reason: z.string().min(3, { message: 'يرجى كتابة أو اختيار سبب الرفض' }),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(3, { message: 'يرجى كتابة سبب الإلغاء' }).optional(),
});

export const updateEstimatedTimeSchema = z.object({
  additionalMinutes: z
    .number()
    .int()
    .min(1)
    .max(60, { message: 'الوقت الإضافي لا يتجاوز 60 دقيقة' }),
  reason: z.string().optional(),
});

export const batchActionSchema = z.object({
  orderIds: z
    .array(uuidSchema)
    .min(1, { message: 'يرجى تحديد أوردر واحد على الأقل' })
    .max(50, { message: 'الحد الأقصى للعمليات المجمعة 50 أوردر' }),
});

export const batchRejectSchema = z.object({
  orderIds: z.array(uuidSchema).min(1).max(50),
  reason: z.string().min(3, { message: 'سبب الرفض المجمع مطلوب' }),
});

// ==========================================
// 5. Inferred TypeScript Types from Zod
// ==========================================

export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
export type RegisterStaffInput = z.infer<typeof registerStaffSchema>;
export type AssignKioskStaffInput = z.infer<typeof assignKioskStaffSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AcceptOrderInput = z.infer<typeof acceptOrderSchema>;
export type RejectOrderInput = z.infer<typeof rejectOrderSchema>;
export type BatchActionInput = z.infer<typeof batchActionSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
