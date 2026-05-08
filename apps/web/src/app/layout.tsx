import type { Metadata } from 'next';
import { Sora, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '600'],
});

export const metadata: Metadata = {
  title: 'Kodexa Hotel — El hotel virtual de nueva generación',
  description: 'Marketplace real, NPCs con IA y un editor visual de juegos. Construye, comercia y crea desde el navegador.',
  keywords: ['habbo', 'hotel', 'virtual', 'game', 'kodexa'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`h-full antialiased ${sora.variable} ${jetbrains.variable}`}>
      <body className="min-h-full bg-background text-text flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
