"use client";

import { useDispatch, useSelector } from "react-redux";
import { clearAlert } from "@/features/alertSlice"
import { useEffect } from "react";
import { RootState } from "@/redux/store";

export default function Alert() {
  const { type, message } = useSelector((state: RootState) => state.alert);
  const dispatch = useDispatch();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => dispatch(clearAlert()), 3000);
      return () => clearTimeout(timer);
    }
  }, [message, dispatch]);

  if (!message) return null;

  const base =
    "fixed top-4 right-4 z-50 w-80 p-3 rounded-lg text-sm font-medium border shadow-md animate-fade-in";
  const styles =
    type === "success"
      ? "bg-green-100 text-green-800 border-green-300"
      : "bg-red-100 text-red-800 border-red-300";

  return (
    <div className={`${base} ${styles}`}>
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button
          className="ml-3 font-bold text-gray-700 hover:text-black"
          onClick={() => dispatch(clearAlert())}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
