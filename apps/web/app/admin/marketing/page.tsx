'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api/client';
import {
  Megaphone,
  Smartphone,
  Globe,
  Users,
  Send,
  CheckCircle2,
  AlertCircle,
  Search,
  Building2,
  Clock,
  Sparkles,
  RefreshCw,
  BellRing,
  Check,
  X,
  Radio,
  FileText,
  UserCheck,
  Loader2,
} from 'lucide-react';

function formatRelativeArabic(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return 'الآن';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  } catch {
    return 'مؤخراً';
  }
}

interface AudienceStats {
  totalActiveDevices: number;
  androidDevices: number;
  webDevices: number;
  guestDevices: number;
  registeredStudents: number;
  colleges: string[];
}

interface CampaignItem {
  id: string;
  title: string;
  body: string;
  targetType: 'all' | 'single_user' | 'college' | 'university';
  targetValue?: string;
  actionUrl?: string;
  imageUrl?: string;
  sentCount: number;
  failedCount: number;
  creatorName?: string;
  createdAt: string;
}

interface StudentSearchItem {
  id: string;
  fullName: string;
  phone?: string;
  college?: string;
  universityId?: string;
  university?: string;
}

export default function AdminMarketingPage() {
  const [stats, setStats] = useState<AudienceStats>({
    totalActiveDevices: 0,
    androidDevices: 0,
    webDevices: 0,
    guestDevices: 0,
    registeredStudents: 0,
    colleges: [],
  });

  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [actionUrl, setActionUrl] = useState('/student/kiosks');
  const [targetType, setTargetType] = useState<'all' | 'single_user' | 'college'>('all');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchItem | null>(null);

  // Student Search State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState<StudentSearchItem[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Quick Templates
  const templates = [
    {
      label: 'بريك الصباح',
      title: 'وفّر طابور أول اليوم في كليتك',
      body: 'ابدأ يومك بقهوتك وفطارك المفضل من كشك كليتك، اطلب مسبقاً واستلم على الجاهز بدون انتظار.',
      actionUrl: '/student/kiosks',
    },
    {
      label: 'وقت الغداء والبريك',
      title: 'بريك المحاضرات بدأ! وجبتك جاهزة',
      body: 'متضيعش وقت الراحة في الزحام، اطلب ساندوتشك أو وجبتك الآن واستلمها فور خروجك.',
      actionUrl: '/student/kiosks',
    },
    {
      label: 'عرض نهاية اليوم',
      title: 'سناك سريع ومشروب يجدد طاقتك',
      body: 'يومك طويل في الكلية؟ تصفح منيو الأكشاك واطلب مشروبك المفضل مع استلام فوري.',
      actionUrl: '/student/kiosks',
    },
  ];

  // Fetch Audience Stats
  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const res = await apiClient.get<any>('/admin/marketing/stats');
      const statsData = res?.totalDevices !== undefined ? res : (res?.data ?? null);
      if (statsData) {
        setStats(statsData);
        if (statsData.colleges?.length > 0 && !selectedCollege) {
          setSelectedCollege(statsData.colleges[0]);
        }
      }
    } catch (err) {
      console.warn('[Marketing] Error fetching stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [selectedCollege]);

  // Fetch Campaigns History
  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const res = await apiClient.get<any>('/admin/marketing/campaigns');
      const campaignList = res?.campaigns ?? res?.data?.campaigns ?? (Array.isArray(res) ? res : []);
      if (campaignList) {
        setCampaigns(campaignList);
      }
    } catch (err) {
      console.warn('[Marketing] Error fetching campaigns:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCampaigns();
  }, [fetchStats, fetchCampaigns]);

  // Debounced Student Search
  useEffect(() => {
    const query = studentSearchQuery.trim();
    if (targetType !== 'single_user' || !query) {
      setStudentSearchResults([]);
      setIsSearchingStudents(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingStudents(true);
        const res = await apiClient.get<any>(`/admin/marketing/students/search?q=${encodeURIComponent(query)}`);
        const results = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        setStudentSearchResults(results);
      } catch (err) {
        console.warn('[Marketing] Student search error:', err);
        setStudentSearchResults([]);
      } finally {
        setIsSearchingStudents(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [studentSearchQuery, targetType]);

  const handleApplyTemplate = (tmpl: typeof templates[0]) => {
    setTitle(tmpl.title);
    setBody(tmpl.body);
    setActionUrl(tmpl.actionUrl);
  };

  const handleSendSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setStatusMessage({ type: 'error', text: 'يرجى إدخال عنوان الإشعار ونص الرسالة أولاً' });
      return;
    }

    if (targetType === 'single_user' && !selectedStudent) {
      setStatusMessage({ type: 'error', text: 'يرجى اختيار الطالب المستهدف بالاسم أو رقم الهاتف' });
      return;
    }

    if (targetType === 'college' && !selectedCollege) {
      setStatusMessage({ type: 'error', text: 'يرجى اختيار الكلية المستهدفة' });
      return;
    }

    setShowConfirmModal(false);
    setIsSending(true);
    setStatusMessage(null);

    let targetValue: string | undefined;
    if (targetType === 'single_user') {
      targetValue = selectedStudent?.id || selectedStudent?.universityId;
    } else if (targetType === 'college') {
      targetValue = selectedCollege;
    }

    try {
      const res = await apiClient.post<any>('/admin/marketing/send', {
        title: title.trim(),
        body: body.trim(),
        targetType,
        targetValue,
        actionUrl: actionUrl.trim() || '/student',
      });

      const resultData = res?.stats ? res : (res?.data ?? res);
      const sentCount = resultData?.stats?.sentCount ?? 0;

      setStatusMessage({
        type: 'success',
        text: `تم إرسال الإشعار بنجاح إلى ${sentCount} جهاز متصل!`,
      });
      // Clear input form
      setTitle('');
      setBody('');
      setSelectedStudent(null);
      setStudentSearchQuery('');
      // Refresh history
      fetchCampaigns();
      fetchStats();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'حدث خطأ أثناء إرسال الإشعار، يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const getTargetSummary = () => {
    if (targetType === 'all') return 'جميع الأجهزة المتصلة (تطبيق الموبايل، المتصفحات، والزوار غير المسجلين)';
    if (targetType === 'single_user') return `الطالب: ${selectedStudent?.fullName || 'محدد'}`;
    if (targetType === 'college') return `طلاب ${selectedCollege}`;
    return 'غير محدد';
  };

  return (
    <div className="space-y-6 pb-12 font-body text-right">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-line p-5 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-primary" />
            </div>
            <h1 className="font-display font-black text-2xl text-ink">
              الإشعارات التسويقية والحملات
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-ink-soft">
            إرسال إشعارات فورية موجهة للطلاب والمستخدمين عبر تطبيق الهاتف والمتصفح (مسجلين وزوار).
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            fetchStats();
            fetchCampaigns();
          }}
          disabled={isLoadingStats || isLoadingHistory}
          className="border border-line bg-canvas hover:bg-surface text-ink text-xs font-bold gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
          <span>تحديث الإحصائيات</span>
        </Button>
      </div>

      {/* 2. Real-time Audience KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Android Mobile Apps */}
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink-soft font-semibold">تطبيق أندرويد</span>
            <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-black text-ink">
            {isLoadingStats ? '...' : stats.androidDevices}
          </p>
          <p className="text-[11px] text-ink-soft/80 mt-1">أجهزة مثبتة وتستقبل Push</p>
        </div>

        {/* KPI 2: Web Push Browsers */}
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink-soft font-semibold">متصفحات الويب</span>
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-black text-ink">
            {isLoadingStats ? '...' : stats.webDevices}
          </p>
          <p className="text-[11px] text-ink-soft/80 mt-1">مشتركون عبر المتصفح</p>
        </div>

        {/* KPI 3: Guest / Unregistered Devices */}
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink-soft font-semibold">زوار غير مسجلين</span>
            <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary-ink flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-black text-ink">
            {isLoadingStats ? '...' : stats.guestDevices}
          </p>
          <p className="text-[11px] text-ink-soft/80 mt-1">أجهزة ضيوف بدون حساب</p>
        </div>

        {/* KPI 4: Total Audience Reach */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-soft/80 to-surface border border-primary/30 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-primary-ink font-bold">إجمالي الوصول المتاح</span>
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-ink flex items-center justify-center shadow-xs">
              <BellRing className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="font-mono text-2xl sm:text-3xl font-black text-primary-ink">
              {isLoadingStats ? '...' : stats.totalActiveDevices}
            </p>
            <span className="text-xs text-primary-ink font-bold">جهاز نشط</span>
          </div>
          <p className="text-[11px] text-primary-ink/80 mt-1">جاهزة للاستلام الفوري ⚡</p>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-accent-soft border-accent/30 text-accent'
              : 'bg-danger-soft border-danger/30 text-danger'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="p-1 hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Main Workspace: Dispatch Form & Live Mobile Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Container */}
        <div className="lg:col-span-7 bg-surface border border-line rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
          <div className="border-b border-line/60 pb-3">
            <h2 className="font-display font-bold text-lg text-ink flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              <span>إنشاء وإرسال إشعار جديد</span>
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              حدد الشريحة المستهدفة واكتب نص الرسالة مع معاينة فورية لشكل الإشعار.
            </p>
          </div>

          {/* Target Audience Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-ink block">الفئة المستهدفة:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('all')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 text-center ${
                  targetType === 'all'
                    ? 'bg-primary text-primary-ink border-primary shadow-xs'
                    : 'bg-canvas border-line text-ink-soft hover:text-ink hover:bg-surface'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>الجميع (عام)</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('single_user')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 text-center ${
                  targetType === 'single_user'
                    ? 'bg-primary text-primary-ink border-primary shadow-xs'
                    : 'bg-canvas border-line text-ink-soft hover:text-ink hover:bg-surface'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>طالب محدد</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('college')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 text-center ${
                  targetType === 'college'
                    ? 'bg-primary text-primary-ink border-primary shadow-xs'
                    : 'bg-canvas border-line text-ink-soft hover:text-ink hover:bg-surface'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>كلية معينة</span>
              </button>
            </div>
          </div>

          {/* Conditional Target Filter UI */}
          {targetType === 'single_user' && (
            <div className="p-4 bg-canvas rounded-2xl border border-line space-y-3 animate-in fade-in duration-200">
              <label className="text-xs font-bold text-ink block">
                ابحث عن الطالب (بالاسم، الهاتف، أو الكود الجامعي):
              </label>

              <div className="relative">
                {isSearchingStudents ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin absolute right-3 top-3" />
                ) : (
                  <Search className="w-4 h-4 text-ink-soft absolute right-3 top-3" />
                )}
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="مثال: محمد خيري، U727538، أو 01032..."
                  className="w-full bg-surface border border-line rounded-xl pr-9 pl-9 py-2.5 text-xs font-body text-ink focus:outline-none focus:border-primary shadow-xs"
                />
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setStudentSearchQuery('');
                      setStudentSearchResults([]);
                    }}
                    className="absolute left-3 top-2.5 text-ink-soft hover:text-ink p-0.5 rounded-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Selected Student Pill */}
              {selectedStudent ? (
                <div className="flex items-center justify-between p-3 bg-accent-soft/70 border border-accent/40 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <div>
                      <p className="font-bold text-accent">{selectedStudent.fullName}</p>
                      <p className="text-[11px] text-accent/80 font-mono">
                        {selectedStudent.college || 'طالب'}
                        {selectedStudent.universityId && ` · كود: ${selectedStudent.universityId}`}
                        {selectedStudent.phone && ` · هاتف: ${selectedStudent.phone}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="px-2.5 py-1 text-[11px] font-bold text-accent hover:bg-accent/10 border border-accent/30 rounded-lg transition-colors"
                  >
                    تغيير الطالب
                  </button>
                </div>
              ) : (
                <>
                  {/* Loading State */}
                  {isSearchingStudents && (
                    <div className="p-3 bg-surface border border-line rounded-xl text-center text-xs text-ink-soft flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>جاري البحث في قاعدة البيانات...</span>
                    </div>
                  )}

                  {/* Search Suggestions Dropdown */}
                  {!isSearchingStudents && studentSearchResults.length > 0 && (
                    <div className="bg-surface border border-line rounded-xl max-h-56 overflow-y-auto divide-y divide-line/60 shadow-sm">
                      <div className="px-3 py-1.5 bg-canvas text-[11px] font-bold text-ink-soft border-b border-line">
                        تم العثور على {studentSearchResults.length} نتيجة:
                      </div>
                      {studentSearchResults.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudent(st);
                            setStudentSearchResults([]);
                            setStudentSearchQuery('');
                          }}
                          className="w-full p-3 text-right hover:bg-primary-soft/40 transition-colors flex items-center justify-between text-xs group"
                        >
                          <div>
                            <p className="font-bold text-ink group-hover:text-primary transition-colors">
                              {st.fullName}
                            </p>
                            <p className="text-[11px] text-ink-soft">
                              {st.college || 'طالب'}
                              {st.universityId && ` · كود: ${st.universityId}`}
                              {st.phone && ` · هاتف: ${st.phone}`}
                            </p>
                          </div>
                          <span className="text-[11px] text-primary font-bold bg-primary-soft px-2 py-1 rounded-lg">
                            اختيار
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Empty State with Direct Use Option */}
                  {!isSearchingStudents && studentSearchQuery.trim().length >= 2 && studentSearchResults.length === 0 && (
                    <div className="p-3 bg-surface border border-line rounded-xl space-y-2 text-xs">
                      <p className="text-ink-soft text-[11px]">
                        لم يتم العثور على طالب يطابق &quot;{studentSearchQuery.trim()}&quot;.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudent({
                            id: studentSearchQuery.trim(),
                            fullName: `طالب (${studentSearchQuery.trim()})`,
                            universityId: studentSearchQuery.trim(),
                          });
                          setStudentSearchResults([]);
                          setStudentSearchQuery('');
                        }}
                        className="w-full py-2 px-3 bg-canvas hover:bg-primary-soft/50 border border-line hover:border-primary/40 text-primary font-bold text-center rounded-lg transition-all text-xs"
                      >
                        استهداف هذا المعرف مباشرة: {studentSearchQuery.trim()}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {targetType === 'college' && (
            <div className="p-3.5 bg-canvas rounded-2xl border border-line space-y-2 animate-in fade-in duration-200">
              <label className="text-xs font-bold text-ink block">اختر الكلية المستهدفة:</label>
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-xs font-body text-ink focus:outline-none focus:border-primary font-semibold"
              >
                {stats.colleges.length > 0 ? (
                  stats.colleges.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="كلية الهندسة">كلية الهندسة</option>
                    <option value="كلية الصيدلة">كلية الصيدلة</option>
                    <option value="كلية طب الأسنان">كلية طب الأسنان</option>
                    <option value="كلية العلاج الطبيعي">كلية العلاج الطبيعي</option>
                    <option value="كلية علوم الحاسب">كلية علوم الحاسب</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Quick Templates Strip */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-ink-soft flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>قوالب رسائل جاهزة وسريعة:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {templates.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-2.5 py-1 rounded-lg bg-canvas hover:bg-primary-soft text-ink-soft hover:text-primary-ink text-xs font-bold border border-line/70 transition-colors"
                >
                  + {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">عنوان الإشعار:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: خصم خاص لطلاب الهندسة في بريك اليوم"
              maxLength={80}
              className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-body text-ink focus:outline-none focus:border-primary"
            />
            <div className="flex justify-end text-[10px] text-ink-soft font-mono">
              {title.length}/80
            </div>
          </div>

          {/* Message Body Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">نص رسالة الإشعار:</label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="اكتب تفاصيل الإشعار التسويقي هنا..."
              maxLength={240}
              className="w-full bg-canvas border border-line rounded-xl p-3 text-xs sm:text-sm font-body text-ink focus:outline-none focus:border-primary leading-relaxed"
            />
            <div className="flex justify-end text-[10px] text-ink-soft font-mono">
              {body.length}/240
            </div>
          </div>

          {/* Action Link Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink block">
              رابط التوجيه عند النقر (Action Link):
            </label>
            <input
              type="text"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="/student/kiosks"
              className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2 text-xs font-mono text-ink focus:outline-none focus:border-primary text-left"
              dir="ltr"
            />
            <p className="text-[11px] text-ink-soft">
              يمكنك كتابة رابط داخلي مثل <code>/student/kiosks</code> ليفتح التطبيق الصفحة المحددة مباشرة.
            </p>
          </div>

          {/* Dispatch Button */}
          <Button
            size="lg"
            variant="primary"
            onClick={() => setShowConfirmModal(true)}
            disabled={isSending || !title.trim() || !body.trim()}
            className="w-full shadow-warm font-bold text-sm py-3.5 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>إرسال الإشعار التسويقي الآن</span>
          </Button>
        </div>

        {/* Live Device Preview Container */}
        <div className="lg:col-span-5 bg-surface border border-line rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-line/60 pb-3">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-accent" />
              <span>معاينة حية لشاشة هاتف الطالب</span>
            </h3>
            <p className="text-xs text-ink-soft">
              هكذا سيظهر الإشعار المنبثق تماماً على قفل شاشة المستخدم.
            </p>
          </div>

          {/* Mock Smartphone Screen */}
          <div className="w-full max-w-[280px] mx-auto bg-[#181512] rounded-[38px] p-3 shadow-2xl border-4 border-[#3E372E] text-white select-none">
            {/* Phone Top Notch / Speaker */}
            <div className="w-20 h-4 bg-[#241F1A] rounded-full mx-auto mb-3 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-black/50" />
            </div>

            {/* Lock Screen Clock */}
            <div className="text-center my-3">
              <span className="font-mono text-3xl font-black tracking-tight text-white/90">
                11:45
              </span>
              <p className="text-[10px] text-white/50 font-medium">الأربعاء، ٢٣ سبتمبر</p>
            </div>

            {/* Notification Card on Lock Screen */}
            <div className="bg-white/90 backdrop-blur-md text-[#181512] rounded-2xl p-3 shadow-lg border border-white/40 text-right mt-4 transition-all">
              {/* Header row */}
              <div className="flex items-center justify-between text-[10px] text-[#3E372E] mb-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <div className="w-4 h-4 rounded bg-[#E8992A] text-white flex items-center justify-center text-[9px] font-black">
                    F
                  </div>
                  <span>FastOrder</span>
                </div>
                <span className="text-[9px] opacity-75 font-mono">الآن</span>
              </div>

              {/* Title & Body */}
              <p className="font-bold text-xs text-[#181512] leading-snug line-clamp-1">
                {title.trim() || 'عنوان الإشعار التسويقي يظهر هنا'}
              </p>
              <p className="text-[11px] text-[#3E372E] leading-relaxed mt-0.5 line-clamp-3">
                {body.trim() || 'اكتب نص رسالتك في الحقل المقابل لتشاهد كيف تظهر للطلاب في هواتفهم الذكية.'}
              </p>
            </div>

            {/* Phone Home Indicator bar */}
            <div className="w-24 h-1 bg-white/30 rounded-full mx-auto mt-8 mb-1" />
          </div>

          {/* Target Specs Summary */}
          <div className="p-3 bg-canvas rounded-2xl border border-line text-xs space-y-1">
            <span className="font-bold text-ink block">ملخص الإرسال:</span>
            <p className="text-ink-soft">
              <strong>المستهدف:</strong> {getTargetSummary()}
            </p>
            <p className="text-ink-soft">
              <strong>القنوات:</strong> تطبيق أندرويد + متصفحات الويب + الزوار
            </p>
          </div>
        </div>
      </div>

      {/* 4. Campaigns Archive & History Table */}
      <div className="bg-surface border border-line rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-line/60 pb-3">
          <div>
            <h2 className="font-display font-bold text-lg text-ink flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>سجل الحملات والإشعارات السابقة</span>
            </h2>
            <p className="text-xs text-ink-soft">
              أرشيف كامل لجميع الإشعارات التسويقية المرسلة وإحصائيات التسليم.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-ink-soft bg-canvas px-3 py-1 rounded-full border border-line">
            {campaigns.length} حملة
          </span>
        </div>

        {isLoadingHistory ? (
          <div className="py-8 text-center text-xs text-ink-soft font-semibold">
            جاري تحميل سجل الإشعارات...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-8 text-center text-xs sm:text-sm text-ink-soft space-y-1">
            <p className="font-bold text-ink">لا توجد حملات مرسلة حتى الآن</p>
            <p>يمكنك استخدام النموذج أعلاه لبدء إرسال أول إشعار تسويقي للطلاب.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-line/60 text-ink-soft font-bold">
                  <th className="py-3 px-3">التاريخ والوقت</th>
                  <th className="py-3 px-3">عنوان الإشعار</th>
                  <th className="py-3 px-3">الفئة المستهدفة</th>
                  <th className="py-3 px-3 text-center">أجهزة استلمت</th>
                  <th className="py-3 px-3">المشرف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap text-ink-soft font-mono">
                      {formatRelativeArabic(camp.createdAt)}
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <p className="font-bold text-ink line-clamp-1">{camp.title}</p>
                      <p className="text-[11px] text-ink-soft line-clamp-1">{camp.body}</p>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-canvas border border-line text-ink">
                        {camp.targetType === 'all'
                          ? 'عام للجميع'
                          : camp.targetType === 'single_user'
                          ? 'طالب محدد'
                          : camp.targetValue || camp.targetType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono font-bold text-accent">
                      {camp.sentCount} جهاز
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-ink-soft">
                      {camp.creatorName || 'الإدارة'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-line rounded-3xl p-6 max-w-md w-full shadow-floating text-right space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-ink">
                  تأكيد إرسال الإشعار
                </h3>
                <p className="text-xs text-ink-soft">
                  هل أنت متأكد من رغبتك في إرسال هذا الإشعار الآن؟
                </p>
              </div>
            </div>

            <div className="p-3 bg-canvas rounded-2xl border border-line text-xs space-y-1.5">
              <p>
                <strong>العنوان:</strong> {title}
              </p>
              <p>
                <strong>المستهدف:</strong> {getTargetSummary()}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleSendSubmit}
                isLoading={isSending}
                className="flex-1 font-bold shadow-warm"
              >
                تأكيد الإرسال الآن
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSending}
                className="bg-canvas border border-line font-bold"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
