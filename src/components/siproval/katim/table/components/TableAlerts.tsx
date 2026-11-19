"use client";

import React from "react";
import { Icon } from "@iconify/react";

export interface TableAlertsProps {
  successMsg: string;
  errorMsg: string;
  onClearSuccess: () => void;
  onClearError: () => void;
}

export const TableAlerts: React.FC<TableAlertsProps> = ({
  successMsg,
  errorMsg,
  onClearSuccess,
  onClearError,
}) => {
  if (!successMsg && !errorMsg) return null;

  return (
    <>
      {successMsg && (
        <div
          role="status"
          className="sticky top-2 z-40 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 shadow-md"
        >
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:check-circle-bold"
              width={18}
              className="text-emerald-600"
            />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={onClearSuccess}
            className="text-emerald-700 cursor-pointer"
          >
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="sticky top-2 z-40 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800 shadow-md"
        >
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:danger-triangle-bold"
              width={18}
              className="text-red-600"
            />
            <span>{errorMsg}</span>
          </div>
          <button onClick={onClearError} className="text-red-700 cursor-pointer">
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      )}
    </>
  );
};

export default TableAlerts;
