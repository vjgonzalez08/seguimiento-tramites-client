'use client';

import { useEffect, useState } from 'react';
import CardIndicador from '@/components/CardIndicador';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {
  getTotalTramitesDevueltos,
  getTotalTramitesDevueltosConRespuesta,
  getTotalTramitesDevueltosSinRespuesta,
  getCorteDatosSap,
} from '@/features/conservacion/service';

export default function ConservacionPage() {
  const [total, setTotal] = useState(null);
  const [totalConRespuesta, setTotalConRespuesta] = useState(null);
  const [totalSinRespuesta, setTotalSinRespuesta] = useState(null);
  const [fechaCorte, setFechaCorte] = useState(null);

  useEffect(() => {
    getTotalTramitesDevueltos().then((data) => {
      if (data.success) setTotal(data.total);
    });

    getTotalTramitesDevueltosConRespuesta().then((data) => {
      if (data.success) setTotalConRespuesta(data.total);
    });

    getTotalTramitesDevueltosSinRespuesta().then((data) => {
      if (data.success) setTotalSinRespuesta(data.total);
    });

    getCorteDatosSap().then((data) => {
      if (data.success) setFechaCorte(data.fecha_max);
    });
  }, []);

  const pieOptions = {
    chart: {
      type: 'pie',
      height: 340,
    },
    title: {
      text: 'Distribución Trámites Devueltos',
      style: {
        fontSize: '15px',
        fontWeight: 600,
        color: '#4f4f4f',
      },
    },
    tooltip: {
      pointFormat: '<b>{point.y}</b> trámites<br/>({point.percentage:.1f}%)',
      style: {
        fontSize: '13px',
      },
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          distance: 20,
          format: '<b>{point.name}</b>: {point.y} ({point.percentage:.1f}%)',
          style: {
            fontSize: '13px',
            color: '#4f4f4f',
            textOutline: 'none',
          },
        },
      },
    },
    series: [
      {
        name: 'Trámites',
        colorByPoint: true,
        data: [
          { name: 'Con Respuesta', y: totalConRespuesta || 0 },
          { name: 'Sin Respuesta', y: totalSinRespuesta || 0 },
        ],
      },
    ],
  };

  return (
    <div style={{ padding: '2rem 1.5rem' }}>
      {/* CONTENEDOR CENTRAL */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Barra Corte Datos SAP */}
        <div
          style={{
            width: '100%',
            backgroundColor: '#f7f7f9',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            textAlign: 'right',
            marginBottom: '2rem',
            fontStyle: 'italic',
            fontSize: '0.78rem',
            color: '#606060',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          }}
        >
          {fechaCorte && (
            <>
              Corte Datos SAP:{' '}
              <span
                style={{
                  fontWeight: 'bold',
                  fontStyle: 'italic',
                  backgroundColor: '#d6d6d6',
                  padding: '0.18rem 0.55rem',
                  borderRadius: '6px',
                  marginLeft: '0.35rem',
                  display: 'inline-block',
                }}
              >
                {fechaCorte}
              </span>
            </>
          )}
        </div>

        {/* GRID DE CARDS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem',
          }}
        >
          <CardIndicador
            emoji="📄"
            titulo="Trámites Devueltos Total"
            tooltip="Es el total de trámites que los revisores han devuelto a los prediadores"
            valor={total}
          />

          <CardIndicador
            emoji="📨"
            titulo="Devueltos con Respuesta"
            tooltip="Es el total de trámites devueltos por los revisores que ya tienen respuesta de los prediadores"
            valor={totalConRespuesta}
          />

          <CardIndicador
            emoji="⏳"
            titulo="Devueltos Sin Respuesta"
            tooltip="Es el total de trámites devueltos por los revisores que aún no han sido respondidos por los prediadores"
            valor={totalSinRespuesta}
          />
        </div>

        {/* TÍTULO DEL BLOQUE */}
        <div
          style={{
            fontWeight: 600,
            fontSize: '0.95rem',
            color: '#385c8e',
            marginBottom: '0.5rem',
          }}
        >
          Detalle Trámites Devueltos
        </div>

        {/* LÍNEA SEPARADORA */}
        <div
          style={{
            height: '1px',
            backgroundColor: '#d9d9d9',
            marginBottom: '1.5rem',
          }}
        />

        {/* BLOQUE DE LA GRÁFICA */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <HighchartsReact highcharts={Highcharts} options={pieOptions} />
        </div>
      </div>
    </div>
  );
}
