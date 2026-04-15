'use client';

import { Layout, Menu } from 'antd';
import Link from 'next/link';
import Image from 'next/image';

const { Header } = Layout;

const menuItems = [
  { key: 'conservacion', label: <Link href="/conservacion">Conservación</Link> },
  { key: 'actualizacion', label: <Link href="/actualizacion">Actualización</Link> },
  { key: 'calidad', label: <Link href="/calidad">Calidad</Link> },
  { key: 'mutaciones1y5', label: <Link href="/mutaciones1y5">Mutaciones 1 y 5</Link> },
  { key: 'mutaciones23y4', label: <Link href="/mutaciones23y4">Mutaciones 2, 3 y 4</Link> },
  { key: 'juridica', label: <Link href="/juridica">Jurídica</Link> },  
  /*{ key: 'buscar', label: <Link href="/buscar">Buscar</Link> },*/
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
        <Link
          href="/"
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <Image
            src="https://cdnwordpresstest-f0ekdgevcngegudb.z01.azurefd.net/es/wp-content/themes/theme_alcaldia/logos/logo_footer.png"
            alt="Ir al inicio"
            width={80}
            height={50}
            priority
          />
        </Link>



        {/* Menú centrado respecto al viewport */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            padding: '0 2rem', // respeta el padding del Header
          }}
        >
          <Menu
            mode="horizontal"
            disabledOverflow
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
