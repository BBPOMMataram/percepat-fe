import { Metadata } from "next";
import WhatsNewSiproval from "@/components/siproval/whats-new/WhatsNewSiproval";

export const metadata: Metadata = {
  title: "What's New in SIPROVAL 2.0 | BBPOM di Mataram",
  description:
    "Pelajari seluruh fitur terbaru, peningkatan performa database mandiri, dashboard monitoring terpadu, dan otomasi pelaporan di SIPROVAL Versi 2.0.",
};

export default function WhatsNewPage() {
  return <WhatsNewSiproval />;
}

