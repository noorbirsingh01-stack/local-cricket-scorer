import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gully Cricket Pro',
  description: 'Elite Mobile Match Operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}