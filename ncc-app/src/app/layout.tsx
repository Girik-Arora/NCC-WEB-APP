import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'NCC Cadet Management System',
  description: 'National Cadet Corps — Digital platform for cadet management, skill tracking, and camp recommendations.',
  keywords: 'NCC, National Cadet Corps, cadets, camp, military, India',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
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
