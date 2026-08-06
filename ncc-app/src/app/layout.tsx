import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'NCC TCET — National Cadet Corps',
  description: 'NCC TCET Digital Management System — Skill tracking, camp recommendations, evaluations, and more.',
  keywords: 'NCC, NCC TCET, National Cadet Corps, TCET, cadets, camp, military, India, army, navy, air force',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'custom-toast',
              duration: 3500,
              style: {
                background: '#fff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
