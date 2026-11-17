"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { simanrisApi } from "../lib/simanrisApi";
import type { ImportBatchItem, MasterOptionsData } from "../types";
import { ExcelUploadForm } from "./excel-upload-form";
import { ImportPreview } from "./import-preview";
import { ImportResult } from "./import-result";

export function UploadWorkflow() {
  const searchParams = useSearchParams();
  const initialBatchIdParam = searchParams.get("batch_id");

  const [options, setOptions] = useState<MasterOptionsData | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<number | null>(
    initialBatchIdParam ? Number(initialBatchIdParam) : null
  );
  const [publishedBatch, setPublishedBatch] = useState<ImportBatchItem | null>(
    null
  );

  const loadOptions = useCallback(async () => {
    try {
      const res = await simanrisApi.getMasterOptions();
      setOptions(res);
    } catch {
      // Error ditangani di form / preview jika server offline
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    if (initialBatchIdParam) {
      const parsed = Number(initialBatchIdParam);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setActiveBatchId(parsed);
        setPublishedBatch(null);
      }
    }
  }, [initialBatchIdParam]);

  const currentStep = publishedBatch ? 3 : activeBatchId ? 2 : 1;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Import &amp; Validasi Workbook Excel SAPA APIP
            </h2>
            <p className="text-xs text-slate-500">
              Alur bertahap memastikan tidak ada data ganda atau error tersembunyi sebelum dashboard diperbarui.
            </p>
          </div>
          {currentStep === 2 && (
            <button
              type="button"
              onClick={() => setActiveBatchId(null)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Form Upload
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          {[
            { num: 1, label: "1. Upload File Excel" },
            { num: 2, label: "2. Preview & Validasi Staging" },
            { num: 3, label: "3. Publikasi Dataset" },
          ].map((s) => (
            <div
              key={s.num}
              className={`rounded-xl border px-3 py-2 font-semibold text-center ${
                currentStep === s.num
                  ? "border-[#005baa] bg-blue-50 text-[#004281]"
                  : currentStep > s.num
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {currentStep === 1 && (
        <ExcelUploadForm
          options={options}
          onOptionsUpdated={loadOptions}
          onUploaded={(batch) => {
            setPublishedBatch(null);
            setActiveBatchId(batch.id);
          }}
        />
      )}

      {currentStep === 2 && activeBatchId !== null && (
        <ImportPreview
          batchId={activeBatchId}
          onPublished={(batch) => setPublishedBatch(batch)}
          onCancelled={() => {
            setActiveBatchId(null);
            setPublishedBatch(null);
          }}
        />
      )}

      {currentStep === 3 && publishedBatch && (
        <ImportResult
          batch={publishedBatch}
          onReset={() => {
            setActiveBatchId(null);
            setPublishedBatch(null);
          }}
        />
      )}
    </div>
  );
}
