'use client';

import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import Provider from '@/redux/provider';
import { Footer, Navbar } from '@/components/common';
import { Setup } from '@/components/utils';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Dinamik yolları kontrol etmek için regex kullanma
  const hideNavbarFooterPages = /^\/projects\/map\/.+/;

  // Dinamik yollar için stil sınıfını belirleyin
  const containerClassName = hideNavbarFooterPages.test(pathname) 
    ? ''  // Dinamik sayfalar için stil sınıfı yok
    : 'mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 my-8';  // Diğer sayfalar için stil sınıfı

  return (
    <html lang='en'>
      <body className={inter.className}>
        <Provider>
          <Setup />
          {!hideNavbarFooterPages.test(pathname) && <Navbar />}
          <div className={containerClassName}>
            {children}
          </div>
          {!hideNavbarFooterPages.test(pathname) && <Footer />}
        </Provider>
      </body>
    </html>
  );
}
