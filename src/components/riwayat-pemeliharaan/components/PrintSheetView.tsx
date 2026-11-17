"use client";

import type { AssetMetadata, MaintenanceRecord, PicInfo } from "../types";
import { formatDateDisplay, getActivityBadge } from "../helpers";

interface PrintSheetViewProps {
  printMode: "table" | "sticker";
  assetInfo: AssetMetadata;
  picInfo: PicInfo | null;
  filteredRecords: MaintenanceRecord[];
  resolveExecutorSignature: (item: MaintenanceRecord) => string | null;
  picSignatureUrl: string | null;
}

export default function PrintSheetView({
  printMode,
  assetInfo,
  picInfo,
  filteredRecords,
  resolveExecutorSignature,
  picSignatureUrl,
}: PrintSheetViewProps) {
  const tokenParam = assetInfo.qr_token || "bpom-genset-mataram-01";
  const baseOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://bbpommataram.id";
  const qrTargetUrl = `${baseOrigin}/simpel-bmn/pemeliharaan-rutin?token=${encodeURIComponent(
    tokenParam
  )}`;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: landscape;
                margin: 8mm 10mm;
              }
              body {
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              header, main, [role="dialog"], .no-print {
                display: none !important;
              }
              .print-only-container {
                display: block !important;
              }
            }
          `,
        }}
      />

      <div className="hidden print:block print-only-container w-full bg-white text-black font-sans leading-normal">
        {printMode === "sticker" ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center text-black">
            <div className="border-4 border-slate-900 rounded-2xl p-6 max-w-sm mx-auto text-center">
              <h2 className="text-sm font-extrabold uppercase">
                BALAI BESAR POM DI MATARAM
              </h2>
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                SISTEM MONITORING PEMELIHARAAN BMN
              </p>
              <div className="my-4 flex justify-center">
                <div className="h-44 w-44 mx-auto p-2 bg-white flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      qrTargetUrl
                    )}`}
                    alt="QR Code Aset BBPOM"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
              <h3 className="text-sm font-bold uppercase">{assetInfo.name}</h3>
              <p className="text-xs font-mono font-bold mt-0.5">
                {assetInfo.asset_code}
              </p>
              <p className="text-[10px] text-slate-600 mt-2">
                Arahkan kamera smartphone ke QR di atas untuk membuka Riwayat Pemeliharaan & Operasional
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* KOP Surat Resmi BBPOM Menggunakan Gambar header.png (Lebar penuh sejajar isi tabel) */}
            <div className="w-full mb-3">
              <div className="w-full overflow-hidden">
                <img
                  src="/assets/images/header.png"
                  alt="Kop Surat BBPOM di Mataram"
                  className="block h-auto"
                  style={{
                    width: "102.95%",
                    maxWidth: "none",
                    marginLeft: "-1.27%",
                    marginTop: "-3%",
                    marginBottom: "-1.5%",
                  }}
                />
              </div>
              <div className="mt-2 text-center">
                <h3 className="text-xs font-bold uppercase tracking-wide text-black underline">
                  LEMBAR KENDALI OPERASIONAL DAN PEMELIHARAAN BMN
                </h3>
              </div>
            </div>

            {/* Identitas Aset Fisik BMN */}
            <div className="mb-3 grid grid-cols-2 gap-2 text-[11px] border border-black p-2 bg-gray-50/50">
              <div>
                <div className="flex">
                  <span className="w-36 font-semibold">Nama Barang / Aset</span>
                  <span className="w-3">:</span>
                  <span className="font-bold">{assetInfo.name}</span>
                </div>
                <div className="flex mt-0.5">
                  <span className="w-36 font-semibold">Kode BMN / NUP</span>
                  <span className="w-3">:</span>
                  <span className="font-mono">{assetInfo.asset_code}</span>
                </div>
                <div className="flex mt-0.5">
                  <span className="w-36 font-semibold">Lokasi / Kategori</span>
                  <span className="w-3">:</span>
                  <span>{assetInfo.category}</span>
                </div>
              </div>
              <div>
                <div className="flex">
                  <span className="w-36 font-semibold">Penanggung Jawab (PIC)</span>
                  <span className="w-3">:</span>
                  <span className="font-semibold">
                    {picInfo?.name || "PIC BMN"}
                  </span>
                </div>
                <div className="flex mt-0.5">
                  <span className="w-36 font-semibold">Status Kondisi Terakhir</span>
                  <span className="w-3">:</span>
                  <span className="font-semibold uppercase">
                    {assetInfo.current_status === "standby"
                      ? "Siap Operasi (Standby)"
                      : assetInfo.current_status}
                  </span>
                </div>
                <div className="flex mt-0.5">
                  <span className="w-36 font-semibold">Waktu Cetak Dokumen</span>
                  <span className="w-3">:</span>
                  <span>
                    {new Date().toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabel Riwayat Pemeliharaan & Operasional */}
            <table className="w-full border-collapse border border-black text-[10px] text-left">
              <thead>
                <tr className="bg-gray-100 text-center font-bold border-b border-black text-[10px]">
                  <th className="border border-black px-1.5 py-1.5 w-7">NO</th>
                  <th className="border border-black px-2 py-1.5 w-24">
                    TANGGAL
                  </th>
                  <th className="border border-black px-2 py-1.5 w-28">
                    WAKTU & DURASI
                  </th>
                  <th className="border border-black px-2 py-1.5 w-36">
                    JENIS KEGIATAN
                  </th>
                  <th className="border border-black px-2 py-1.5">
                    URAIAN & CATATAN KEGIATAN
                  </th>
                  <th className="border border-black px-2 py-1.5 w-36">
                    PETUGAS PELAKSANA
                  </th>
                  <th className="border border-black px-2 py-1.5 w-32">
                    STATUS / PARAF PIC
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="border border-black py-6 text-center text-gray-500 italic"
                    >
                      Belum ada catatan riwayat pemeliharaan pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item, idx) => {
                    const typeBadge = getActivityBadge(item.activityType);
                    const execSig = resolveExecutorSignature(item);
                    const verifSig =
                      item.verifierSignatureUrl || picSignatureUrl || null;

                    return (
                      <tr key={item.id} className="border-b border-black">
                        <td className="border border-black px-1.5 py-1.5 text-center font-medium">
                          {idx + 1}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center whitespace-nowrap font-mono font-medium">
                          {formatDateDisplay(item.date)}
                        </td>
                        <td className="border border-black px-2 py-2 text-center font-mono">
                          <div>
                            {item.startTime} - {item.endTime}
                          </div>
                          <div className="text-[9px] text-gray-600">
                            ({item.durationMinutes} menit)
                          </div>
                        </td>
                        <td className="border border-black px-2 py-1.5 font-semibold">
                          {typeBadge.label}
                        </td>
                        <td className="border border-black px-2 py-1.5">
                          <div className="font-medium text-gray-900">
                            {item.activityDetails || "-"}
                          </div>
                          {item.notes && (
                            <div className="text-[9px] text-gray-600 mt-0.5 italic">
                              Catatan: {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center">
                          <div className="font-bold text-gray-900">
                            {item.executorName}
                          </div>
                          {item.executorRole && (
                            <div className="text-[9px] text-gray-600">
                              {item.executorRole}
                            </div>
                          )}
                          {execSig && (
                            <img
                              src={execSig}
                              alt="TTD Pelaksana"
                              className="h-7 max-w-[75px] object-contain mx-auto mt-0.5"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display =
                                  "none";
                              }}
                            />
                          )}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center">
                          {item.isVerified ? (
                            <div>
                              <div className="font-bold text-emerald-900 text-[10px]">
                                DISETUJUI PIC
                              </div>
                              {verifSig && (
                                <img
                                  src={verifSig}
                                  alt="Paraf PIC"
                                  className="h-7 max-w-[75px] object-contain mx-auto my-0.5"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display =
                                      "none";
                                  }}
                                />
                              )}
                              <div className="text-[8px] text-gray-600 font-mono mt-0.5">
                                {item.verifiedAt || "Terverifikasi"}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400 italic text-[9px]">
                              Menunggu Persetujuan
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Lembar Tanda Tangan Pengesahan (Hanya TTD PIC di Sebelah Kanan) */}
            <div className="mt-6 flex justify-end text-[10px] pt-2 break-inside-avoid pr-6">
              <div className="text-center min-w-[220px]">
                <p className="font-medium">
                  Mataram,{" "}
                  {new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="font-medium">Mengetahui / Menyetujui,</p>
                <p className="font-semibold">
                  {picInfo?.role_title || "Kasubag Tata Usaha / PIC BMN"}
                </p>
                <div className="h-16 flex items-center justify-center my-1">
                  {picSignatureUrl ? (
                    <img
                      src={picSignatureUrl}
                      alt="TTD PIC"
                      className="max-h-14 max-w-[140px] object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-[9px] italic">
                      ( Tanda Tangan Digital )
                    </div>
                  )}
                </div>
                <p className="font-bold underline">
                  {picInfo?.name || "PIC BMN"}
                </p>
                {picInfo?.nip && picInfo.nip !== "-" ? (
                  <p className="text-[9px] text-gray-600">
                    NIP. {picInfo.nip}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
