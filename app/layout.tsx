import './globals.css';
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <link rel="stylesheet" href="/vendor/alphaTab.css" />
        <script defer src="/vendor/alphaTab.min.js"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
