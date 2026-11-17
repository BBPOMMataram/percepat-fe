"use client";

import {
  FileSpreadsheet,
  Flame,
  ShieldAlert,
  Building2,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";
import type { OverviewData } from "../types";
import { RiskStatCard } from "../cards/risk-stat-card";

interface OverviewCardsProps {
  overview: OverviewData | null;
  loading: boolean;
  onFilterResidualHigh: () => void;
  onFilterInherentHigh: () => void;
  onOpenDataQuality: () => void;
}

export function OverviewCards({
  overview,
  loading,
  onFilterResidualHigh,
  onFilterInherentHigh,
  onOpenDataQuality,
}: OverviewCardsProps) {
  const highMin = overview?.period?.high_risk_min_level ?? 16;

  if (loading && !overview) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 rounded-2xl border border-slate-200 bg-white animate-pulse p-4"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <RiskStatCard
        title="Total Baris Risiko"
        value={overview?.total_records ?? 0}
        subtitle={`${overview?.unique_risk_codes ?? 0} kode unik · ${
          overview?.duplicate_candidates ?? 0
        } kandidat kode ganda`}
        icon={FileSpreadsheet}
        tone="blue"
      />

      <RiskStatCard
        title={`Tinggi Inheren (≥${highMin})`}
        value={overview?.inherent_high ?? 0}
        subtitle="Klik untuk filter risiko inheren tinggi"
        icon={Flame}
        tone="orange"
        onClick={onFilterInherentHigh}
      />

      <RiskStatCard
        title={`Tinggi Residual (≥${highMin})`}
        value={overview?.residual_high ?? 0}
        subtitle="Klik untuk filter prioritas residual tinggi"
        icon={ShieldAlert}
        tone="red"
        onClick={onFilterResidualHigh}
      />

      <RiskStatCard
        title="Fungsi & Kategori"
        value={`${overview?.functions_count ?? 0} / ${overview?.categories_count ?? 0}`}
        subtitle="Jumlah fungsi & kategori risiko terpetakan"
        icon={Building2}
        tone="slate"
      />

      <RiskStatCard
        title="Temuan Kualitas Data"
        value={overview?.data_quality_issues ?? 0}
        subtitle={`${overview?.error_issues_count ?? 0} error · ${
          overview?.warning_issues_count ?? 0
        } warning (klik lihat detail)`}
        icon={AlertTriangle}
        tone="amber"
        onClick={onOpenDataQuality}
      />

      <RiskStatCard
        title="RTP & Risiko Positif"
        value={`${overview?.rtp_count ?? 0} / ${overview?.positive_risks_count ?? 0}`}
        subtitle="Rencana tindak pengendalian & peluang positif"
        icon={ClipboardCheck}
        tone="green"
      />
    </div>
  );
}
