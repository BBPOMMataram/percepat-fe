/**
 * Peringatan, konfirmasi, sukses, dan galat berbasis react-toastify.
 *
 * Pengganti window.confirm / window.alert. Memakai <ToastContainer> global
 * yang sudah dipasang di src/app/layout.tsx, jadi tidak perlu dipasang ulang.
 *
 * - alertSuccess / alertError / alertWarning : toast biasa (tertutup otomatis).
 * - confirmWarning : toast dengan tombol pilihan, tetap tampil sampai pengguna
 *   memilih. Mengembalikan Promise<boolean>.
 */
import { createElement } from "react";
import { toast } from "react-toastify";

const COLOR_PRIMARY = "#004281"; // biru BPOM
const COLOR_DANGER = "#b91c1c"; // merah untuk tindakan yang membuang data

let openCount = 0;
let activeConfirm: { id: string | number; finish: (answer: boolean) => void } | null = null;

/**
 * true selama ada konfirmasi yang menunggu jawaban. Dipakai oleh handler
 * keyboard halaman (mis. tombol Escape) agar tidak memicu aksi lain.
 */
export function isAlertOpen(): boolean {
  return openCount > 0;
}

export interface ConfirmOptions {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  /** Tombol konfirmasi berwarna merah, untuk tindakan yang membuang/menghapus data. */
  destructive?: boolean;
}

/**
 * Konfirmasi dengan ikon peringatan dan dua tombol.
 * true  = pengguna menekan tombol konfirmasi.
 * false = pengguna menekan tombol batal atau menutup toast (✕).
 */
export function confirmWarning({
  title,
  text,
  confirmButtonText = "Ya, Lanjutkan",
  cancelButtonText = "Batal",
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  // Hanya satu konfirmasi aktif: yang lama dianggap dibatalkan.
  if (activeConfirm) {
    const previous = activeConfirm;
    previous.finish(false);
    toast.dismiss(previous.id);
  }

  return new Promise<boolean>((resolve) => {
    let settled = false;
    openCount += 1;

    const finish = (answer: boolean) => {
      if (settled) return;
      settled = true;
      openCount = Math.max(0, openCount - 1);
      if (activeConfirm && activeConfirm.finish === finish) activeConfirm = null;
      resolve(answer);
    };

    const content = ({ closeToast }: { closeToast?: () => void }) =>
      createElement(
        "div",
        { className: "text-sm text-slate-800" },
        createElement("p", { className: "font-bold text-slate-900" }, title),
        text ? createElement("p", { className: "mt-1 text-xs leading-relaxed text-slate-600" }, text) : null,
        createElement(
          "div",
          { className: "mt-3 flex flex-wrap gap-2" },
          createElement(
            "button",
            {
              type: "button",
              className: "rounded-md px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90",
              style: { backgroundColor: destructive ? COLOR_DANGER : COLOR_PRIMARY },
              onClick: () => {
                finish(true);
                closeToast?.();
              },
            },
            confirmButtonText
          ),
          createElement(
            "button",
            {
              type: "button",
              // Tombol batal difokuskan lebih dulu untuk tindakan yang membuang data.
              autoFocus: destructive,
              className: "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50",
              onClick: () => {
                finish(false);
                closeToast?.();
              },
            },
            cancelButtonText
          )
        )
      );

    const id = toast.warning(content, {
      position: "top-center",
      theme: "light",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      pauseOnFocusLoss: false,
      // Ditutup lewat tombol ✕ tanpa memilih = dibatalkan.
      onClose: () => finish(false),
    });
    activeConfirm = { id, finish };
  });
}

/** Toast sukses. */
export function alertSuccess(title: string, text?: string): void {
  toast.success(text ? `${title} ${text}` : title);
}

/** Toast galat (tampil lebih lama agar sempat dibaca). */
export function alertError(title: string, text?: string): void {
  toast.error(text ? `${title} ${text}` : title, { autoClose: 7000 });
}

/** Toast peringatan tanpa pilihan. */
export function alertWarning(title: string, text?: string): void {
  toast.warning(text ? `${title} ${text}` : title);
}
