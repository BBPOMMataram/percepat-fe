"use client";

import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { simanrisApi, setSimanrisActorHeaders, extractApiErrorMessage } from "../lib/simanrisApi";
import type {
  MasterOptionsData,
  PeriodItem,
  RiskFunctionItem,
  TestingListResponse,
  TestingSummaryData,
} from "../types";
import { TestingProgressCards } from "./testing-progress-cards";
import { TestingFilterBar } from "./testing-filter-bar";
import { TestingListTable } from "./testing-list-table";
import { TestingDetailModal } from "./testing-detail-modal";
import { ChartLoadingState } from "../shared/ChartLoadingState";
import { AlertCircle, FileSpreadsheet, Loader2 } from "lucide-react";

export function EntryTestingView() {
  // Master options
  const [masterOptions, setMasterOptions] = useState<MasterOptionsData | null>(null);
  const [loadingMaster, setLoadingMaster] = useState(true);

  // Filters state
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | "">("");
  const [selectedFunctionId, setSelectedFunctionId] = useState<number | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Data state
  const [testingData, setTestingData] = useState<TestingListResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal Detail state
  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null);

  // Sync authenticated user to SIMANRIS actor headers
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user) {
      const actorName = user.name || user.call_name || user.email;
      const fId = user.employee?.fungsi_id || user.fungsi?.id;
      const fName = user.employee?.fungsi?.name || user.fungsi?.name;
      setSimanrisActorHeaders({
        id: user.id,
        name: actorName,
        email: user.email,
        fungsi_id: fId,
        fungsi_name: fName,
      });
    }
  }, [user]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load master options (periods, functions)
  useEffect(() => {
    let isSubscribed = true;
    setLoadingMaster(true);

    simanrisApi
      .getMasterOptions()
      .then((res) => {
        if (!isSubscribed) return;
        setMasterOptions(res);

        // Cari periode aktif default
        const activePeriod =
          res.periods.find((p) => p.active_import_batch_id) || res.periods[0];
        if (activePeriod) {
          setSelectedPeriodId(activePeriod.id);
        }
      })
      .catch((err) => {
        if (!isSubscribed) return;
        setErrorMessage(extractApiErrorMessage(err));
      })
      .finally(() => {
        if (!isSubscribed) return;
        setLoadingMaster(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Fetch testings list
  const fetchTestings = useCallback(() => {
    if (!selectedPeriodId) return;

    setLoadingData(true);
    setErrorMessage(null);

    simanrisApi
      .getTestingList({
        period_id: selectedPeriodId,
        function_id: selectedFunctionId,
        search: debouncedSearch,
        status: selectedStatus,
        page: currentPage,
        per_page: 20,
      })
      .then((res) => {
        setTestingData(res);
      })
      .catch((err) => {
        setErrorMessage(extractApiErrorMessage(err));
      })
      .finally(() => {
        setLoadingData(false);
      });
  }, [selectedPeriodId, selectedFunctionId, debouncedSearch, selectedStatus, currentPage]);

  useEffect(() => {
    fetchTestings();
  }, [fetchTestings]);

  // Period change handler
  const handlePeriodChange = (periodId: number) => {
    setSelectedPeriodId(periodId);
    setCurrentPage(1);
  };

  // Function change handler
  const handleFunctionChange = (funcId: number | "") => {
    setSelectedFunctionId(funcId);
    setCurrentPage(1);
  };

  // Status change handler
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  // Refresh data after testing saved/completed
  const handleTestingSuccess = () => {
    fetchTestings();
  };

  // Export Excel handler
  const handleExportExcel = async () => {
    if (!selectedPeriodId) return;
    setExporting(true);
    setErrorMessage(null);

    try {
      await simanrisApi.downloadTestingExcel({
        period_id: selectedPeriodId,
        function_id: selectedFunctionId,
        search: debouncedSearch,
        status: selectedStatus,
      });
    } catch (err) {
      setErrorMessage(
        "Gagal mengunduh Excel kertas kerja: " + extractApiErrorMessage(err)
      );
    } finally {
      setExporting(false);
    }
  };

  const emptySummary: TestingSummaryData = {
    total_eligible: 0,
    not_started: 0,
    draft: 0,
    completed: 0,
    completion_percentage: 0,
  };

  const summary = testingData?.summary || emptySummary;

  return (
    <div className="space-y-6">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Entry Data Pengujian
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Workspace pengisian hasil pengujian aktivitas pengendalian terhadap risiko inheren tinggi (Level ≥ 16) Balai Besar POM di Mataram.
          </p>
        </div>

        {/* Action Header Button: Unduh Excel */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || loadingData || !selectedPeriodId}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all disabled:opacity-50"
            title="Unduh seluruh hasil pengujian aktivitas pengendalian ke dalam format Excel (.xlsx)"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-white" />
            )}
            <span>{exporting ? "Menyiapkan Excel..." : "Unduh Excel Pengujian"}</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Master Loading State */}
      {loadingMaster && (
        <ChartLoadingState heightClass="h-48" label="Memuat konfigurasi periode dan master data..." />
      )}

      {!loadingMaster && (
        <>
          {/* Progress Summary Cards */}
          <TestingProgressCards summary={summary} loading={loadingData} />

          {/* Filter Bar with embedded Export button */}
          <TestingFilterBar
            periods={masterOptions?.periods || []}
            functions={masterOptions?.functions || []}
            selectedPeriodId={selectedPeriodId}
            selectedFunctionId={selectedFunctionId}
            searchQuery={searchQuery}
            selectedStatus={selectedStatus}
            loading={loadingData}
            exporting={exporting}
            onPeriodChange={handlePeriodChange}
            onFunctionChange={handleFunctionChange}
            onSearchChange={setSearchQuery}
            onStatusChange={handleStatusChange}
            onRefresh={fetchTestings}
            onExport={handleExportExcel}
          />

          {/* Notice if no batch/file uploaded for this period */}
          {testingData?.notice && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-start gap-3 shadow-2xs">
              <FileSpreadsheet className="h-5 w-5 shrink-0 text-[#005baa] mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Perhatian Dataset Excel</p>
                <p className="mt-0.5 text-blue-800 leading-relaxed">{testingData.notice}</p>
              </div>
            </div>
          )}

          {/* Main Testing List Table */}
          {testingData?.records ? (
            <TestingListTable
              records={testingData.records}
              loading={loadingData}
              onSelectRisk={(id) => setSelectedRiskId(id)}
              onPageChange={(page) => setCurrentPage(page)}
            />
          ) : null}
        </>
      )}

      {/* Detail Form Modal */}
      {selectedRiskId && (
        <TestingDetailModal
          riskRecordId={selectedRiskId}
          onClose={() => setSelectedRiskId(null)}
          onSuccess={handleTestingSuccess}
        />
      )}
    </div>
  );
}
