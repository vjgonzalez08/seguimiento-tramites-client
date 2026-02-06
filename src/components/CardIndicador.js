'use client';

import { Card, Tooltip, Spin } from 'antd';

export default function CardIndicador({ emoji, titulo, tooltip, valor, texto }) {
  return (
    <Card
      title={
        <span
          style={{
            fontWeight: 600,
            fontSize: '1.0rem',
            color: '#434343',
            display: 'flex',
            alignItems: 'center',
            gap: '0rem',
            lineHeight: 1.1,
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
          {titulo}
        </span>
      }
      extra={
        <Tooltip title={tooltip}>
          <span style={{ fontSize: '0.9rem', cursor: 'pointer' }}>💡</span>
        </Tooltip>
      }
      style={{
        width: '100%',
        backgroundColor: '#ffffff',
        border: '1px solid #d9d9d9',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        borderRadius: '6px',
      }}
      styles={{
        header: {
          borderBottom: 'none', // ✅ sin línea divisoria
        },
      }}
    >
      <div
        style={{
          height: '4.3rem',              // ✅ altura fija del body
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '0.4rem',
        }}
      >
        {valor !== null ? (
          <>
            {/* VALOR (posición fija) */}
            <p
              style={{
                fontSize: '3.3rem',
                fontWeight: 550,
                color: '#292929',
                margin: 0,
                lineHeight: 1,
              }}
            >
              {valor}
            </p>

            {/* TEXTO (espacio reservado siempre) */}
            <div
              style={{
                minHeight: '1.1rem',      // ✅ reserva espacio aunque no haya texto
                fontSize: '0.72rem',
                fontWeight: 400,
                color: '#7e7e7e',
                lineHeight: 1.5,
              }}
            >
              {texto && texto.trim() !== '' ? texto : '\u00A0'}
            </div>
          </>
        ) : (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Spin size="large" />
          </div>
        )}
      </div>
    </Card>
  );
}
