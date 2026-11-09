// Kategori capaian indikator kinerja (IK) sesuai Pedoman SAKIP BPOM:
//   > 110%            Tidak Dapat Disimpulkan  (abu-abu)
//   100% < x <= 110%  Sangat Baik              (biru)
//   90%  < x <= 100%  Baik                     (hijau)
//   60% <= x <= 90%   Cukup                    (kuning)
//   < 60%             Kurang                   (merah)
export const SAKIP_CATEGORIES = [
  { key: "tidak_dapat_disimpulkan", label: "Tidak Dapat Disimpulkan", range: ">110%", className: "bg-[#A6A6A6] text-slate-900" },
  { key: "sangat_baik", label: "Sangat Baik", range: "100% < x ≤ 110%", className: "bg-[#4F81BD] text-white" },
  { key: "baik", label: "Baik", range: "90% < x ≤ 100%", className: "bg-[#00B050] text-white" },
  { key: "cukup", label: "Cukup", range: "60% ≤ x ≤ 90%", className: "bg-[#FFFF00] text-slate-900" },
  { key: "kurang", label: "Kurang", range: "<60%", className: "bg-[#FF0000] text-white" },
] as const;

export type SakipCategory = (typeof SAKIP_CATEGORIES)[number];

export function getSakipCategory(x: number): SakipCategory {
  if (x > 110) return SAKIP_CATEGORIES[0];
  if (x > 100) return SAKIP_CATEGORIES[1];
  if (x > 90) return SAKIP_CATEGORIES[2];
  if (x >= 60) return SAKIP_CATEGORIES[3];
  return SAKIP_CATEGORIES[4];
}

// Predikat Nilai Kinerja Organisasi (NKO) sesuai Pedoman SAKIP BPOM:
//   > 100%           Istimewa         (biru)
//   80% < x <= 100%  Baik             (hijau)
//   60% < x <= 80%   Butuh Perbaikan  (kuning)
//   20% < x <= 60%   Kurang           (oranye)
//   0% <= x <= 20%   Sangat Kurang    (merah tua)
export const NKO_PREDIKAT = [
  { label: "Istimewa", range: ">100%", bg: "#0070C0", className: "bg-[#0070C0] text-white" },
  { label: "Baik", range: "80% < x ≤ 100%", bg: "#00B050", className: "bg-[#00B050] text-white" },
  { label: "Butuh Perbaikan", range: "60% < x ≤ 80%", bg: "#FFFF00", className: "bg-[#FFFF00] text-slate-900" },
  { label: "Kurang", range: "20% < x ≤ 60%", bg: "#ED7D31", className: "bg-[#ED7D31] text-white" },
  { label: "Sangat Kurang", range: "0% ≤ x ≤ 20%", bg: "#C00000", className: "bg-[#C00000] text-white" },
] as const;

export type NkoPredikat = (typeof NKO_PREDIKAT)[number];

export function getNkoPredikat(x: number): NkoPredikat {
  if (x > 100) return NKO_PREDIKAT[0];
  if (x > 80) return NKO_PREDIKAT[1];
  if (x > 60) return NKO_PREDIKAT[2];
  if (x > 20) return NKO_PREDIKAT[3];
  return NKO_PREDIKAT[4];
}

// "87.50%" / "87,50%" / "1.234,5" / 87.5 -> 87.5 (null bila bukan angka)
export function parseSakipNumber(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return isFinite(val) ? val : null;
  let s = String(val).replace("%", "").trim().replace(/\s/g, "");
  if (s === "" || s === "-") return null;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}
