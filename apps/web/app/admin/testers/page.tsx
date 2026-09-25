'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Download,
  RotateCcw,
  Sparkles,
  Search,
  MessageCircle,
  Copy,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  FileText,
  UserPlus,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DayStatus = 'pending' | 'active' | 'missed';

export interface Tester {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  days: Record<number, DayStatus>; // 1 to 14
}

const STORAGE_KEY = 'fastorder_play_testers_v2';
const CURRENT_DAY_KEY = 'fastorder_play_current_day_v2';
const TARGET_TESTERS_KEY = 'fastorder_play_target_count_v2';
const TOTAL_DAYS = 14;

export default function AdminTestersPage() {
  const [testers, setTesters] = useState<Tester[]>([]);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [targetCount, setTargetCount] = useState<number>(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Single Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTester, setEditingTester] = useState<Tester | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Bulk Add Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');

  // Target Settings Modal State
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [tempTarget, setTempTarget] = useState(12);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTesters(JSON.parse(saved));
      } else {
        // Start completely empty so the user is 100% in control of their list
        setTesters([]);
      }

      const savedDay = localStorage.getItem(CURRENT_DAY_KEY);
      if (savedDay) {
        setCurrentDay(parseInt(savedDay, 10) || 1);
      }

      const savedTarget = localStorage.getItem(TARGET_TESTERS_KEY);
      if (savedTarget) {
        setTargetCount(parseInt(savedTarget, 10) || 12);
        setTempTarget(parseInt(savedTarget, 10) || 12);
      }
    } catch {
      setTesters([]);
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  const saveTesters = (newTesters: Tester[]) => {
    setTesters(newTesters);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTesters));
    } catch (e) {
      console.error('Failed to save testers:', e);
    }
  };

  const handleSetCurrentDay = (day: number) => {
    setCurrentDay(day);
    try {
      localStorage.setItem(CURRENT_DAY_KEY, day.toString());
    } catch {}
  };

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    setTargetCount(tempTarget);
    localStorage.setItem(TARGET_TESTERS_KEY, tempTarget.toString());
    setIsTargetModalOpen(false);
  };

  // Toggle day status: pending -> active -> missed -> pending
  const toggleDayStatus = (testerId: string, dayNum: number) => {
    const updated = testers.map((t) => {
      if (t.id !== testerId) return t;
      const currentStatus = t.days[dayNum] || 'pending';
      let nextStatus: DayStatus = 'active';
      if (currentStatus === 'active') nextStatus = 'missed';
      else if (currentStatus === 'missed') nextStatus = 'pending';
      else nextStatus = 'active';

      return {
        ...t,
        days: {
          ...t.days,
          [dayNum]: nextStatus,
        },
      };
    });
    saveTesters(updated);
  };

  // Mark all active for current day
  const markAllActiveForCurrentDay = () => {
    if (testers.length === 0) return;
    const updated = testers.map((t) => ({
      ...t,
      days: {
        ...t.days,
        [currentDay]: 'active' as DayStatus,
      },
    }));
    saveTesters(updated);
  };

  // Clear current day status for all
  const clearCurrentDayForAll = () => {
    if (testers.length === 0) return;
    if (confirm(`هل ترغب في إعادة ضبط علامات اليوم ${currentDay} للجميع؟`)) {
      const updated = testers.map((t) => {
        const newDays = { ...t.days };
        delete newDays[currentDay];
        return {
          ...t,
          days: newDays,
        };
      });
      saveTesters(updated);
    }
  };

  // Open Modal (Add / Edit)
  const openAddModal = () => {
    setEditingTester(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Tester) => {
    setEditingTester(t);
    setFormName(t.name);
    setFormEmail(t.email);
    setFormPhone(t.phone || '');
    setFormNotes(t.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    if (editingTester) {
      // Edit
      const updated = testers.map((t) =>
        t.id === editingTester.id
          ? {
              ...t,
              name: formName.trim(),
              email: formEmail.trim().toLowerCase(),
              phone: formPhone.trim(),
              notes: formNotes.trim(),
            }
          : t
      );
      saveTesters(updated);
    } else {
      // Add
      const newTester: Tester = {
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim(),
        notes: formNotes.trim(),
        days: { [currentDay]: 'active' },
      };
      saveTesters([...testers, newTester]);
    }
    setIsModalOpen(false);
  };

  // Handle Bulk Add (Paste multiple emails/lines)
  const handleBulkAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInput.trim()) return;

    // Split by lines or commas
    const lines = bulkInput
      .split(/[\n,;]+/)
      .map((l) => l.trim())
      .filter((l) => Boolean(l));

    const newItems: Tester[] = [];

    lines.forEach((line) => {
      // Check if format is "Name <email>" or "Name (email)" or just "email"
      let name = '';
      let email = '';

      const match = line.match(/^([^<(\@]+)[<(\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})[>)]?$/);
      if (match) {
        name = match[1].trim();
        email = match[2].trim().toLowerCase();
      } else if (line.includes('@')) {
        email = line.trim().toLowerCase();
        // derive name from email prefix e.g. ahmed.ali -> أحمد علي
        const prefix = email.split('@')[0];
        name = prefix.replace(/[._-]/g, ' ');
      } else {
        name = line.trim();
        email = `${line.trim().replace(/\s+/g, '')}@gmail.com`;
      }

      if (email) {
        newItems.push({
          id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: name || email,
          email,
          phone: '',
          notes: 'مضاف عبر الاستيراد السريع',
          days: { [currentDay]: 'active' },
        });
      }
    });

    if (newItems.length > 0) {
      saveTesters([...testers, ...newItems]);
      setBulkInput('');
      setIsBulkModalOpen(false);
    }
  };

  const handleDeleteTester = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف المختبر "${name}"؟`)) {
      saveTesters(testers.filter((t) => t.id !== id));
    }
  };

  const handleClearAllTesters = () => {
    if (confirm('هل أنت متأكد من رغبتك في مسح جميع المختبرين والبدء من الصفر بقائمة فارغة؟')) {
      saveTesters([]);
    }
  };

  // WhatsApp Reminder
  const sendWhatsAppReminder = (tester: Tester) => {
    const rawPhone = tester.phone?.replace(/[^0-9]/g, '');
    const msg = `مرحباً ${tester.name}
تذكير بفتح وتجربة تطبيق FastOrder على هاتفك اليوم لمساعدتنا في استيفاء شروط فترة الاختبار المغلق في Google Play.
رابط التطبيق:
https://play.google.com/store/apps/details?id=com.fastorder.app
شكراً جزيلاً لدعمك.`;

    const encoded = encodeURIComponent(msg);
    if (rawPhone) {
      window.open(`https://wa.me/${rawPhone}?text=${encoded}`, '_blank');
    } else {
      navigator.clipboard.writeText(msg);
      alert('تم نسخ رسالة التذكير مع الرابط إلى الحافظة! يمكنك الآن لصقها وإرسالها له مباشرة.');
    }
  };

  // Copy Email Helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export CSV
  const exportCSV = () => {
    if (testers.length === 0) {
      alert('لا توجد بيانات مختبرين لتصديرها.');
      return;
    }
    const headers = ['الاسم', 'البريد الإلكتروني', 'الهاتف', 'الملاحظات', ...Array.from({ length: 14 }, (_, i) => `اليوم ${i + 1}`)];
    const rows = testers.map((t) => [
      t.name,
      t.email,
      t.phone || '',
      t.notes || '',
      ...Array.from({ length: 14 }, (_, i) => {
        const s = t.days[i + 1];
        return s === 'active' ? 'نشط' : s === 'missed' ? 'غائب' : 'قيد الانتظار';
      }),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FastOrder_Testers_Report_Day${currentDay}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations
  const filteredTesters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return testers;
    return testers.filter((t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q)));
  }, [testers, searchQuery]);

  const activeTodayCount = useMemo(() => {
    return testers.filter((t) => t.days[currentDay] === 'active').length;
  }, [testers, currentDay]);

  const missedTodayCount = useMemo(() => {
    return testers.filter((t) => t.days[currentDay] === 'missed').length;
  }, [testers, currentDay]);

  const complianceRate = useMemo(() => {
    if (testers.length === 0) return 0;
    return Math.round((activeTodayCount / testers.length) * 100);
  }, [activeTodayCount, testers.length]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-warm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent/20 text-accent font-body text-xs font-bold mb-3">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>أنت المتحكم الكامل بنسبة 100% في قائمة المختبرين</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
              متابعة المختبرين (14 يوماً)
            </h1>
            <p className="font-body text-sm text-ink-soft mt-1.5 max-w-xl">
              أضف، عدّل، واحذف أسماء وإيميلات المختبرين كما تشاء، وتابع التزامهم بفتح التطبيق يومياً مع إمكانية إرسال تذكيرات مباشرة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Add One */}
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-ink font-body font-bold text-sm rounded-xl shadow-warm hover:bg-primary-hover transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مختبر</span>
            </button>

            {/* Bulk Add */}
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-canvas border border-line text-ink font-body text-xs font-bold rounded-xl hover:bg-surface transition-all"
              title="لصق قائمة إيميلات دفعة واحدة"
            >
              <UserPlus className="w-4 h-4 text-primary" />
              <span>لصق قائمة إيميلات</span>
            </button>

            {/* Export CSV */}
            {testers.length > 0 && (
              <button
                onClick={exportCSV}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-canvas border border-line text-ink font-body text-xs font-bold rounded-xl hover:bg-surface transition-all"
                title="تصدير تقرير Excel / CSV"
              >
                <Download className="w-4 h-4 text-ink-soft" />
                <span className="hidden sm:inline">تصدير CSV</span>
              </button>
            )}

            {/* Clear All */}
            {testers.length > 0 && (
              <button
                onClick={handleClearAllTesters}
                className="p-2.5 bg-canvas border border-line text-ink-soft hover:text-danger hover:border-danger/40 rounded-xl transition-all"
                title="مسح جميع المختبرين والبدء من الصفر"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Testers Total */}
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-warm">
          <div className="flex items-center justify-between text-ink-soft mb-2">
            <span className="font-body text-xs font-semibold">المختبرون المضافون</span>
            <button
              onClick={() => setIsTargetModalOpen(true)}
              title="تعديل العدد المستهدف"
              className="w-7 h-7 rounded-lg bg-primary-soft flex items-center justify-center hover:bg-primary transition-colors text-primary-ink"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
              {testers.length}
            </span>
            <span className="font-mono text-xs text-ink-soft">/ {targetCount} المطلوب</span>
          </div>
          <div className="mt-2.5 w-full bg-canvas rounded-full h-1.5 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                testers.length >= targetCount ? 'bg-accent' : 'bg-primary'
              )}
              style={{ width: `${Math.min(100, (testers.length / (targetCount || 1)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Current Day Selector */}
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-warm">
          <div className="flex items-center justify-between text-ink-soft mb-2">
            <span className="font-body text-xs font-semibold">اليوم الحالي للمتابعة</span>
            <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center">
              <Clock className="w-4 h-4 text-accent" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
              اليوم {currentDay}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentDay <= 1}
                onClick={() => handleSetCurrentDay(Math.max(1, currentDay - 1))}
                className="p-1 rounded-lg border border-line hover:bg-canvas disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                disabled={currentDay >= TOTAL_DAYS}
                onClick={() => handleSetCurrentDay(Math.min(TOTAL_DAYS, currentDay + 1))}
                className="p-1 rounded-lg border border-line hover:bg-canvas disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="font-body text-[11px] text-ink-soft mt-1.5">
            متبقي {TOTAL_DAYS - currentDay} يوماً على اكتمال الـ 14
          </p>
        </div>

        {/* Card 3: Active Today */}
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-warm">
          <div className="flex items-center justify-between text-ink-soft mb-2">
            <span className="font-body text-xs font-semibold">تفاعل اليوم ({currentDay})</span>
            <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-accent" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl sm:text-3xl text-accent">
              {activeTodayCount}
            </span>
            <span className="font-mono text-xs text-ink-soft">
              من {testers.length} ({complianceRate}%)
            </span>
          </div>
          <p className="font-body text-[11px] text-ink-soft mt-1.5">
            {missedTodayCount > 0 ? (
              <span className="text-danger font-bold">{missedTodayCount} لم يفتحوا التطبيق</span>
            ) : (
              <span className="text-accent font-bold">كل الحاضرين نشطون اليوم!</span>
            )}
          </p>
        </div>

        {/* Card 4: Google Play Criteria */}
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-warm">
          <div className="flex items-center justify-between text-ink-soft mb-2">
            <span className="font-body text-xs font-semibold">حالة مسار Google Play</span>
            <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5 text-accent font-display font-bold text-lg sm:text-xl">
            <span>Closed Testing Active</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <p className="font-body text-[11px] text-ink-soft mt-1.5">
            الهدف: {targetCount} مختبراً · 14 يوماً
          </p>
        </div>
      </div>

      {/* Control Bar: Day quick action & Search */}
      <div className="bg-surface border border-line rounded-2xl p-4 shadow-warm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Days pill bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none select-none">
          <span className="font-body text-xs font-bold text-ink-soft pl-2 whitespace-nowrap">
            اختر اليوم:
          </span>
          {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((d) => {
            const isSelected = d === currentDay;
            return (
              <button
                key={d}
                onClick={() => handleSetCurrentDay(d)}
                className={cn(
                  'w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center shrink-0',
                  isSelected
                    ? 'bg-primary text-primary-ink shadow-sm scale-105'
                    : 'bg-canvas text-ink-soft hover:bg-line/40'
                )}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {testers.length > 0 && (
            <>
              <button
                onClick={markAllActiveForCurrentDay}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent/10 border border-accent/30 text-accent font-body text-xs font-bold rounded-xl hover:bg-accent hover:text-white transition-all whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" />
                <span>تحديد الكل كنشط لليوم {currentDay}</span>
              </button>

              <button
                onClick={clearCurrentDayForAll}
                className="p-2 bg-canvas border border-line text-ink-soft hover:text-danger rounded-xl transition-all"
                title="مسح علامات هذا اليوم للجميع"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Search box */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-ink-soft absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الإيميل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 bg-canvas border border-line rounded-xl text-xs font-body text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Testers Tracking Table */}
      <div className="bg-surface border border-line rounded-3xl shadow-warm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-display font-bold text-lg text-ink">
              مصفوفة الـ 14 يوماً ({filteredTesters.length} مختبر مسجل)
            </h3>
            <span className="text-[11px] font-body text-ink-soft bg-canvas px-2.5 py-1 rounded-full border border-line">
              انقر على أي دائرة للتبديل بين: رمادي، أخضر، أحمر
            </span>
          </div>

          {testers.length > 0 && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover font-body"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة شخص آخر</span>
            </button>
          )}
        </div>

        {testers.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-primary-soft text-primary-ink flex items-center justify-center mx-auto shadow-warm">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-display font-bold text-xl text-ink">القائمة فارغة تماماً</h4>
              <p className="font-body text-xs text-ink-soft mt-1.5 leading-relaxed">
                أنت الآن المتحكم بنسبة 100%. يمكنك إضافة أصدقائك المختبرين الحقيقيين واحداً تلو الآخر، أو لصق قائمة إيميلاتهم دفعة واحدة!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={openAddModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-ink font-body font-bold text-xs rounded-xl shadow-warm hover:bg-primary-hover transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول مختبر بالاسم</span>
              </button>

              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-canvas border border-line text-ink font-body font-bold text-xs rounded-xl hover:bg-surface transition-all"
              >
                <UserPlus className="w-4 h-4 text-primary" />
                <span>لصق قائمة إيميلات دفعة واحدة</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-canvas/60 border-b border-line text-[11px] font-body font-bold text-ink-soft uppercase tracking-wider select-none">
                  <th className="py-3.5 px-4 min-w-[200px]">المختبر</th>
                  <th className="py-3.5 px-2 text-center min-w-[500px]">
                    متابعة الأيام (1 – 14)
                  </th>
                  <th className="py-3.5 px-4 text-center min-w-[90px]">الالتزام</th>
                  <th className="py-3.5 px-4 text-left min-w-[120px]">إجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line/60">
                {filteredTesters.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-ink-soft font-body text-sm">
                      لا يوجد مختبر يطابق نتيجة البحث.
                    </td>
                  </tr>
                ) : (
                  filteredTesters.map((tester) => {
                    const activeDaysCount = Object.values(tester.days).filter((s) => s === 'active').length;
                    const progressPct = Math.round((activeDaysCount / TOTAL_DAYS) * 100);

                    return (
                      <tr
                        key={tester.id}
                        className="hover:bg-canvas/30 transition-colors group"
                      >
                        {/* Name & Contact */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary-ink font-display font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                              {tester.name.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-display font-bold text-sm text-ink truncate">
                                {tester.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[11px] text-ink-soft truncate max-w-[160px]">
                                  {tester.email}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(tester.email, tester.id)}
                                  title="نسخ البريد الإلكتروني"
                                  className="text-ink-soft hover:text-ink transition-colors"
                                >
                                  {copiedId === tester.id ? (
                                    <Check className="w-3 h-3 text-accent" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              {tester.notes && (
                                <p className="text-[10px] font-body text-ink-soft/70 truncate max-w-[180px] mt-0.5">
                                  {tester.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 14 Day Interactive Circles */}
                        <td className="py-3.5 px-2">
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((d) => {
                              const status: DayStatus = tester.days[d] || 'pending';
                              const isToday = d === currentDay;

                              return (
                                <button
                                  key={d}
                                  onClick={() => toggleDayStatus(tester.id, d)}
                                  title={`اليوم ${d}: ${
                                    status === 'active'
                                      ? 'نشط (انقر للتبديل)'
                                      : status === 'missed'
                                      ? 'غائب (انقر للتبديل)'
                                      : 'قيد الانتظار (انقر للتبديل)'
                                  }`}
                                  className={cn(
                                    'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 transform active:scale-90 relative',
                                    isToday && 'ring-2 ring-primary ring-offset-2 ring-offset-surface',
                                    status === 'active' &&
                                      'bg-accent text-white shadow-sm hover:brightness-110',
                                    status === 'missed' &&
                                      'bg-danger text-white shadow-sm hover:brightness-110',
                                    status === 'pending' &&
                                      'bg-canvas border border-line text-ink-soft/40 hover:border-ink-soft/80 hover:bg-surface'
                                  )}
                                >
                                  {status === 'active' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  {status === 'missed' && <X className="w-3.5 h-3.5 stroke-[3]" />}
                                  {status === 'pending' && (
                                    <span className="font-mono text-[10px] font-bold text-ink-soft/50">
                                      {d}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* Score / Progress */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono text-xs font-bold text-ink">
                              {activeDaysCount} / {TOTAL_DAYS}
                            </span>
                            <div className="w-16 bg-canvas rounded-full h-1.5 overflow-hidden mt-1 border border-line/40">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-300',
                                  progressPct >= 80 ? 'bg-accent' : progressPct >= 50 ? 'bg-primary' : 'bg-line'
                                )}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Actions: WhatsApp / Edit / Delete */}
                        <td className="py-3.5 px-4 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => sendWhatsAppReminder(tester)}
                              title="إرسال تذكير واتساب"
                              className="p-2 rounded-xl bg-canvas border border-line text-accent hover:bg-accent-soft transition-all"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditModal(tester)}
                              title="تعديل بيانات المختبر"
                              className="p-2 rounded-xl bg-canvas border border-line text-ink-soft hover:text-ink hover:bg-surface transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTester(tester.id, tester.name)}
                              title="حذف هذا المختبر"
                              className="p-2 rounded-xl bg-canvas border border-line text-ink-soft hover:text-danger hover:border-danger/30 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Guide */}
        {testers.length > 0 && (
          <div className="p-4 bg-canvas/40 border-t border-line flex flex-wrap items-center justify-between gap-4 text-xs font-body text-ink-soft">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-accent inline-block" />
                <span>أخضر: نشط (فتح التطبيق)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-danger inline-block" />
                <span>أحمر: غائب (لم يفتح)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-canvas border border-line inline-block" />
                <span>رمادي: قيد الانتظار</span>
              </span>
            </div>

            <div className="text-[11px] text-ink-soft/80">
              يتم حفظ أي إضافة أو تعديل أو علامة على جهازك بشكل فوري ودائم
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Individual Tester Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-line rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-floating relative">
            <h3 className="font-display font-bold text-xl text-ink mb-1">
              {editingTester ? 'تعديل بيانات المختبر' : 'إضافة مختبر جديد'}
            </h3>
            <p className="font-body text-xs text-ink-soft mb-5">
              أنت المتحكم الكامل: حدد الاسم والبريد لمتابعته في الـ 14 يوماً.
            </p>

            <form onSubmit={handleSaveModal} className="space-y-4 font-body">
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  اسم المختبر <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمود"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-sm text-ink placeholder:text-ink-soft/50 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  البريد الإلكتروني (Gmail) <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="example@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-sm text-ink placeholder:text-ink-soft/50 focus:outline-none focus:border-primary text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  رقم الهاتف (اختياري - لإرسال رسائل تذكير واتساب)
                </label>
                <input
                  type="tel"
                  placeholder="+2010xxxxxxxx"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-sm text-ink placeholder:text-ink-soft/50 focus:outline-none focus:border-primary text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  ملاحظات (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: تم إرسال الرابط له، زميل عمل..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-sm text-ink placeholder:text-ink-soft/50 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-ink-soft hover:text-ink transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-primary-ink font-bold text-xs rounded-xl shadow-warm hover:bg-primary-hover transition-all"
                >
                  {editingTester ? 'حفظ التعديلات' : 'إضافة المختبر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-line rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-floating relative">
            <h3 className="font-display font-bold text-xl text-ink mb-1">
              لصق قائمة إيميلات دفعة واحدة
            </h3>
            <p className="font-body text-xs text-ink-soft mb-4">
              يمكنك نسخ ولصق إيميلات المختبرين من Google Play Console هنا، إما سطراً بسطر أو مفصولة بفواصل، وسنقوم بإضافتهم فوراً!
            </p>

            <form onSubmit={handleBulkAdd} className="space-y-4 font-body">
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  قائمة الإيميلات أو الأسماء:
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder={`ahmed@gmail.com\nmohamed@gmail.com\nsara@gmail.com\nأو بتنسيق: أحمد <ahmed@gmail.com>`}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-xs font-mono text-ink placeholder:text-ink-soft/40 focus:outline-none focus:border-primary"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-ink-soft hover:text-ink transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-primary-ink font-bold text-xs rounded-xl shadow-warm hover:bg-primary-hover transition-all"
                >
                  إضافة القائمة للجدول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Target Settings Modal */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-line rounded-3xl p-6 max-w-sm w-full shadow-floating relative">
            <h3 className="font-display font-bold text-lg text-ink mb-1">
              تحديد العدد المستهدف للمختبرين
            </h3>
            <p className="font-body text-xs text-ink-soft mb-4">
              العدد الافتراضي هو 12 مختبراً (حسب شروط حسابك الحالية). يمكنك تغييره إن أردت.
            </p>

            <form onSubmit={handleSaveTarget} className="space-y-4 font-body">
              <div>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={tempTarget}
                  onChange={(e) => setTempTarget(parseInt(e.target.value, 10) || 12)}
                  className="w-full px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-lg font-mono font-bold text-ink text-center focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTargetModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-ink-soft hover:text-ink"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-primary-ink font-bold text-xs rounded-xl shadow-warm hover:bg-primary-hover"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
