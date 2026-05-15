import '../styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Providers from './providers'
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'STRSAT | Gestão de Risco',
  description: 'Plataforma moderna para gerenciamento de vistorias veiculares',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body>
        <Providers>
          {children}
          <Toaster 
            position="top-center" 
            toastOptions={{
              className: 'shadow-2xl font-sans',
              style: {
                borderRadius: '16px',
                padding: '14px 20px',
                fontWeight: '800',
                fontSize: '14px',
                color: '#ffffff',
                letterSpacing: '0.5px'
              },
              success: {
                style: {
                  background: '#10b981', // Verde vivo
                  border: '1px solid #059669',
                  boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.3)'
                },
                iconTheme: {
                  primary: '#ffffff',
                  secondary: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444', // Vermelho vivo
                  border: '1px solid #dc2626',
                  boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.3)'
                },
                iconTheme: {
                  primary: '#ffffff',
                  secondary: '#ef4444',
                },
              },
            }}
          />
        </Providers>
      </body>

    </html>
  )
}

