'use client';

import React, { useState } from 'react';
import { useStudentStore } from '@/stores/useStudentStore';
import { AccountStatus } from '@/types';
import { ACCOUNT_STATUS_DETAILS } from '@/lib/constants';
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
} from 'lucide-react';

export default function AdminStudentsPage() {
  const { students, updateStudentStatus } = useStudentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.universityId.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.college.toLowerCase().includes(q)
    );
  });

  const handleStatusChange = (studentId: string, studentName: string, newStatus: AccountStatus) => {
    updateStudentStatus(studentId, newStatus);
    const label = ACCOUNT_STATUS_DETAILS[newStatus]?.label || newStatus;
    setToastMessage(`تم تغيير حالة الطالب "${studentName}" إلى: ${label}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line/60">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink">
            إدارة حسابات الطلاب
          </h2>
          <p className="font-body text-xs text-ink-soft mt-0.5">
            {students.length} طالب مسجل · متابعة حالات عدم الحضور وتعديل الصلاحيات
          </p>
        </div>

        <div className="w-full sm:w-64">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="بحث بالاسم أو الرقم الجامعي..."
          />
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="bg-accent-soft border border-accent/30 text-accent rounded-2xl p-3.5 text-xs font-body font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Students List */}
      <div className="space-y-3.5">
        {filteredStudents.map((student) => {
          const statusConfig = ACCOUNT_STATUS_DETAILS[student.status] || ACCOUNT_STATUS_DETAILS.active;

          return (
            <div
              key={student.id}
              className="bg-surface border border-line/80 rounded-3xl p-5 shadow-warm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Student Identity & Info */}
              <div className="flex items-start gap-3.5">
                <Avatar name={student.name} size="md" className="flex-shrink-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-bold text-base text-ink">
                      {student.name}
                    </h3>
                    <span className="font-mono text-xs font-bold text-ink-soft bg-canvas px-2 py-0.5 rounded-md border border-line">
                      ID: {student.universityId}
                    </span>
                    <span
                      className={`text-[11px] font-body font-bold px-2.5 py-0.5 rounded-full ${statusConfig.badgeClass}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs font-body text-ink-soft">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{student.college}</span>
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

                    <div className="flex items-center gap-1 text-primary-ink font-semibold">
                      <span>مرات عدم الاستلام: {student.noShowCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-1.5 pt-3 md:pt-0 border-t md:border-t-0 border-line/60 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleStatusChange(student.id, student.name, 'active')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-body font-bold border transition-all ${
                    student.status === 'active'
                      ? 'bg-accent text-white border-accent shadow-sm'
                      : 'bg-canvas text-ink-soft border-line hover:bg-accent-soft hover:text-accent'
                  }`}
                >
                  حالة نشطة
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange(student.id, student.name, 'warning')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-body font-bold border transition-all ${
                    student.status === 'warning'
                      ? 'bg-primary text-primary-ink border-primary shadow-sm'
                      : 'bg-canvas text-ink-soft border-line hover:bg-primary-soft hover:text-primary-ink'
                  }`}
                >
                  تحذير
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange(student.id, student.name, 'restricted')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-body font-bold border transition-all ${
                    student.status === 'restricted'
                      ? 'bg-danger text-white border-danger shadow-sm'
                      : 'bg-canvas text-ink-soft border-line hover:bg-danger-soft hover:text-danger'
                  }`}
                >
                  حظر / تقييد
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
