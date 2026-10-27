import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface PageLayoutProps {
  children: ReactNode;
  container?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  container = true,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main
        id="main-content"
        style={{
          flex: '1 0 auto',
          paddingTop: '2rem',
          paddingBottom: '3rem',
        }}
      >
        {container ? <div className="container">{children}</div> : children}
      </main>
      <Footer />
    </div>
  );
};
