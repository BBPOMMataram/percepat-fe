"use client";

import React from "react";
import type { FormFieldOption, FormFieldSchema } from "../types";

interface DynamicFieldRendererProps {
  field: FormFieldSchema;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  error?: string;
  disabled?: boolean;
  calculatedLevels?: {
    inherentLevel?: number;
    residualLevel?: number;
  };
}

export function getRiskLevelBadge(level: number | null | undefined) {
  if (level === null || level === undefined || isNaN(level)) {
    return { text: "Belum Dinilai", bg: "bg-slate-100 text-slate-600 border-slate-300" };
  }
  if (level >= 16) {
    return { text: `Tinggi (${level})`, bg: "bg-red-50 text-red-700 border-red-300 font-bold" };
  }
  if (level >= 10) {
    return { text: `Sedang (${level})`, bg: "bg-amber-50 text-amber-700 border-amber-300 font-semibold" };
  }
  return { text: `Rendah (${level})`, bg: "bg-emerald-50 text-emerald-700 border-emerald-300 font-medium" };
}

export default function DynamicFieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled = false,
  calculatedLevels,
}: DynamicFieldRendererProps) {
  const isReadOnly = !field.is_editable || field.input_type === "readonly_calculated" || disabled;

  // Render Readonly Calculated (Inherent / Residual Level)
  if (field.input_type === "readonly_calculated") {
    let displayNum: number | null = null;
    if (field.field_key === "inherent_level" && calculatedLevels?.inherentLevel !== undefined) {
      displayNum = calculatedLevels.inherentLevel;
    } else if (field.field_key === "residual_level" && calculatedLevels?.residualLevel !== undefined) {
      displayNum = calculatedLevels.residualLevel;
    } else if (typeof value === "number") {
      displayNum = value;
    }

    const badge = getRiskLevelBadge(displayNum);

    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700">
          {field.display_label}
          {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <span className="font-mono text-base font-bold text-slate-800">
            {displayNum !== null ? displayNum : "—"}
          </span>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${badge.bg}`}>
            {badge.text}
          </span>
          <span className="text-[11px] text-slate-500 ml-auto italic">Otomatis dari Matriks 5x5</span>
        </div>
        {field.help_text && <p className="text-[11px] text-slate-500">{field.help_text}</p>}
      </div>
    );
  }

  // Render Textarea
  if (field.input_type === "textarea") {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700" htmlFor={field.field_key}>
          {field.display_label}
          {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <textarea
          id={field.field_key}
          name={field.field_key}
          rows={field.field_key === "risk_event" || field.field_key === "risk_cause" ? 3 : 2}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(field.field_key, e.target.value)}
          disabled={isReadOnly}
          placeholder={`Masukkan ${field.display_label.toLowerCase()}...`}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-200"
              : "border-slate-300 focus:border-[#004281] focus:ring-blue-100"
          } ${isReadOnly ? "bg-slate-100 cursor-not-allowed" : "bg-white"}`}
        />
        {field.help_text && <p className="text-[11px] text-slate-500">{field.help_text}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // Render Select Dropdown
  if (field.input_type === "select") {
    const rawOptions = field.options || [];

    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700" htmlFor={field.field_key}>
          {field.display_label}
          {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <select
          id={field.field_key}
          name={field.field_key}
          value={value !== null && value !== undefined ? String(value) : ""}
          onChange={(e) => {
            const rawVal = e.target.value;
            if (field.data_type === "integer") {
              onChange(field.field_key, rawVal === "" ? null : parseInt(rawVal, 10));
            } else {
              onChange(field.field_key, rawVal);
            }
          }}
          disabled={isReadOnly}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-200"
              : "border-slate-300 focus:border-[#004281] focus:ring-blue-100"
          } ${isReadOnly ? "bg-slate-100 cursor-not-allowed" : ""}`}
        >
          <option value="">— Pilih {field.display_label} —</option>
          {rawOptions.map((opt: FormFieldOption, idx: number) => {
            if (typeof opt === "object" && opt !== null) {
              return (
                <option key={`${opt.value}-${idx}`} value={opt.value}>
                  {opt.label}
                </option>
              );
            }
            return (
              <option key={`${opt}-${idx}`} value={opt}>
                {opt}
              </option>
            );
          })}
        </select>
        {field.help_text && <p className="text-[11px] text-slate-500">{field.help_text}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // Render Number Input
  if (field.input_type === "number") {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700" htmlFor={field.field_key}>
          {field.display_label}
          {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          type="number"
          id={field.field_key}
          name={field.field_key}
          value={value !== null && value !== undefined ? String(value) : ""}
          onChange={(e) => {
            const val = e.target.value === "" ? null : Number(e.target.value);
            onChange(field.field_key, val);
          }}
          disabled={isReadOnly}
          min={field.validation?.min}
          max={field.validation?.max}
          className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-200"
              : "border-slate-300 focus:border-[#004281] focus:ring-blue-100"
          } ${isReadOnly ? "bg-slate-100 cursor-not-allowed" : "bg-white"}`}
        />
        {field.help_text && <p className="text-[11px] text-slate-500">{field.help_text}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // Default: Standard Text Input
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700" htmlFor={field.field_key}>
        {field.display_label}
        {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        id={field.field_key}
        name={field.field_key}
        value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
        onChange={(e) => onChange(field.field_key, e.target.value)}
        disabled={isReadOnly}
        placeholder={`Masukkan ${field.display_label.toLowerCase()}...`}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-200"
            : "border-slate-300 focus:border-[#004281] focus:ring-blue-100"
        } ${isReadOnly ? "bg-slate-100 cursor-not-allowed" : "bg-white"}`}
      />
      {field.help_text && <p className="text-[11px] text-slate-500">{field.help_text}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
