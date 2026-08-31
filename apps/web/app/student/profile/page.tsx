'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ACCOUNT_STATUS_DETAILS } from '@/lib/constants';
import {
  Clock,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  ShieldX,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { AccountStatus } from '@/types';

export default function StudentProfilePage() {
  const router = useRouter();
  const { student, studentStatus, setStudentStatus, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const statusConfig = ACCOUNT_STATUS_DETAILS[studentStatus] || ACCOUNT_STATUS_DETAILS.active;

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Profile Header matching visual reference */}
      <div className="flex flex-col items-center text-center pt-2">
        <Avatar name={student.name} size="lg" className="mb-3" />
        <h3 className="font-body font-bold text-lg text-ink mb-0.5">
          {student.name}
        </h3>
        <p className="font-body text-xs text-ink-soft mb-3">
          {student.college}
        </p>

        {/* Status Badge matching reference (حالتك تمام / تحذير / مقيد) */}
        <div
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-body font-bold transition-colors ${
            studentStatus === 'active'
              ? 'bg-accent-soft text-accent'
              : studentStatus === 'warning'
              ? 'bg-primary-soft text-primary-ink'
              : 'bg-danger-soft text-danger'
          }`}
        >
          {studentStatus === 'active' && <CheckCircle2 className="w-3.5 h-3.5" />}
          {studentStatus === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
          {studentStatus === 'restricted' && <ShieldX className="w-3.5 h-3.5" />}
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {/* Profile Navigation Rows matching design reference */}
      <div className="bg-surface border border-line/80 rounded-3xl p-2 shadow-warm divide-y divide-line/60">
        <Link
          href="/student/orders"
          className="flex items-center justify-between p-3.5 hover:bg-canvas rounded-2xl transition-colors select-none"
        >
          <div className="flex items-center gap-3 text-sm font-body font-medium text-ink">
            <Clock className="w-4 h-4 text-ink-soft" />
            <span>طلباتي السابقة</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-ink-soft" />
        </Link>

        <Link
          href="/student/notifications"
          className="flex items-center justify-between p-3.5 hover:bg-canvas rounded-2xl transition-colors select-none"
        >
          <div className="flex items-center gap-3 text-sm font-body font-medium text-ink">
            <Bell className="w-4 h-4 text-ink-soft" />
            <span>الإشعارات</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-ink-soft" />
        </Link>

        <Link
          href="/student/settings"
          className="flex items-center justify-between p-3.5 hover:bg-canvas rounded-2xl transition-colors select-none"
        >
          <div className="flex items-center gap-3 text-sm font-body font-medium text-ink">
            <Settings className="w-4 h-4 text-ink-soft" />
            <span>إعدادات الحساب</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-ink-soft" />
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-3.5 hover:bg-danger-soft/60 rounded-2xl transition-colors text-right select-none"
        >
          <div className="flex items-center gap-3 text-sm font-body font-bold text-danger">
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </div>
        </button>
      </div>

      {/* Interactive Account Status Simulator (For review & testing purposes) */}
      <div className="bg-canvas border border-line rounded-2xl p-4 space-y-2.5 text-right">
        <div className="flex items-center justify-between">
          <span className="text-xs font-body font-bold text-ink">
            محاكاة حالة الحساب (للاختبار)
          </span>
          <span className="text-[10px] font-mono text-ink-soft bg-surface px-2 py-0.5 rounded border border-line">
            Demo Tool
          </span>
        </div>
        <p className="text-[11px] font-body text-ink-soft">
          اختر حالة الطالب لاختبار ظهور تحذيرات عدم الاستلام وتقييد الحساب:
        </p>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setStudentStatus('active')}
            className={`py-1.5 px-2 rounded-xl text-xs font-body font-bold border transition-all ${
              studentStatus === 'active'
                ? 'bg-accent text-white border-accent'
                : 'bg-surface text-ink-soft border-line'
            }`}
          >
            حالتك تمام
          </button>
          <button
            type="button"
            onClick={() => setStudentStatus('warning')}
            className={`py-1.5 px-2 rounded-xl text-xs font-body font-bold border transition-all ${
              studentStatus === 'warning'
                ? 'bg-primary text-primary-ink border-primary'
                : 'bg-surface text-ink-soft border-line'
            }`}
          >
            تحذير
          </button>
          <button
            type="button"
            onClick={() => setStudentStatus('restricted')}
            className={`py-1.5 px-2 rounded-xl text-xs font-body font-bold border transition-all ${
              studentStatus === 'restricted'
                ? 'bg-danger text-white border-danger'
                : 'bg-surface text-ink-soft border-line'
            }`}
          >
            حساب مقيد
          </button>
        </div>
      </div>
    </div>
  );
}
