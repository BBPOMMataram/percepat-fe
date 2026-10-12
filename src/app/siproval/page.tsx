import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SIPROVAL | BBPOM di Mataram",
  description: "Sistem Informasi Program dan Evaluasi BBPOM di Mataram",
};

export default function SiprovalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Selamat Datang di SIPROVAL
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Sistem Informasi Program dan Evaluasi BBPOM di Mataram.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Total IKSK", value: "0" },
          { title: "Laporan Masuk", value: "0" },
          { title: "Dalam Evaluasi", value: "0" },
          { title: "Selesai Dievaluasi", value: "0" },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{item.title}</p>
            <p className="mt-3 text-3xl font-bold text-slate-800">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
