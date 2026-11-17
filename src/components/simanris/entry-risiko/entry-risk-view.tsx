"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ClipboardPlus,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ListFilter,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import type {
  DynamicFormSchemaResponse,
  MasterOptionsData,
  PeriodItem,
  RiskRecordEntry,
} from "../types";
import { simanrisApi, extractApiErrorMessage } from "../lib/simanrisApi";
import DynamicRiskForm from "./dynamic-risk-form";
import EntryRiskTable from "./entry-risk-table";
import EntryRiskEmptyState from "./entry-risk-empty-state";

export default function EntryRiskView() {
  const [masterOptions, setMasterOptions] = useState<MasterOptionsData | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [schema, setSchema] = useState<DynamicFormSchemaResponse | null>(null);

  // Table state
  const [records, setRecords] = useState<RiskRecordEntry[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage] = useState(15);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [functionFilter, setFunctionFilter] = useState("");

  // Mode: "table" | "create" | "edit"
  const [viewMode, setViewMode] = useState<"table" | "form">("table");
  const [editingRecord, setEditingRecord] = useState<RiskRecordEntry | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load master options on mount
  useEffect(() => {
    let isMounted = true;
    simanrisApi
      .getMasterOptions()
      .then((opts) => {
        if (!isMounted) return;
        setMasterOptions(opts);
        if (opts.periods.length > 0) {
          const activeP = opts.periods.find((p) => p.active_import_batch_id) || opts.periods[0];
          setSelectedPeriodId(activeP.id);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setNotification({
          type: "error",
          message: extractApiErrorMessage(err, "Gagal memuat opsi periode master."),
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load schema whenever selectedPeriodId changes
  const loadSchema = useCallback(async (periodId: number) => {
    setLoadingSchema(true);
    try {
      const res = await simanrisApi.getEntryFormSchema({ period_id: periodId });
      setSchema(res);
    } catch (err) {
      setNotification({
        type: "error",
        message: extractApiErrorMessage(err, "Gagal memuat skema formulir dinamis template."),
      });
    } finally {
      setLoadingSchema(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      loadSchema(selectedPeriodId);
    }
  }, [selectedPeriodId, loadSchema]);

  // Load risk records whenever filters change
  const loadRecords = useCallback(async () => {
    if (!selectedPeriodId) return;
    setLoading(true);

    try {
      const res = await simanrisApi.listRisks({
        period_id: selectedPeriodId,
        function_id: functionFilter ? Number(functionFilter) : undefined,
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        include_unpublished: true,
        per_page: perPage,
        page: currentPage,
      });

      const paginator = res.records;
      setRecords((paginator.data as unknown as RiskRecordEntry[]) || []);
      setTotalRecords(paginator.total || 0);
      setLastPage(paginator.last_page || 1);
    } catch (err) {
      setNotification({
        type: "error",
        message: extractApiErrorMessage(err, "Gagal memuat daftar risiko."),
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodId, functionFilter, search, statusFilter, perPage, currentPage]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Quick action handlers
  const handleEdit = (record: RiskRecordEntry) => {
    setEditingRecord(record);
    setViewMode("form");
  };

  const handleAddNew = () => {
    setEditingRecord(null);
    setViewMode("form");
  };

  const handleSubmitRecord = async (id: number) => {
    try {
      await simanrisApi.submitRiskRecord(id);
      setNotification({ type: "success", message: "Data risiko berhasil diajukan untuk reviu." });
      loadRecords();
    } catch (err) {
      setNotification({
        type: "error",
        message: extractApiErrorMessage(err, "Gagal mengajukan risiko."),
      });
    }
  };

  const handlePublishRecord = async (id: number) => {
    try {
      await simanrisApi.publishRiskRecord(id);
      setNotification({ type: "success", message: "Data risiko berhasil dipublikasikan ke dataset resmi." });
      loadRecords();
    } catch (err) {
      setNotification({
        type: "error",
        message: extractApiErrorMessage(err, "Gagal mempublikasikan risiko."),
      });
    }
  };

  const handleArchiveRecord = async (id: number) => {
    if (!confirm("Arsipkan rekaman risiko ini?")) return;
    try {
      await simanrisApi.archiveRiskRecord(id);
      setNotification({ type: "success", message: "Data risiko berhasil diarsipkan." });
      loadRecords();
    } catch (err) {
      setNotification({
        type: "error",
        message: extractApiErrorMessage(err, "Gagal mengarsipkan risiko."),
      });
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm("Hapus draf risiko ini secara permanen?")) return;
    try {
      await simanrisApi.deleteRiskRecord(id);
      setNotification({ type: "success", message: "Draf risiko berhasil dihapus." });
      loadRecords();
    } catch (err) {
      setNotification({
        type: "error",
        message: extractApiErrorMessage(err, "Gagal menghapus draf risiko."),
      });
    }
  };

  const handleExportExcel = () => {
    if (!selectedPeriodId) return;
    const url = simanrisApi.getExportExcelUrl({
      period_id: selectedPeriodId,
      function_id: functionFilter ? Number(functionFilter) : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    });
    window.open(url, "_blank");
  };

  // Counts summary by status
  const draftCount = records.filter((r) => r.status === "draft").length;
  const submittedCount = records.filter((r) => r.status === "submitted").length;
  const publishedCount = records.filter((r) => r.status === "published").length;

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>SIMANRIS</span>
            <span>/</span>
            <span className="font-semibold text-[#004281]">Entry Risiko</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Entry & Pengelolaan Risiko
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Input data risiko langsung melalui web dengan formulir dinamis sesuai template Excel aktif.
          </p>
        </div>

        {/* Period Selector & Quick Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          {masterOptions && masterOptions.periods.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Periode:</span>
              <select
                value={selectedPeriodId || ""}
                onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-[#004281] focus:outline-none cursor-pointer"
              >
                {masterOptions.periods.map((p: PeriodItem) => (
                  <option key={p.id} value={p.id}>
                    {p.period_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === "table" ? (
            <button
              type="button"
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 rounded-xl bg-[#004281] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#003366] transition-colors cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Tambah Risiko</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ListFilter className="h-4 w-4" />
              <span>Kembali ke Daftar</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-xs transition-all ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Active Template Banner & KPI Summary */}
      {schema && viewMode === "table" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Template Aktif</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Sparkles className="h-4 w-4 text-[#004281]" />
              <span className="text-sm font-bold text-slate-900 truncate" title={schema.template.template_name}>
                v{schema.template.version}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{schema.template.template_name}</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Draf Risiko</span>
            <div className="mt-1 text-xl font-black text-amber-900">{draftCount}</div>
            <p className="text-[10px] text-amber-600 mt-0.5">Belum diajukan</p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Diajukan</span>
            <div className="mt-1 text-xl font-black text-blue-900">{submittedCount}</div>
            <p className="text-[10px] text-blue-600 mt-0.5">Menunggu publikasi</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Terpublikasi</span>
            <div className="mt-1 text-xl font-black text-emerald-900">{publishedCount}</div>
            <p className="text-[10px] text-emerald-600 mt-0.5">Masuk analitik resmi</p>
          </div>
        </div>
      )}

      {/* View Switch: Form vs Table */}
      {viewMode === "form" ? (
        schema ? (
          <DynamicRiskForm
            schema={schema}
            initialData={editingRecord}
            onSuccess={(saved) => {
              setNotification({
                type: "success",
                message: `Data risiko ${saved.risk_code || ""} berhasil disimpan dengan status ${saved.status}.`,
              });
              setViewMode("table");
              loadRecords();
            }}
            onCancel={() => setViewMode("table")}
          />
        ) : (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#004281] mb-2" />
            <p className="text-xs">Memuat konfigurasi template dinamis...</p>
          </div>
        )
      ) : (
        <EntryRiskTable
          records={records}
          functions={masterOptions?.functions || []}
          categories={masterOptions?.categories || []}
          currentPage={currentPage}
          lastPage={lastPage}
          total={totalRecords}
          perPage={perPage}
          onPageChange={(p) => setCurrentPage(p)}
          onEdit={handleEdit}
          onSubmitRecord={handleSubmitRecord}
          onPublishRecord={handlePublishRecord}
          onArchiveRecord={handleArchiveRecord}
          onDeleteRecord={handleDeleteRecord}
          onExportExcel={handleExportExcel}
          search={search}
          onSearchChange={(s) => {
            setSearch(s);
            setCurrentPage(1);
          }}
          statusFilter={statusFilter}
          onStatusFilterChange={(st) => {
            setStatusFilter(st);
            setCurrentPage(1);
          }}
          functionFilter={functionFilter}
          onFunctionFilterChange={(fn) => {
            setFunctionFilter(fn);
            setCurrentPage(1);
          }}
          loading={loading}
        />
      )}
    </div>
  );
}
