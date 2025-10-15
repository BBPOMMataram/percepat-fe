"use client";
import { clearAlert } from "@/features/alertSlice";
import { RootState } from "@/redux/store";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function Alert() {
  const { type, message, description } = useSelector((state: RootState) => state.alert);
  const dispatch = useDispatch();

  useEffect(() => {
    if (message) {
      console.log('Alert Description: ', description);
      const timer = setTimeout(() => dispatch(clearAlert()), 7000);
      return () => clearTimeout(timer);
    }
  }, [message, description, dispatch]);

  if (!message) return null;

  const base =
    "fixed top-18 right-4 z-[9999] w-80 p-3 rounded-lg text-sm font-medium border shadow-md animate-fade-in";
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
