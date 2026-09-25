'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Plus, Calendar, Award, Users, ChevronDown, Clock, Check, X } from 'lucide-react';
import { leagueService, type LeagueSeason } from '@/lib/services/leagueService';

export default function AdminLeaguePage() {
  const [seasons, setSeasons] = useState<LeagueSeason[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPrizeForm, setShowPrizeForm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create season form state
  const [newSeason, setNewSeason] = useState({
    name: '',
    startsAt: '',
    endsAt: '',
    tier1MaxPiasters: 10000,
    tier2MaxPiasters: 20000,
    firstOrderPoints: 5,
    minOrdersForPrize: 5,
    maxPointsOrdersPerDay: 3,
  });

  // Create prize form state
  const [newPrize, setNewPrize] = useState({
    rank: 1,
    description: '',
  });

  const fetchSeasons = async () => {
    setIsLoading(true);
    try {
      const data = await leagueService.getAllSeasons();
      setSeasons(data);
    } catch (err) {
      console.error('Failed to fetch seasons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, []);

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create');
    try {
      await leagueService.createSeason(newSeason);
      setShowCreateForm(false);
      setNewSeason({
        name: '',
        startsAt: '',
        endsAt: '',
        tier1MaxPiasters: 10000,
        tier2MaxPiasters: 20000,
        firstOrderPoints: 5,
        minOrdersForPrize: 5,
        maxPointsOrdersPerDay: 3,
      });
      await fetchSeasons();
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء الموسم');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndSeason = async (seasonId: string) => {
    if (!confirm('هل أنت متأكد من إنهاء هذا الموسم؟ سيتم تجميد الترتيب.')) return;
    setActionLoading(seasonId);
    try {
      await leagueService.endSeason(seasonId);
      await fetchSeasons();
    } catch (err: any) {
      alert(err.message || 'فشل إنهاء الموسم');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreatePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPrizeForm) return;
    setActionLoading('prize');
    try {
      await leagueService.createPrize({
        seasonId: showPrizeForm,
        rank: newPrize.rank,
        description: newPrize.description,
      });
      setShowPrizeForm(null);
      setNewPrize({ rank: 1, description: '' });
      alert('تم إضافة الجائزة بنجاح');
    } catch (err: any) {
      alert(err.message || 'فشل إضافة الجائزة');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'upcoming': return 'قادم';
      case 'ended': return 'منتهي';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-accent-soft text-accent';
      case 'upcoming': return 'bg-primary-soft text-primary-ink';
      case 'ended': return 'bg-canvas text-ink-soft';
      default: return 'bg-canvas text-ink-soft';
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="pb-3 border-b border-line/60 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-ink flex items-center justify-center shadow-sm">
            <Trophy className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-ink">
              إدارة FastOrder League
            </h2>
            <p className="font-body text-xs text-ink-soft mt-0.5">
              إدارة مواسم FastOrder League والجوائز ومتابعة سجل النقاط
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1.5 bg-primary text-primary-ink px-4 py-2.5 rounded-xl text-sm font-body font-bold hover:bg-primary-hover transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          موسم جديد
        </button>
      </div>

      {/* Create Season Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateSeason} className="bg-surface border border-line/80 rounded-2xl sm:rounded-3xl p-5 space-y-4 shadow-warm">
          <h3 className="font-display font-bold text-lg text-ink">إنشاء موسم جديد في الدوري</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-ink-soft block mb-1">اسم الموسم</label>
              <input
                type="text"
                value={newSeason.name}
                onChange={(e) => setNewSeason({ ...newSeason, name: e.target.value })}
                placeholder="مثال: موسم أكتوبر 2026"
                className="w-full px-3 py-2 border border-line rounded-xl text-sm font-body bg-canvas focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="font-body text-xs text-ink-soft block mb-1">الحد الأدنى للتأهل (طلبات)</label>
              <input
                type="number"
                value={newSeason.minOrdersForPrize}
                onChange={(e) => setNewSeason({ ...newSeason, minOrdersForPrize: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-line rounded-xl text-sm font-body bg-canvas focus:border-primary focus:outline-none"
                min={1}
              />
            </div>
            <div>
              <label className="font-body text-xs text-ink-soft block mb-1">بداية الموسم</label>
              <input
                type="datetime-local"
                value={newSeason.startsAt}
                onChange={(e) => setNewSeason({ ...newSeason, startsAt: e.target.value })}
                className="w-full px-3 py-2 border border-line rounded-xl text-sm font-body bg-canvas focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="font-body text-xs text-ink-soft block mb-1">نهاية الموسم</label>
              <input
                type="datetime-local"
                value={newSeason.endsAt}
                onChange={(e) => setNewSeason({ ...newSeason, endsAt: e.target.value })}
                className="w-full px-3 py-2 border border-line rounded-xl text-sm font-body bg-canvas focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="font-body text-xs text-ink-soft block mb-1">نقاط أول أوردر</label>
              <input
                type="number"
                value={newSeason.firstOrderPoints}
                onChange={(e) => setNewSeason({ ...newSeason, firstOrderPoints: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-line rounded-xl text-sm font-body bg-canvas focus:border-primary focus:outline-none"
                min={1}
              />
            </div>
            <div>
              <label className="font-body text-xs text-ink-soft block mb-1">حد الأوردرات اليومي</label>
              <input
                type="number"
                value={newSeason.maxPointsOrdersPerDay}
                onChange={(e) => setNewSeason({ ...newSeason, maxPointsOrdersPerDay: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-line rounded-xl text-sm font-body bg-canvas focus:border-primary focus:outline-none"
                min={1}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={actionLoading === 'create'}
              className="bg-primary text-primary-ink px-5 py-2 rounded-xl text-sm font-body font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {actionLoading === 'create' ? 'جاري الإنشاء...' : 'إنشاء الموسم'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-body text-ink-soft hover:text-ink hover:bg-canvas transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Create Prize Form */}
      {showPrizeForm && (
        <form onSubmit={handleCreatePrize} className="bg-surface border border-line/50 rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-bold text-lg text-ink">إضافة جائزة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-ink-soft block mb-1">المركز</label>
              <select
                value={newPrize.rank}
                onChange={(e) => setNewPrize({ ...newPrize, rank: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-line rounded-xl text-sm font-body bg-canvas focus:border-primary focus:outline-none"
              >
                <option value={1}>المركز الأول</option>
                <option value={2}>المركز الثاني</option>
                <option value={3}>المركز الثالث</option>
              </select>
            </div>
            <div>
              <label className="font-body text-xs text-ink-soft block mb-1">وصف الجائزة</label>
              <input
                type="text"
                value={newPrize.description}
                onChange={(e) => setNewPrize({ ...newPrize, description: e.target.value })}
                placeholder="مثال: وجبة مجانية من كشك فيستيفال لاند"
                className="w-full px-3 py-2 border border-line rounded-xl text-sm font-body bg-canvas focus:border-primary focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={actionLoading === 'prize'}
              className="bg-primary text-primary-ink px-5 py-2 rounded-xl text-sm font-body font-bold hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {actionLoading === 'prize' ? 'جاري الإضافة...' : 'إضافة الجائزة'}
            </button>
            <button
              type="button"
              onClick={() => setShowPrizeForm(null)}
              className="px-4 py-2 rounded-xl text-sm font-body text-ink-soft hover:text-ink hover:bg-canvas transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Seasons List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface border border-line/30 rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-line/30" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-line/30 rounded w-32" />
                  <div className="h-2 bg-line/20 rounded w-48" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : seasons.length === 0 ? (
        <div className="bg-surface border border-line/50 rounded-2xl p-8 text-center">
          <Calendar className="w-10 h-10 text-line mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-ink mb-1">لا توجد مواسم</h3>
          <p className="font-body text-sm text-ink-soft">أنشئ أول موسم للدوري لتبدأ المنافسة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {seasons.map((season) => (
            <div key={season.id} className="bg-surface border border-line/50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-base text-ink">{season.name}</h3>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-body font-semibold ${getStatusColor(season.status)}`}>
                        {getStatusLabel(season.status)}
                      </span>
                    </div>
                    <p className="font-body text-xs text-ink-soft mt-0.5">
                      {new Date(season.startsAt).toLocaleDateString('ar-EG')} — {new Date(season.endsAt).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {season.status === 'active' && (
                    <button
                      onClick={() => handleEndSeason(season.id)}
                      disabled={actionLoading === season.id}
                      className="flex items-center gap-1 text-xs font-body font-bold text-danger bg-danger-soft px-3 py-1.5 rounded-xl hover:bg-danger hover:text-white transition-colors disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                      إنهاء
                    </button>
                  )}
                  <button
                    onClick={() => setShowPrizeForm(showPrizeForm === season.id ? null : season.id)}
                    className="flex items-center gap-1 text-xs font-body font-bold text-primary-ink bg-primary-soft px-3 py-1.5 rounded-xl hover:bg-primary hover:text-primary-ink transition-colors"
                  >
                    <Award className="w-3 h-3" />
                    جائزة
                  </button>
                </div>
              </div>

              {/* Season Config Details */}
              <div className="grid grid-cols-3 gap-2 text-xs font-body text-ink-soft">
                <div className="bg-canvas rounded-lg px-2 py-1.5 text-center">
                  <p className="font-bold text-ink">{season.firstOrderPoints}</p>
                  <p>نقاط أول أوردر</p>
                </div>
                <div className="bg-canvas rounded-lg px-2 py-1.5 text-center">
                  <p className="font-bold text-ink">{season.minOrdersForPrize}</p>
                  <p>حد التأهل</p>
                </div>
                <div className="bg-canvas rounded-lg px-2 py-1.5 text-center">
                  <p className="font-bold text-ink">{(season.tier1MaxPiasters / 100).toFixed(0)} ج.م</p>
                  <p>فئة 1 نقطة</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
