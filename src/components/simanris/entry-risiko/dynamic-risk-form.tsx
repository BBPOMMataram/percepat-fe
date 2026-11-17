"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Save,
  X,
  Sparkles,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";
import type {
  DuplicateRiskWarning as DuplicateWarningType,
  DynamicFormSchemaResponse,
  RiskRecordEntry,
} from "../types";
import { simanrisApi, extractApiErrorMessage } from "../lib/simanrisApi";
import DynamicFormSection from "./dynamic-form-section";
import DuplicateRiskWarning from "./duplicate-risk-warning";

interface DynamicRiskFormProps {
  schema: DynamicFormSchemaResponse;
  initialData?: RiskRecordEntry | null;
  onSuccess: (savedRecord: RiskRecordEntry, action: string) => void;
  onCancel: () => void;
}

export default function DynamicRiskForm({
  schema,
  initialData,
  onSuccess,
  onCancel,
}: DynamicRiskFormProps) {
  const autoSaveKey = useMemo(() => {
    const editId = initialData?.id ? `edit_${initialData.id}` : "new";
    return `simanris_autosave_${schema.period.id}_${editId}`;
  }, [schema.period.id, initialData?.id]);

  // Initial form values from initialData or localStorage draft or defaults
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    if (initialData) {
      return {
        ...initialData,
        period_id: initialData.period_id || schema.period.id,
        template_version_id: initialData.template_version_id || schema.template.id,
        raw_unit_name: initialData.raw_unit_name || initialData.risk_function?.name || "",
        raw_category_name: initialData.raw_category_name || initialData.risk_category?.name || "",
      };
    }

    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(autoSaveKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === "object") {
            return {
              period_id: schema.period.id,
              template_version_id: schema.template.id,
              ...parsed,
            };
          }
        }
      } catch {
        // Ignore localStorage read errors
      }
    }

    return {
      period_id: schema.period.id,
      template_version_id: schema.template.id,
      status: "published",
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarningType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-save state
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger debounced auto-save to localStorage whenever values change
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setAutoSaveState("saving");

    autoSaveTimerRef.current = setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(autoSaveKey, JSON.stringify(values));
          setAutoSaveState("saved");
          const now = new Date();
          setLastSavedTime(
            now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          );
        }
      } catch {
        setAutoSaveState("idle");
      }
    }, 600);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [values, autoSaveKey]);

  // Real-time matrix calculation
  const calculatedLevels = useMemo(() => {
    const matrix = schema.scoring_matrix || {};
    const inhL = Number(values["inherent_likelihood"]) || 0;
    const inhI = Number(values["inherent_impact"]) || 0;
    const resL = Number(values["residual_likelihood"]) || 0;
    const resI = Number(values["residual_impact"]) || 0;

    const calcInh = inhL > 0 && inhI > 0 ? (matrix[`${inhL}x${inhI}`] ?? inhL * inhI) : undefined;
    const calcRes = resL > 0 && resI > 0 ? (matrix[`${resL}x${resI}`] ?? resL * resI) : undefined;

    return {
      inherentLevel: calcInh,
      residualLevel: calcRes,
    };
  }, [values, schema.scoring_matrix]);

  // Overall required fields progress
  const allRequiredFields = useMemo(() => {
    return schema.sections.flatMap((s) => s.fields.filter((f) => f.is_required));
  }, [schema.sections]);

  const filledCount = useMemo(() => {
    return allRequiredFields.filter((f) => {
      const v = values[f.field_key];
      return v !== undefined && v !== null && v !== "";
    }).length;
  }, [allRequiredFields, values]);

  const progressPercent =
    allRequiredFields.length > 0
      ? Math.round((filledCount / allRequiredFields.length) * 100)
      : 100;

  const handleChange = (key: string, val: unknown) => {
    setValues((prev) => ({
      ...prev,
      [key]: val,
    }));

    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }

    if (key === "risk_code" && duplicateWarning) {
      setDuplicateWarning(null);
    }
  };

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of allRequiredFields) {
      const v = values[field.field_key];
      if (v === undefined || v === null || v === "") {
        newErrors[field.field_key] = `${field.display_label} wajib diisi.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [allRequiredFields, values]);

  const clearAutoSave = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(autoSaveKey);
      }
    } catch {
      // Ignore
    }
  };

  const handleSubmit = async (bypassDuplicateCheck = false) => {
    setErrorMessage(null);

    // Validate without clearing previously entered values
    if (!validateAll()) {
      const missingCount = Object.keys(errors).length || allRequiredFields.length - filledCount;
      setErrorMessage(
        `Terdapat ${missingCount > 0 ? missingCount : "beberapa"} field wajib yang belum terisi. Data yang sudah Anda masukkan tetap aman tersimpan, silakan lengkapi field yang ditandai merah.`
      );
      return;
    }

    setSubmitting(true);

    try {
      // Duplicate check before save
      if (!bypassDuplicateCheck && values["risk_code"]) {
        const check = await simanrisApi.validateRiskEntry({
          ...values,
          period_id: schema.period.id,
          exclude_id: initialData?.id,
        });

        if (check.has_duplicate_warning && check.duplicate_warning) {
          setDuplicateWarning(check.duplicate_warning);
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        ...values,
        period_id: schema.period.id,
        template_version_id: schema.template.id,
        status: "published",
        inherent_level: calculatedLevels.inherentLevel ?? values["inherent_level"],
        residual_level: calculatedLevels.residualLevel ?? values["residual_level"],
      };

      let result: RiskRecordEntry;
      if (initialData?.id) {
        result = await simanrisApi.updateRiskRecord(initialData.id, payload);
      } else {
        result = await simanrisApi.createRiskRecord(payload);
      }

      clearAutoSave();
      onSuccess(result, "published");
    } catch (err: unknown) {
      setErrorMessage(
        extractApiErrorMessage(
          err,
          "Gagal menyimpan data risiko. Periksa koneksi dan kelengkapan isian formulir."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (confirm("Kosongkan seluruh isian formulir? Data yang sudah diinput akan dihapus.")) {
      clearAutoSave();
      setValues({
        period_id: schema.period.id,
        template_version_id: schema.template.id,
        status: "published",
      });
      setErrors({});
      setErrorMessage(null);
      setDuplicateWarning(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50/80 via-white to-slate-50 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#004281] px-2.5 py-0.5 text-xs font-semibold text-white">
                <Sparkles className="h-3 w-3" />
                {schema.template.template_name} (v{schema.template.version})
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Periode: <strong className="text-slate-800">{schema.period.period_name}</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-2">
              {initialData ? `Edit Risiko: ${initialData.risk_code || "Draf"}` : "Formulir Entry Risiko"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Isian formulir tersimpan otomatis secara berkala. Field dengan tanda{" "}
              <span className="text-red-500 font-bold">*</span> wajib diisi sebelum menyimpan.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="w-full sm:w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-600">Kelengkapan Form</span>
              <span className="font-bold text-[#004281]">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#004281] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>{filledCount}/{allRequiredFields.length} field wajib</span>
              {progressPercent === 100 && (
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3" /> Siap
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Duplicate Alert if triggered */}
      {duplicateWarning && (
        <DuplicateRiskWarning
          warning={duplicateWarning}
          onProceed={() => handleSubmit(true)}
          onDismiss={() => setDuplicateWarning(null)}
          isSubmitting={submitting}
        />
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 animate-in fade-in-50 duration-150">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="font-bold text-red-800">Perhatian Sebelum Menyimpan</p>
            <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Dynamic Sections */}
      <div className="space-y-4">
        {schema.sections.map((section, idx) => (
          <DynamicFormSection
            key={section.key}
            section={section}
            values={values}
            onChange={handleChange}
            errors={errors}
            defaultExpanded={idx < 2}
            calculatedLevels={calculatedLevels}
          />
        ))}
      </div>

      {/* Action Bar (Single Primary Save Button + Auto-save indicator) */}
      <div className="sticky bottom-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-4 shadow-lg">
        {/* Left: Navigation and Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
            <span>Batal</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Kosongkan formulir"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Form</span>
          </button>
        </div>

        {/* Right: Autosave status & Single Primary "Simpan" Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto-save status chip */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {autoSaveState === "saving" ? (
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="h-3.5 w-3.5 animate-spin text-slate-400" />
                <span>Menyimpan draf otomatis...</span>
              </span>
            ) : lastSavedTime ? (
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Draf tersimpan otomatis {lastSavedTime}</span>
              </span>
            ) : null}
          </div>

          {/* Satu Tombol Utama: Simpan */}
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#004281] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#003366] transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Simpan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
