'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/common';

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // Define routes where you don't want to show the Navbar
  const noNavbarRoutes = ['/projects/map'];

  // Check if the current route should hide Navbar
  const shouldRenderNavbar = !noNavbarRoutes.some(route => pathname.startsWith(route));

  return (
    <>
      {shouldRenderNavbar && <Navbar />}
      {children}
    </>
  );
};

export default ClientLayout;
