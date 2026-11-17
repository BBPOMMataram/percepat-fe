"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import type { FormSectionSchema } from "../types";
import DynamicFieldRenderer from "./dynamic-field-renderer";

interface DynamicFormSectionProps {
  section: FormSectionSchema;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  errors: Record<string, string>;
  defaultExpanded?: boolean;
  calculatedLevels?: {
    inherentLevel?: number;
    residualLevel?: number;
  };
}

export default function DynamicFormSection({
  section,
  values,
  onChange,
  errors,
  defaultExpanded = true,
  calculatedLevels,
}: DynamicFormSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Count how many required fields in this section are filled
  const requiredFields = section.fields.filter((f) => f.is_required);
  const filledRequired = requiredFields.filter((f) => {
    const val = values[f.field_key];
    return val !== undefined && val !== null && val !== "";
  }).length;
  const isSectionComplete = requiredFields.length > 0 && filledRequired === requiredFields.length;
  const hasErrors = section.fields.some((f) => !!errors[f.field_key]);

  React.useEffect(() => {
    if (hasErrors) {
      setExpanded(true);
    }
  }, [hasErrors]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs transition-all duration-150">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between border-b border-slate-100 px-5 py-3.5 text-left hover:bg-slate-50/80 rounded-t-xl transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#004281]/10 text-xs font-bold text-[#004281]">
            {section.order}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">{section.label}</h3>
              {isSectionComplete && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Lengkap
                </span>
              )}
              {hasErrors && (
                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                  Perlu Diperbaiki
                </span>
              )}
            </div>
            {section.description && (
              <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {requiredFields.length > 0 && (
            <span className="hidden sm:inline-block text-xs text-slate-400">
              {filledRequired}/{requiredFields.length} wajib terisi
            </span>
          )}
          <span className="rounded-md p-1 text-slate-400 hover:text-slate-600">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((field) => {
              // Span 2 columns for textareas or long text
              const isWide =
                field.input_type === "textarea" ||
                field.field_key === "objective" ||
                field.field_key === "business_process" ||
                field.field_key === "potential_impact" ||
                field.field_key === "existing_controls" ||
                field.field_key === "control_attributes";

              return (
                <div key={field.id} className={isWide ? "md:col-span-2" : "md:col-span-1"}>
                  <DynamicFieldRenderer
                    field={field}
                    value={values[field.field_key]}
                    onChange={onChange}
                    error={errors[field.field_key]}
                    calculatedLevels={calculatedLevels}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
