
'use client';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { TrackingProvider } from '@/contexts/TrackingContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Punjab Roadways Passenger App</title>
        <meta name="description" content="Real-time bus tracking for Punjab Roadways." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <TrackingProvider>
          {children}
          <Toaster />
        </TrackingProvider>
      </body>
    </html>
  );
}
