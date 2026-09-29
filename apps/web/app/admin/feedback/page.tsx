'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { supportService, AdminTicketsFilter } from '@/lib/services/supportService';
import { formatArabicTime } from '@/lib/formatters';
import type { SupportTicket, SupportTicketStats, SupportCategory, SupportTicketStatus } from '@orderfast/types';
import {
  MessageSquare,
  Search,
  Filter,
  Phone,
  ExternalLink,
  ShoppingBag,
  Store,
  CreditCard,
  AlertCircle,
  Lightbulb,
  HelpCircle,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  RefreshCw,
  Eye,
  ChevronLeft,
  X,
  FileText,
  Send,
  Building,
} from 'lucide-react';

const CATEGORY_META: Record<SupportCategory, { label: string; icon: React.ElementType; color: string }> = {
  order_issue: { label: 'مشكلة في طلب', icon: ShoppingBag, color: 'text-primary bg-primary-soft/50 border-primary/20' },
  kiosk_issue: { label: 'شكوى على كشك', icon: Store, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  payment_issue: { label: 'مشكلة دفع', icon: CreditCard, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  app_bug: { label: 'عطل في التطبيق', icon: AlertCircle, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  suggestion: { label: 'اقتراح تطوير', icon: Lightbulb, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  other: { label: 'استفسار أو أخرى', icon: HelpCircle, color: 'text-slate-700 bg-slate-50 border-slate-200' },
};

export default function AdminFeedbackPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<SupportTicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');

  // Selected Ticket for Details Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<SupportTicketStatus>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [adminReply, setAdminReply] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Image Zoom Modal
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const isGuestParam =
        userTypeFilter === 'guest' ? true : userTypeFilter === 'registered' ? false : undefined;

      const [ticketsRes, statsRes] = await Promise.all([
        supportService.getAdminTickets({
          status: statusFilter,
          category: categoryFilter,
          isGuest: isGuestParam,
          search: search.trim() || undefined,
          limit: 50,
        }),
        supportService.getAdminStats(),
      ]);

      setTickets(ticketsRes.tickets);
      setTotalCount(ticketsRes.total);
      setStats(statsRes);
    } catch {
      // Ignore background errors
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter, userTypeFilter, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleOpenDetails = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setUpdateStatus(ticket.status);
    setAdminNotes(ticket.adminNotes || '');
    setAdminReply(ticket.adminReply || '');
    setActionSuccessMessage(null);
  };

  const handleSaveTicketUpdate = async () => {
    if (!selectedTicket) return;
    try {
      setIsUpdating(true);
      const updated = await supportService.updateTicketStatus(selectedTicket.id, {
        status: updateStatus,
        adminNotes: adminNotes.trim(),
        adminReply: adminReply.trim(),
      });

      setSelectedTicket(updated);
      setActionSuccessMessage('تم تحديث بيانات التذكرة بنجاح');

      // Update in local list
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

      // Refresh stats
      const newStats = await supportService.getAdminStats();
      setStats(newStats);
    } catch {
      // Error handling
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to format clean Egyptian phone for WhatsApp URL
  const getWhatsAppUrl = (phone: string, ticketNumber: string, name: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = `2${clean}`;
    }
    const message = encodeURIComponent(
      `أهلاً بك يا ${name}، معك إدارة منصة OrderFAST بخصوص تذكرتك رقم ${ticketNumber}. كيف يمكننا مساعدتك؟`
    );
    return `https://wa.me/${clean}?text=${message}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-body font-bold text-primary-ink mb-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
            <span>لوحة خدمة العملاء والدعم</span>
          </div>
          <h1 className="font-display font-black text-2xl text-ink">
            الشكاوى والمقترحات
          </h1>
          <p className="font-body text-xs text-ink-soft">
            متابعة بلاغات الطلاب، مشاكل الأكشاك، والمقترحات والرد عليها فورياً
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTickets}
          isLoading={isLoading}
        >
          <RefreshCw className="w-3.5 h-3.5 ml-1.5" />
          <span>تحديث القائمة</span>
        </Button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total */}
        <Card className="p-4 border border-line">
          <p className="font-body text-xs text-ink-soft mb-1">إجمالي التذاكر</p>
          <p className="font-mono font-black text-2xl text-ink">
            {stats?.totalCount ?? totalCount}
          </p>
        </Card>

        {/* Pending */}
        <Card className="p-4 border border-line bg-amber-500/5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-body text-xs text-amber-800 font-semibold">بانتظار المراجعة</p>
            {(stats?.pendingCount || 0) > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <p className="font-mono font-black text-2xl text-amber-700">
            {stats?.pendingCount ?? 0}
          </p>
        </Card>

        {/* In Progress */}
        <Card className="p-4 border border-line bg-primary-soft/30">
          <p className="font-body text-xs text-primary-ink font-semibold mb-1">قيد المتابعة</p>
          <p className="font-mono font-black text-2xl text-primary">
            {stats?.inProgressCount ?? 0}
          </p>
        </Card>

        {/* Resolved */}
        <Card className="p-4 border border-line bg-emerald-500/5">
          <p className="font-body text-xs text-emerald-800 font-semibold mb-1">تم الحل بنجاح</p>
          <p className="font-mono font-black text-2xl text-emerald-700">
            {stats?.resolvedCount ?? 0}
          </p>
        </Card>
      </div>

      {/* Filters & Search Toolbar */}
      <Card className="p-4 border border-line space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم، الهاتف، أو كود التذكرة..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-canvas border border-line font-body text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Search className="w-4 h-4 text-ink-soft absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line font-body text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد المراجعة (جديدة)</option>
              <option value="in_progress">قيد المتابعة</option>
              <option value="resolved">تم الحل</option>
              <option value="closed">مغلقة</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line font-body text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">جميع التصنيفات</option>
              <option value="order_issue">مشاكل الطلبات</option>
              <option value="kiosk_issue">شكاوى الأكشاك</option>
              <option value="payment_issue">مشاكل الدفع والمحافظ</option>
              <option value="app_bug">أعطال التطبيق</option>
              <option value="suggestion">مقترحات التطوير</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          {/* Submitter Type Filter */}
          <div>
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line font-body text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">جميع المستخدمين</option>
              <option value="registered">طلاب مسجلين فقط</option>
              <option value="guest">زوار غير مسجلين</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tickets List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-ink-soft font-body text-sm bg-surface rounded-3xl border border-line">
            جاري تحميل التذاكر...
          </div>
        ) : tickets.length > 0 ? (
          tickets.map((ticket) => {
            const meta = CATEGORY_META[ticket.category] || CATEGORY_META.other;
            const CategoryIcon = meta.icon;

            return (
              <Card
                key={ticket.id}
                className="p-4 sm:p-5 border border-line hover:border-primary/40 transition-all space-y-3"
              >
                {/* Header Row: Submitter info, status pill, time */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-line/60">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-xs text-ink bg-canvas px-2.5 py-1 rounded-lg border border-line">
                      {ticket.ticketNumber}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-body font-bold border ${meta.color}`}
                    >
                      <CategoryIcon className="w-3 h-3" />
                      <span>{meta.label}</span>
                    </span>

                    <span
                      className={`text-[11px] font-body font-bold px-2.5 py-0.5 rounded-full ${
                        ticket.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ticket.status === 'in_progress'
                          ? 'bg-primary-soft text-primary-ink border border-primary/20'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {ticket.status === 'resolved'
                        ? 'تم الحل'
                        : ticket.status === 'in_progress'
                        ? 'قيد المتابعة'
                        : 'قيد المراجعة'}
                    </span>

                    <span
                      className={`text-[11px] font-body font-semibold px-2 py-0.5 rounded-md ${
                        ticket.isGuest
                          ? 'bg-canvas text-ink-soft border border-line'
                          : 'bg-accent-soft text-accent'
                      }`}
                    >
                      {ticket.isGuest ? 'زائر' : 'طالب مسجل'}
                    </span>
                  </div>

                  <span className="font-mono text-[11px] text-ink-soft whitespace-nowrap">
                    {formatArabicTime(ticket.createdAt)}
                  </span>
                </div>

                {/* Submitter Identity & Affiliation */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-body text-ink">
                  <div className="flex items-center gap-1.5 font-bold">
                    <User className="w-3.5 h-3.5 text-ink-soft" />
                    <span>{ticket.senderName}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-ink-soft font-mono">
                    <Phone className="w-3.5 h-3.5 text-ink-soft" />
                    <span dir="ltr">{ticket.senderPhone}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-ink-soft">
                    <Building className="w-3.5 h-3.5 text-ink-soft" />
                    <span>
                      {ticket.university === 'assiut_ahleya' ? 'جامعة أسيوط الأهلية' : 'جامعة سفنكس'}
                      {ticket.college ? ` · ${ticket.college}` : ''}
                    </span>
                  </div>

                  {ticket.orderNumber && (
                    <div className="flex items-center gap-1.5 text-primary font-mono font-bold">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>طلب #{ticket.orderNumber}</span>
                      {ticket.kioskName && <span className="font-body text-ink-soft">({ticket.kioskName})</span>}
                    </div>
                  )}
                </div>

                {/* Subject & Message Preview */}
                <div className="space-y-1">
                  <h4 className="font-body font-bold text-sm text-ink">
                    {ticket.subject}
                  </h4>
                  <p className="font-body text-xs text-ink-soft leading-relaxed line-clamp-2">
                    {ticket.message}
                  </p>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line/60">
                  <div className="flex items-center gap-2">
                    {/* Direct Call Button */}
                    <a
                      href={`tel:${ticket.senderPhone}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-canvas hover:bg-surface border border-line text-xs font-body font-bold text-ink transition-colors"
                      title="اتصال هاتفي مباشر"
                    >
                      <Phone className="w-3.5 h-3.5 text-accent" />
                      <span>اتصال</span>
                    </a>

                    {/* WhatsApp Direct Chat Button */}
                    <a
                      href={getWhatsAppUrl(ticket.senderPhone, ticket.ticketNumber, ticket.senderName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-body font-bold text-emerald-800 transition-colors"
                      title="محادثة واتساب مباشرة"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>واتساب</span>
                    </a>

                    {ticket.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setZoomedImage(ticket.imageUrl || null)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-canvas hover:bg-surface border border-line text-xs font-body font-bold text-ink-soft hover:text-ink transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        <span>مرفق صورة</span>
                      </button>
                    )}
                  </div>

                  {/* Open Details Modal */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDetails(ticket)}
                  >
                    <span>فحص التفاصيل وتحديث الحالة</span>
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  </Button>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-12 text-center space-y-3 border border-line">
            <div className="w-12 h-12 rounded-2xl bg-canvas border border-line flex items-center justify-center mx-auto text-ink-soft">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="font-body font-bold text-sm text-ink">
              لا توجد تذاكر تطابق البحث
            </p>
            <p className="font-body text-xs text-ink-soft">
              لم يتم العثور على أي شكاوى أو مقترحات وفقاً للفلاتر الحالية.
            </p>
          </Card>
        )}
      </div>

      {/* DETAILS & ACTION MODAL */}
      <Modal
        isOpen={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket ? `تذكرة ${selectedTicket.ticketNumber}` : 'تفاصيل التذكرة'}
        description="معاينة تفاصيل المشكلة وتحديث حالة التذكرة والرد على الطالب"
        maxWidth="lg"
      >
        {selectedTicket && (
          <div className="p-5 sm:p-6 space-y-5">
            {actionSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-body font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionSuccessMessage}</span>
              </div>
            )}

            {/* Submitter & Affiliation Card */}
            <div className="bg-canvas border border-line rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-body font-bold text-sm text-ink flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span>{selectedTicket.senderName}</span>
                </p>
                <span
                  className={`text-[11px] font-body font-bold px-2.5 py-0.5 rounded-full ${
                    selectedTicket.isGuest
                      ? 'bg-surface text-ink-soft border border-line'
                      : 'bg-accent-soft text-accent'
                  }`}
                >
                  {selectedTicket.isGuest ? 'زائر' : 'طالب مسجل'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-body text-ink-soft pt-1">
                <div>
                  <span className="font-semibold text-ink">الهاتف: </span>
                  <span dir="ltr" className="font-mono text-ink">{selectedTicket.senderPhone}</span>
                </div>
                {selectedTicket.senderEmail && (
                  <div>
                    <span className="font-semibold text-ink">الإيميل: </span>
                    <span className="text-ink">{selectedTicket.senderEmail}</span>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-ink">الجامعة: </span>
                  <span>{selectedTicket.university === 'assiut_ahleya' ? 'جامعة أسيوط الأهلية' : 'جامعة سفنكس'}</span>
                </div>
                <div>
                  <span className="font-semibold text-ink">الكلية: </span>
                  <span>{selectedTicket.college || 'غير محددة'}</span>
                </div>
              </div>
            </div>

            {/* Direct Communication Quick Bar */}
            <div className="flex items-center gap-2.5">
              <a
                href={`tel:${selectedTicket.senderPhone}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-canvas hover:bg-surface border border-line text-xs font-body font-bold text-ink transition-colors"
              >
                <Phone className="w-4 h-4 text-accent" />
                <span>اتصال هاتفي</span>
              </a>

              <a
                href={getWhatsAppUrl(selectedTicket.senderPhone, selectedTicket.ticketNumber, selectedTicket.senderName)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-body font-bold text-emerald-800 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>محادثة واتساب</span>
              </a>
            </div>

            {/* Problem Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-body font-bold text-sm text-ink">
                  {selectedTicket.subject}
                </h4>
                <span className="font-mono text-[11px] text-ink-soft">
                  {formatArabicTime(selectedTicket.createdAt)}
                </span>
              </div>

              <div className="bg-canvas border border-line rounded-2xl p-4 font-body text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap">
                {selectedTicket.message}
              </div>
            </div>

            {/* Attached Screenshot Image */}
            {selectedTicket.imageUrl && (
              <div className="space-y-1.5">
                <p className="font-body font-semibold text-xs text-ink">الصورة المرفقة:</p>
                <div
                  onClick={() => setZoomedImage(selectedTicket.imageUrl || null)}
                  className="relative w-full h-44 rounded-2xl overflow-hidden border border-line bg-canvas cursor-pointer group"
                >
                  <Image
                    src={selectedTicket.imageUrl}
                    alt="مرفق التذكرة"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-ink/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-body text-xs font-bold gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>تكبير الصورة</span>
                  </div>
                </div>
              </div>
            )}

            {/* Status & Priority Management */}
            <div className="pt-3 border-t border-line space-y-3">
              <h4 className="font-body font-bold text-xs text-ink uppercase tracking-wide">
                إجراءات الإدارة والتحديث
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-body text-xs font-semibold text-ink mb-1">
                    حالة التذكرة
                  </label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value as SupportTicketStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-canvas border border-line font-body text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="pending">قيد المراجعة</option>
                    <option value="in_progress">قيد المتابعة</option>
                    <option value="resolved">تم الحل بنجاح</option>
                    <option value="closed">مغلقة / مرفوضة</option>
                  </select>
                </div>

                <div>
                  <label className="block font-body text-xs font-semibold text-ink mb-1">
                    ملاحظات داخلية لفريق الإدارة
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="ملاحظات خاصة (لا تظهر للطالب)..."
                    className="w-full px-3 py-2 rounded-xl bg-canvas border border-line font-body text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Official Reply */}
              <div>
                <label className="block font-body text-xs font-semibold text-ink mb-1">
                  رد الإدارة على الطالب (يظهر في حسابه بالتطبيق)
                </label>
                <textarea
                  rows={3}
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  placeholder="اكتب ردك للطالب هنا لإبلاغه بما تم بخصوص مشكلته..."
                  className="w-full p-3 rounded-xl bg-canvas border border-line font-body text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTicket(null)}
                >
                  إلغاء
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveTicketUpdate}
                  isLoading={isUpdating}
                >
                  <span>حفظ التعديلات والرد</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Image Zoom Modal */}
      <Modal
        isOpen={Boolean(zoomedImage)}
        onClose={() => setZoomedImage(null)}
        title="معاينة الصورة المرفقة"
        maxWidth="xl"
      >
        {zoomedImage && (
          <div className="p-4 flex flex-col items-center">
            <div className="relative w-full h-[65vh] rounded-2xl overflow-hidden bg-canvas">
              <Image
                src={zoomedImage}
                alt="الصورة المرفقة"
                fill
                className="object-contain"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomedImage(null)}
              className="mt-4"
            >
              إغلاق
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
