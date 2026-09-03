import { Notification } from "@/types";

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-01",
    userId: "std-001",
    userRole: "student",
    title: "أوردرك في مرحلة التجهيز ☕",
    body: "كشك الحرية قبل أوردرك رقم #0247 وبدأ بالتجهيز. الوقت المتوقع: 15 دقيقة.",
    type: "order_status",
    orderId: "ord-0247",
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
  },
  {
    id: "notif-02",
    userId: "std-001",
    userRole: "student",
    title: "تم استلام أوردرك السابق بنجاح",
    body: "شكراً لطلبك من كافيه الحاسبات (#0240). نتمنى لك يوماً دراسياً موفقاً!",
    type: "order_status",
    orderId: "ord-0240",
    isRead: true,
    createdAt: new Date(Date.now() - 23 * 3600000).toISOString(),
  },
  {
    id: "notif-03",
    userId: "cashier-01",
    userRole: "cashier",
    title: "أوردر جديد وارد! 🔔",
    body: "أوردر جديد رقم #0250 من الطالبة مريم علي (كلية الصيدلة).",
    type: "order_status",
    orderId: "ord-0250",
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];
