'use client';

import { Layout, Menu } from 'antd';
import Link from 'next/link';
import Image from 'next/image';

const { Header } = Layout;

const menuItems = [
  { key: 'conservacion', label: <Link href="/conservacion">Conservación</Link> },
  { key: 'actualizacion', label: <Link href="/actualizacion">Actualización</Link> },
  { key: 'claudia-lara', label: <Link href="/claudia-lara">Claudia Lara</Link> },
  { key: 'buscar', label: <Link href="/buscar">Buscar</Link> },
];

const Navbar = () => {
  return (
    <Layout>
      <Header
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: '#fff',
          padding: '0 2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 10,
        }}
      >
        {/* Logo a la izquierda */}
        <Link href="/">
          <Image
            src="https://cdnwordpresstest-f0ekdgevcngegudb.z01.azurefd.net/es/wp-content/themes/theme_alcaldia/logos/logo_footer.png"
            alt="Logo institucional"
            width={80}
            height={50}
            priority
          />
        </Link>

        {/* Menú centrado respecto al viewport */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <Menu
            mode="horizontal"
            items={menuItems}
            style={{
              borderBottom: 'none',
              background: 'transparent',
            }}
          />
        </div>
      </Header>
    </Layout>
  );
};

export default Navbar;
