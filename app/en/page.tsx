import type { Metadata } from "next";

import WeddingLanding from "@/components/WeddingLanding";

export const metadata: Metadata = {
  title: "Juli & Tomi | We're getting married",
};

export default function EnglishHome() {
  return <WeddingLanding locale="en" />;
}
