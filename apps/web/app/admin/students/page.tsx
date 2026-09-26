'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStudentStore } from '@/stores/useStudentStore';
import { AccountStatus } from '@/types';
import { ACCOUNT_STATUS_DETAILS, COLLEGES_BY_UNIVERSITY } from '@/lib/constants';
import { SearchInput } from '@/components/ui/SearchInput';
import { Avatar } from '@/components/ui/Avatar';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  ShieldX,
  Phone,
  Mail,
  GraduationCap,
  Filter,
  X,
  ArrowUpDown,
  Building2,
  AlertOctagon,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminStudentsPage() {
  const { students, isLoading, fetchStudents, updateStudentStatus } = useStudentStore();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState<'all' | 'sphinx' | 'assiut_ahleya'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | AccountStatus>('all');
  const [selectedCollege, setSelectedCollege] = useState<string>('all');
  const [selectedViolationFilter, setSelectedViolationFilter] = useState<'all' | 'clean' | 'has_violations' | 'frequent_violators'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'violations_desc' | 'name_asc'>('newest');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents(selectedUniversity === 'all' ? undefined : selectedUniversity);
  }, [fetchStudents, selectedUniversity]);

  // Extract all unique colleges from both registered students and official lists
  const availableColleges = useMemo(() => {
    const fromConstants =
      selectedUniversity === 'all'
        ? [...COLLEGES_BY_UNIVERSITY.sphinx, ...COLLEGES_BY_UNIVERSITY.assiut_ahleya]
        : COLLEGES_BY_UNIVERSITY[selectedUniversity] || [];

    const fromStudents = students
      .map((s) => s.college)
      .filter((c): c is string => Boolean(c && c.trim()));

    const unique = Array.from(new Set([...fromConstants, ...fromStudents]));
    return unique.sort((a, b) => a.localeCompare(b, 'ar'));
  }, [students, selectedUniversity]);

  // Quick statistics counts
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.status === 'active').length;
    const warning = students.filter((s) => s.status === 'warning').length;
    const restricted = students.filter((s) => s.status === 'restricted').length;
    const violators = students.filter((s) => (s.noShowCount || 0) > 0).length;
    return { total, active, warning, restricted, violators };
  }, [students]);

  // Filtering & Sorting Logic
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        // University filter
        if (selectedUniversity !== 'all' && s.university && s.university !== selectedUniversity) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'all' && s.status !== selectedStatus) {
          return false;
        }

        // College filter
        if (selectedCollege !== 'all' && s.college !== selectedCollege) {
          return false;
        }

        // Violation filter
        const noShow = s.noShowCount || 0;
        if (selectedViolationFilter === 'clean' && noShow > 0) return false;
        if (selectedViolationFilter === 'has_violations' && noShow === 0) return false;
        if (selectedViolationFilter === 'frequent_violators' && noShow < 3) return false;

        // Search query
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.universityId.toLowerCase().includes(q) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          (s.college && s.college.toLowerCase().includes(q)) ||
          (s.phone && s.phone.includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'violations_desc') {
          return (b.noShowCount || 0) - (a.noShowCount || 0);
        }
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name, 'ar');
        }
        // default: newest first
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [students, selectedUniversity, selectedStatus, selectedCollege, selectedViolationFilter, searchQuery, sortBy]);

  const hasActiveFilters =
    selectedUniversity !== 'all' ||
    selectedStatus !== 'all' ||
    selectedCollege !== 'all' ||
    selectedViolationFilter !== 'all' ||
    searchQuery !== '' ||
    sortBy !== 'newest';

  const resetAllFilters = () => {
    setSelectedUniversity('all');
    setSelectedStatus('all');
    setSelectedCollege('all');
    setSelectedViolationFilter('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  const handleStatusChange = (studentId: string, studentName: string, newStatus: AccountStatus) => {
    updateStudentStatus(studentId, newStatus);
    const label = ACCOUNT_STATUS_DETAILS[newStatus]?.label || newStatus;
    setToastMessage(`تم تغيير حالة الطالب "${studentName}" إلى: ${label}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line/60">
        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
            إدارة وتصنيف حسابات الطلاب
          </h2>
          <p className="font-body text-xs text-ink-soft mt-0.5">
            {students.length} طالب مسجل · فلترة دقيقة حسب الكلية، الجامعة، السلوك وحالة الحساب
          </p>
        </div>

        {/* University Fast Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-surface border border-line p-1 rounded-2xl self-start sm:self-auto select-none">
          <button
            type="button"
            onClick={() => setSelectedUniversity('all')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-body font-bold transition-all',
              selectedUniversity === 'all'
                ? 'bg-ink text-white shadow-xs'
                : 'text-ink-soft hover:text-ink'
            )}
          >
            كل الجامعات
          </button>
          <button
            type="button"
            onClick={() => setSelectedUniversity('sphinx')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-body font-bold transition-all',
              selectedUniversity === 'sphinx'
                ? 'bg-ink text-white shadow-xs'
                : 'text-ink-soft hover:text-ink'
            )}
          >
            سفنكس
          </button>
          <button
            type="button"
            onClick={() => setSelectedUniversity('assiut_ahleya')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-body font-bold transition-all',
              selectedUniversity === 'assiut_ahleya'
                ? 'bg-ink text-white shadow-xs'
                : 'text-ink-soft hover:text-ink'
            )}
          >
            أسيوط الأهلية
          </button>
        </div>
      </div>

      {/* Interactive Quick Classification Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 select-none">
        {/* Total Students */}
        <button
          type="button"
          onClick={() => {
            setSelectedStatus('all');
            setSelectedViolationFilter('all');
          }}
          className={cn(
            'p-3 rounded-2xl border text-right transition-all hover:scale-[1.02]',
            selectedStatus === 'all' && selectedViolationFilter === 'all'
              ? 'bg-ink text-white border-ink shadow-sm ring-2 ring-ink/20'
              : 'bg-surface text-ink border-line hover:border-ink/40 shadow-xs'
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-body font-bold opacity-80">إجمالي الطلاب</span>
            <Users className="w-4 h-4 opacity-70" />
          </div>
          <span className="font-mono text-xl font-black block">{stats.total}</span>
        </button>

        {/* Active Accounts */}
        <button
          type="button"
          onClick={() => {
            setSelectedStatus('active');
            setSelectedViolationFilter('all');
          }}
          className={cn(
            'p-3 rounded-2xl border text-right transition-all hover:scale-[1.02]',
            selectedStatus === 'active' && selectedViolationFilter === 'all'
              ? 'bg-accent text-white border-accent shadow-sm ring-2 ring-accent/20'
              : 'bg-surface text-ink border-line hover:border-accent/40 shadow-xs'
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-body font-bold opacity-80">نشط تماماً</span>
            <CheckCircle2 className="w-4 h-4 text-accent" />
          </div>
          <span className="font-mono text-xl font-black text-accent block">{stats.active}</span>
        </button>

        {/* Warning Accounts */}
        <button
          type="button"
          onClick={() => {
            setSelectedStatus('warning');
            setSelectedViolationFilter('all');
          }}
          className={cn(
            'p-3 rounded-2xl border text-right transition-all hover:scale-[1.02]',
            selectedStatus === 'warning' && selectedViolationFilter === 'all'
              ? 'bg-primary text-primary-ink border-primary shadow-sm ring-2 ring-primary/20'
              : 'bg-surface text-ink border-line hover:border-primary/40 shadow-xs'
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-body font-bold opacity-80">تحذير</span>
            <AlertTriangle className="w-4 h-4 text-primary-ink" />
          </div>
          <span className="font-mono text-xl font-black text-primary-ink block">{stats.warning}</span>
        </button>

        {/* Restricted Accounts */}
        <button
          type="button"
          onClick={() => {
            setSelectedStatus('restricted');
            setSelectedViolationFilter('all');
          }}
          className={cn(
            'p-3 rounded-2xl border text-right transition-all hover:scale-[1.02]',
            selectedStatus === 'restricted' && selectedViolationFilter === 'all'
              ? 'bg-danger text-white border-danger shadow-sm ring-2 ring-danger/20'
              : 'bg-surface text-ink border-line hover:border-danger/40 shadow-xs'
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-body font-bold opacity-80">حظر / تقييد</span>
            <ShieldX className="w-4 h-4 text-danger" />
          </div>
          <span className="font-mono text-xl font-black text-danger block">{stats.restricted}</span>
        </button>

        {/* Violators (No-Show > 0) */}
        <button
          type="button"
          onClick={() => {
            setSelectedStatus('all');
            setSelectedViolationFilter('has_violations');
          }}
          className={cn(
            'p-3 rounded-2xl border text-right transition-all hover:scale-[1.02] col-span-2 sm:col-span-1',
            selectedViolationFilter === 'has_violations'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-600/20'
              : 'bg-surface text-ink border-line hover:border-purple-500/40 shadow-xs'
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-body font-bold opacity-80">عدم استلام (1+)</span>
            <AlertOctagon className="w-4 h-4 text-purple-600" />
          </div>
          <span className="font-mono text-xl font-black text-purple-700 block">{stats.violators}</span>
        </button>
      </div>

      {/* Main Filter & Search Control Panel */}
      <div className="bg-surface border border-line/80 rounded-2xl sm:rounded-3xl p-4 shadow-warm space-y-3.5">
        {/* Top Search & Toggle Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="ابحث بالاسم، الرقم الجامعي، الكلية، الهاتف، أو الإيميل..."
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Filters Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className={cn(
                'sm:hidden flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-body font-bold transition-colors',
                isMobileFiltersOpen || hasActiveFilters
                  ? 'bg-primary-soft text-primary-ink border-primary/40'
                  : 'bg-canvas text-ink border-line'
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>فلاتر وتصنيفات متقدمة</span>
              <ChevronDown
                className={cn('w-3.5 h-3.5 transition-transform', isMobileFiltersOpen && 'rotate-180')}
              />
            </button>

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-body font-bold text-danger hover:bg-danger-soft transition-colors border border-danger/20 whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5" />
                <span>مسح الفلاتر</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Dropdown / Expandable Controls (Always visible on desktop, toggleable on mobile) */}
        <div
          className={cn(
            'grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-line/60',
            !isMobileFiltersOpen && 'hidden sm:grid'
          )}
        >
          {/* 1. College / Faculty Selector */}
          <div>
            <label className="block text-[11px] font-body font-bold text-ink-soft mb-1.5">
              التصنيف حسب الكلية:
            </label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs font-body text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">كافة الكليات ({availableColleges.length})</option>
              {availableColleges.map((college) => (
                <option key={college} value={college}>
                  {college}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Account Status Filter */}
          <div>
            <label className="block text-[11px] font-body font-bold text-ink-soft mb-1.5">
              حالة الحساب والصلاحية:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs font-body text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">كافة الحالات</option>
              <option value="active">حساب نشط (طبيعي)</option>
              <option value="warning">تحذير (ملاحظات سلوك)</option>
              <option value="restricted">مقيد / محظور من الطلب</option>
            </select>
          </div>

          {/* 3. No-Show Violations Filter */}
          <div>
            <label className="block text-[11px] font-body font-bold text-ink-soft mb-1.5">
              سجل عدم الاستلام (المخالفات):
            </label>
            <select
              value={selectedViolationFilter}
              onChange={(e) => setSelectedViolationFilter(e.target.value as any)}
              className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs font-body text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">كافة الطلاب</option>
              <option value="clean">سجل نظيف (0 عدم استلام)</option>
              <option value="has_violations">لديهم مخالفات (1 فأكثر)</option>
              <option value="frequent_violators">مخالفات متكررة حرجة (3 فأكثر)</option>
            </select>
          </div>

          {/* 4. Sorting Options */}
          <div>
            <label className="block text-[11px] font-body font-bold text-ink-soft mb-1.5">
              ترتيب القائمة حسب:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs font-body text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="newest">الأحدث تسجيلاً</option>
              <option value="violations_desc">الأكثر مخالفات أولاً (عدم الاستلام)</option>
              <option value="name_asc">أبجدياً حسب الاسم (أ - ي)</option>
            </select>
          </div>
        </div>

        {/* Results Counter and Active Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs font-body text-ink-soft">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-ink">النتائج:</span>
            <span>
              عرض <strong className="font-mono text-ink">{filteredStudents.length}</strong> من أصل{' '}
              <strong className="font-mono">{students.length}</strong> طالب
            </span>
          </div>

          {selectedCollege !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-canvas border border-line text-[11px] text-ink font-bold">
              <span>{selectedCollege}</span>
              <button
                type="button"
                onClick={() => setSelectedCollege('all')}
                className="hover:text-danger"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="bg-accent-soft border border-accent/30 text-accent rounded-2xl p-3.5 text-xs font-body font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Students List */}
      <div className="space-y-3.5">
        {filteredStudents.map((student) => {
          const statusConfig = ACCOUNT_STATUS_DETAILS[student.status] || ACCOUNT_STATUS_DETAILS.active;
          const noShow = student.noShowCount || 0;

          return (
            <div
              key={student.id}
              className={cn(
                'bg-surface border rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-warm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all',
                noShow >= 3 ? 'border-danger/40 bg-danger-soft/10' : 'border-line/80'
              )}
            >
              {/* Student Identity & Info */}
              <div className="flex items-start gap-3 sm:gap-4">
                <Avatar name={student.name} size="md" className="flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-bold text-base text-ink">{student.name}</h3>

                    <span className="font-body text-[11px] font-bold text-primary-ink bg-primary-soft px-2 py-0.5 rounded-md border border-primary/20">
                      {student.university === 'assiut_ahleya' ? 'جامعة أسيوط الأهلية' : 'جامعة سفنكس'}
                    </span>

                    <span className="font-mono text-xs font-bold text-ink-soft bg-canvas px-2 py-0.5 rounded-md border border-line">
                      ID: {student.universityId}
                    </span>

                    <span
                      className={`text-[11px] font-body font-bold px-2.5 py-0.5 rounded-full ${statusConfig.badgeClass}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Details Badges */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs font-body text-ink-soft">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-accent" />
                      <span className="font-semibold text-ink">{student.college}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="font-mono text-[11px]">{student.email}</span>
                    </div>

                    {student.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="font-mono text-[11px]">{student.phone}</span>
                      </div>
                    )}

                    {/* No-show counter badge */}
                    <div
                      className={cn(
                        'flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border',
                        noShow === 0
                          ? 'bg-canvas text-ink-soft border-line'
                          : noShow >= 3
                          ? 'bg-danger text-white border-danger animate-pulse'
                          : 'bg-primary-soft text-primary-ink border-primary/30'
                      )}
                    >
                      <span>مرات عدم الاستلام: {noShow}</span>
                      {noShow >= 3 && <span>⚠️</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-1.5 pt-3 md:pt-0 border-t md:border-t-0 border-line/60 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleStatusChange(student.id, student.name, 'active')}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-body font-bold border transition-all active:scale-95',
                    student.status === 'active'
                      ? 'bg-accent text-white border-accent shadow-xs'
                      : 'bg-canvas text-ink-soft border-line hover:bg-accent-soft hover:text-accent'
                  )}
                >
                  حالة نشطة
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange(student.id, student.name, 'warning')}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-body font-bold border transition-all active:scale-95',
                    student.status === 'warning'
                      ? 'bg-primary text-primary-ink border-primary shadow-xs'
                      : 'bg-canvas text-ink-soft border-line hover:bg-primary-soft hover:text-primary-ink'
                  )}
                >
                  تحذير
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange(student.id, student.name, 'restricted')}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-body font-bold border transition-all active:scale-95',
                    student.status === 'restricted'
                      ? 'bg-danger text-white border-danger shadow-xs'
                      : 'bg-canvas text-ink-soft border-line hover:bg-danger-soft hover:text-danger'
                  )}
                >
                  حظر / تقييد
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <div className="bg-surface border border-line rounded-3xl p-10 text-center space-y-3 shadow-warm">
            <Users className="w-12 h-12 text-ink-soft mx-auto opacity-30" />
            <h3 className="font-display font-bold text-base text-ink">
              لا توجد حسابات طلاب تطابق معايير الفلترة الحالية
            </h3>
            <p className="font-body text-xs text-ink-soft max-w-md mx-auto">
              جرب تغيير الكلية أو حالة الحساب أو مسح مصطلح البحث لعرض باقي الطلاب.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-ink text-xs font-body font-bold shadow-xs hover:opacity-95 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
                <span>إعادة ضبط جميع الفلاتر</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
