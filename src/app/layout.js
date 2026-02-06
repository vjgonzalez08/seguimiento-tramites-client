import './globals.css';
import 'antd/dist/reset.css';
import { Inter } from 'next/font/google';
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Trámites Catastrales',
  description: 'Seguimiento a trámites catastrales',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
