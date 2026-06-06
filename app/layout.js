import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://juli-tomi.wedding"),
  title: "Juli & Tomi | Nos casamos",
  description:
    "Juli y Tomi se casan el 6 de diciembre de 2026 en Del Viso, Buenos Aires. Confirmá tu asistencia.",
  icons: {
    icon: "/logo-juli-tomi-cropped.svg",
  },
  openGraph: {
    title: "Juli & Tomi | Nos casamos",
    description: "6 de diciembre de 2026 · Del Viso, Buenos Aires.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#f3ecd8",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,500;1,600&family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
