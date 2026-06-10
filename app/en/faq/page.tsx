import type { Metadata } from "next";

import FaqPage from "@/components/FaqPage";

export const metadata: Metadata = {
  title: "FAQ | Juli & Tomi",
};

export default function FaqEn() {
  return <FaqPage locale="en" backHref="/en" />;
}
