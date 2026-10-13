import Siproval from "@/components/siproval/Siproval";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SIPROVAL | BBPOM di Mataram",
  description: "Sistem Informasi Program dan Evaluasi BBPOM di Mataram",
};

export default function SiprovalPage() {
  return <Siproval />;
}
