/**
 * Reusable utility untuk mengunduh masing-masing grafik/tabel dashboard SIMANRIS
 * menjadi file gambar .png beresolusi tinggi (2x) dengan latar belakang putih bersih.
 */

export interface ExportChartPngOptions {
  element: HTMLElement | null;
  fileName: string;
  title?: string;
  subtitle?: string;
  filterSummary?: string;
  pixelRatio?: number;
}

function copyComputedStyles(source: Element, target: Element) {
  const win = window;
  const computed = win.getComputedStyle(source);
  const targetEl = target as HTMLElement | SVGElement;

  if (targetEl && targetEl.style) {
    const essentialProps = [
      "display",
      "position",
      "boxSizing",
      "width",
      "height",
      "minWidth",
      "maxWidth",
      "minHeight",
      "maxHeight",
      "margin",
      "marginTop",
      "marginRight",
      "marginBottom",
      "marginLeft",
      "padding",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "flexDirection",
      "flexWrap",
      "justifyContent",
      "alignItems",
      "alignContent",
      "flex",
      "flexGrow",
      "flexShrink",
      "flexBasis",
      "gap",
      "rowGap",
      "columnGap",
      "gridTemplateColumns",
      "gridColumn",
      "fontFamily",
      "fontSize",
      "fontWeight",
      "fontStyle",
      "lineHeight",
      "letterSpacing",
      "textAlign",
      "textTransform",
      "color",
      "backgroundColor",
      "backgroundImage",
      "border",
      "borderTop",
      "borderRight",
      "borderBottom",
      "borderLeft",
      "borderColor",
      "borderRadius",
      "borderCollapse",
      "borderSpacing",
      "overflow",
      "whiteSpace",
      "wordBreak",
      "verticalAlign",
      "opacity",
      "fill",
      "stroke",
      "strokeWidth",
      "strokeDasharray",
    ];

    for (const prop of essentialProps) {
      const val = computed.getPropertyValue(
        prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
      );
      if (val) {
        targetEl.style.setProperty(
          prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
          val
        );
      }
    }
  }

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);

  for (let i = 0; i < sourceChildren.length; i++) {
    const srcChild = sourceChildren[i];
    const tgtChild = targetChildren[i];
    if (!srcChild || !tgtChild) continue;

    if (srcChild.getAttribute("data-export-ignore") === "true") {
      (tgtChild as HTMLElement).style.display = "none";
      continue;
    }

    copyComputedStyles(srcChild, tgtChild);
  }
}

export async function exportChartToPng({
  element,
  fileName,
  pixelRatio = 2,
}: ExportChartPngOptions): Promise<void> {
  if (!element) {
    throw new Error("Elemen grafik tidak ditemukan untuk diekspor.");
  }

  const rect = element.getBoundingClientRect();
  const width = Math.max(Math.ceil(rect.width), 600);
  const height = Math.max(Math.ceil(rect.height), 300);

  const cloned = element.cloneNode(true) as HTMLElement;
  copyComputedStyles(element, cloned);

  // Pastikan kontainer kloning memiliki latar putih bersih dan ukuran eksplisit
  cloned.style.width = `${width}px`;
  cloned.style.height = `${height}px`;
  cloned.style.margin = "0";
  cloned.style.backgroundColor = "#ffffff";
  cloned.style.boxShadow = "none";

  // Sembunyikan seluruh tombol/elemen dengan atribut data-export-ignore="true"
  cloned
    .querySelectorAll('[data-export-ignore="true"]')
    .forEach((el) => ((el as HTMLElement).style.display = "none"));

  const serializer = new XMLSerializer();
  const xhtml = serializer.serializeToString(cloned);

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#ffffff" />
      <foreignObject x="0" y="0" width="${width}" height="${height}">
        ${xhtml}
      </foreignObject>
    </svg>
  `.trim();

  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Gagal menginisialisasi konteks Canvas 2D."));
          return;
        }

        ctx.scale(pixelRatio, pixelRatio);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const pngUrl = canvas.toDataURL("image/png", 1.0);
        const safeName = fileName.endsWith(".png") ? fileName : `${fileName}.png`;

        const link = document.createElement("a");
        link.download = safeName;
        link.href = pngUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      reject(new Error("Gagal merender grafik ke format PNG."));
    };
    img.src = svgDataUrl;
  });
}

export function buildChartExportFilename(
  baseSlug: string,
  year?: number | string | null,
  semester?: number | string | null
): string {
  const parts = [baseSlug];
  if (year) parts.push(String(year));
  if (semester) {
    const s = Number(semester);
    parts.push(s === 1 ? "sem1" : s === 2 ? "sem2" : String(semester));
  }
  return `${parts.join("-")}.png`;
}
