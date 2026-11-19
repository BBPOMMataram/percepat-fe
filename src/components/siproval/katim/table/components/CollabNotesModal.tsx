"use client";

import React from "react";
import { Icon } from "@iconify/react";
import type { CollabModalState } from "../types/tableTypes";

export interface CollabNotesModalProps {
  modal: CollabModalState | null;
  user: any;
  isPicUser: boolean;
  savingCollab: boolean;
  onClose: () => void;
  onUpdateModal: (updated: CollabModalState) => void;
  onSaveEditedNote: (index: number) => void;
  onDeleteNote: (index: number) => void;
  onSave: () => void;
}

export const CollabNotesModal: React.FC<CollabNotesModalProps> = ({
  modal,
  user,
  isPicUser,
  savingCollab,
  onClose,
  onUpdateModal,
  onSaveEditedNote,
  onDeleteNote,
  onSave,
}) => {
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-50/80 via-white to-slate-50 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Icon icon="solar:chat-round-dots-bold" width={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Kelola Catatan PIC: {modal.colLabel}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {modal.monthName} • Kolom [{modal.colLetter}]
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Icon icon="solar:close-circle-bold" width={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Info Aturan Penomoran & Penanda PIC */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-900 flex items-start gap-2.5">
            <Icon
              icon="solar:info-circle-bold"
              width={18}
              className="text-emerald-600 shrink-0 mt-0.5"
            />
            <div className="space-y-0.5 leading-relaxed text-[11px]">
              <strong>Sistem Penanda Otomatis PIC:</strong> Setiap catatan yang
              ditambahkan akan otomatis diberi nomor urut dan penanda nama PIC{" "}
              <code className="bg-white/90 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-800">
                + {user?.name || "Nama Anda"}
              </code>{" "}
              di akhir kalimat. Penambahan oleh PIC lain akan melanjutkan nomor
              berikutnya secara aman tanpa menghapus catatan sebelumnya.
            </div>
          </div>

          {/* Daftar Catatan yang Ada */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daftar Catatan Terdaftar ({modal.notes.length})
              </h4>
            </div>

            {modal.notes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                <Icon
                  icon="solar:document-text-linear"
                  width={28}
                  className="mx-auto mb-1.5 text-slate-300"
                />
                Belum ada catatan pada periode ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {modal.notes.map((note, nIdx) => {
                  const isCurrentUserAuthor = Boolean(
                    user?.name &&
                    note.author &&
                    (note.author
                      .toLowerCase()
                      .includes(user.name.toLowerCase()) ||
                      user.name
                        .toLowerCase()
                        .includes(note.author.toLowerCase())),
                  );
                  const isEditingThis = modal.editingIndex === nIdx;

                  return (
                    <div
                      key={nIdx}
                      className={`rounded-xl border p-3.5 transition ${
                        isCurrentUserAuthor
                          ? "border-emerald-200 bg-emerald-50/30"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      {isEditingThis ? (
                        <div className="space-y-2">
                          <textarea
                            value={modal.editingText}
                            onChange={(e) =>
                              onUpdateModal({
                                ...modal,
                                editingText: e.target.value,
                              })
                            }
                            rows={2}
                            className="w-full rounded-lg border border-emerald-300 p-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateModal({
                                  ...modal,
                                  editingIndex: null,
                                  editingText: "",
                                })
                              }
                              className="rounded-lg px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => onSaveEditedNote(nIdx)}
                              className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              Simpan Perubahan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                              {nIdx + 1}
                            </span>
                            <div className="space-y-1">
                              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                                {note.text}
                              </p>
                              <div className="flex items-center gap-1.5">
                                {isCurrentUserAuthor ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    <Icon
                                      icon="solar:user-bold"
                                      width={11}
                                    />
                                    Anda (+ {note.author || user?.name})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-[#005baa]">
                                    <Icon
                                      icon="solar:user-linear"
                                      width={11}
                                    />
                                    + {note.author || "PIC"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Katim hanya dapat mengubah/menghapus catatannya sendiri; PIC/Admin semua catatan */}
                          {!modal.isLocked &&
                            (isCurrentUserAuthor || isPicUser) && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateModal({
                                    ...modal,
                                    editingIndex: nIdx,
                                    editingText: note.text,
                                  })
                                }
                                title="Edit catatan ini"
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-600"
                              >
                                <Icon icon="solar:pen-bold" width={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteNote(nIdx)}
                                title="Hapus catatan ini"
                                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              >
                                <Icon
                                  icon="solar:trash-bin-trash-bold"
                                  width={14}
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Tambah Catatan Baru */}
          {!modal.isLocked ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/20 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  {modal.notes.length === 0
                    ? `Tulis Catatan ${modal.colLabel} Baru`
                    : `Tambah Catatan Baru (Nomor #${modal.notes.length + 1})`}
                </label>
                <span className="text-[11px] text-slate-500">
                  Disimpan atas nama:{" "}
                  <strong className="text-slate-800">
                    + {user?.name || "Anda"}
                  </strong>
                </span>
              </div>

              <textarea
                value={modal.newNoteText}
                onChange={(e) =>
                  onUpdateModal({
                    ...modal,
                    newNoteText: e.target.value,
                  })
                }
                placeholder="Tuliskan kendala atau rencana tindak lanjut di sini..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <div className="text-[11px] text-slate-500 italic">
                Cukup tulis di sini, lalu klik tombol{" "}
                <strong>&quot;Simpan&quot;</strong> di bawah untuk langsung
                menyimpan ke database dan menampilkan ke tabel.
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
              Kolom atau bulan ini sedang dalam status terkunci, hanya dapat
              melihat catatan terdaftar.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Icon
              icon="solar:info-circle-linear"
              width={14}
              className="text-slate-400"
            />
            <span>
              Penanda PIC:{" "}
              <strong className="text-slate-700">
                +{user?.name || "Anda"}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={savingCollab}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            {!modal.isLocked && (
              <button
                type="button"
                disabled={savingCollab}
                onClick={onSave}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                title="Simpan langsung ke database dan tampilkan di tabel"
              >
                {savingCollab ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="solar:diskette-bold" width={16} />
                    <span>Simpan</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollabNotesModal;
