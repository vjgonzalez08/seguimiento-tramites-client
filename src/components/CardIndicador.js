'use client';

import { Card, Tooltip, Spin } from 'antd';

export default function CardIndicador({ emoji, titulo, tooltip, valor }) {
  return (
    <Card
      title={
        <span
          style={{
            fontWeight: 600,
            fontSize: '0.85rem',
            color: '#4f4f4f',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            lineHeight: 1.1,
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
          {titulo}
        </span>
      }
      extra={
        <Tooltip title={tooltip}>
          <span style={{ fontSize: '1.05rem', cursor: 'pointer' }}>💡</span>
        </Tooltip>
      }
      style={{
        width: '100%',            // 👈 responsive al contenedor
        backgroundColor: '#f7f7f9',
        border: '1px solid #d9d9d9',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        borderRadius: '12px',
      }}
    >
      <div
        style={{
          height: '4.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {valor !== null ? (
          <p
            style={{
              fontSize: '3.5rem',
              fontWeight: 'bold',
              textAlign: 'center',
              margin: 0,
            }}
          >
            {valor}
          </p>
        ) : (
          <Spin size="large" />
        )}
      </div>
    </Card>
  );
}
