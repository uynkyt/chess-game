import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Checkmate — Chess Arena',
  description: 'Chơi cờ vua với máy.',
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
