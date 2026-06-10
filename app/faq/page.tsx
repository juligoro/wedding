import type { Metadata } from "next";

import FaqPage from "@/components/FaqPage";

export const metadata: Metadata = {
  title: "Preguntas frecuentes | Juli & Tomi",
};

export default function FaqEs() {
  return <FaqPage locale="es" backHref="/" />;
}
