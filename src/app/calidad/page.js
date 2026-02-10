'use client';

import { useEffect, useMemo, useState, useRef  } from 'react';
import CardIndicador from '@/components/CardIndicador';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Table, Select, Tag, Button } from 'antd';
import * as XLSX from 'xlsx';
import { DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';


import {
  getTotalTramitesDevueltos,
  getTotalTramitesDevueltosConRespuesta,
  getTotalTramitesDevueltosSinRespuesta,
  getCorteDatosSap,
  getTramitesDevueltosCumplen,
  getTramitesDevueltosSinRespuestaSla, // ✅ (sin respuesta SLA)
  getPromedioDiasRespuesta,        // ✅ BLOQUE 3
  getPromedioDiasSinRespuesta,     // ✅ BLOQUE 3
  getDevueltosPorPrediadorResumen, // BLOQUE 5 Gráfica detalle x prediador
  getDevueltosPorPrediadorDetalle, // BLOQUE 5 Tabla detalle x prediador
} from '@/features/calidad/service';

/* ===== Inicialización dinámica de módulos Highcharts ===== */
function initHighchartsModule(mod, Highcharts) {
  if (typeof mod === 'function') mod(Highcharts);
  else if (mod?.default && typeof mod.default === 'function') mod.default(Highcharts);
  else if (mod?.init && typeof mod.init === 'function') mod.init(Highcharts);
}

function toNumberSafe(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function KpiItem({ label, value, tone = 'neutral' }) {
  const color =
    tone === 'warning' ? '#ad6800' : tone === 'danger' ? '#a8071a' : tone === 'success' ? '#237804' : '#1f1f1f';

  const badgeBg =
    tone === 'warning' ? '#fff7e6' : tone === 'danger' ? '#fff1f0' : tone === 'success' ? '#f6ffed' : '#ffffff';

  const badgeBorder =
    tone === 'warning' ? '#ffd591' : tone === 'danger' ? '#ffa39e' : tone === 'success' ? '#b7eb8f' : '#d9d9d9';

  return (
    <div style={{ minWidth: 0, textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: '0.9rem', color: '#6b6b6b', marginBottom: 6, textAlign: 'center' }}>{label}</div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          justifyContent: 'center', // 👈 centra horizontalmente
          margin: '0 auto',
          textAlign: 'center',
          gap: 8,
          padding: '15px 15px',
          borderRadius: 6,
          background: badgeBg,
          border: `0.0px solid ${badgeBorder}`,
          maxWidth: '100%',
        }}
      >
        <div style={{ fontSize: '3.3rem', fontWeight: 650, color, lineHeight: 1 }}>
          {value === null ? '—' : value}
        </div>
      </div>
    </div>
  );
}

export default function CalidadPage() {
  // ✅ Flag para NO eliminar tu UI vieja (solo la ocultamos por ahora)
  const SHOW_OLD_CARDS = false;

  const [modulesReady, setModulesReady] = useState(false);

  const [total, setTotal] = useState(null);
  const [totalConRespuesta, setTotalConRespuesta] = useState(null);
  const [totalSinRespuesta, setTotalSinRespuesta] = useState(null);
  const [fechaCorte, setFechaCorte] = useState(null);

  // Gauge existente (con respuesta)
  const [cumplen, setCumplen] = useState(0);
  const [totalRespuesta, setTotalRespuesta] = useState(0);

  const pctCumplenConRespuesta = useMemo(() => {
  if (!totalRespuesta || totalRespuesta === 0) return 0;
  return Math.round((cumplen / totalRespuesta) * 100);
}, [cumplen, totalRespuesta]);

  // 🔴 BLOQUE 2: SIN RESPUESTA - Cumplen / No cumplen
  const [sinRespCumplenSla, setSinRespCumplenSla] = useState(null);
  const [sinRespNoCumplenSla, setSinRespNoCumplenSla] = useState(null);


  // BLOQUE 3
const conRespNoCumplenNum = useMemo(() => {
  if (!totalRespuesta) return 0;
  return totalRespuesta - cumplen;
}, [totalRespuesta, cumplen]);

const pctConRespCumplen = useMemo(() => {
  if (!totalRespuesta) return 0;
  return Math.round((cumplen / totalRespuesta) * 100);
}, [cumplen, totalRespuesta]);

const pctConRespNoCumplen = useMemo(() => {
  if (!totalRespuesta) return 0;
  return 100 - pctConRespCumplen;
}, [pctConRespCumplen, totalRespuesta]);

const conRespTotalSla = useMemo(() => {
  if (!totalRespuesta) return 0;
  return totalRespuesta;
}, [totalRespuesta]);


  // ✅ BLOQUE 4
  const [promDiasRespuesta, setPromDiasRespuesta] = useState(null);
  const [promDiasSinRespuesta, setPromDiasSinRespuesta] = useState(null);

  // BLOQUE 5
  const [prediadorResumen, setPrediadorResumen] = useState([]);
  const [prediadorSapFilter, setPrediadorSapFilter] = useState(null);
  const [prediadorDetalle, setPrediadorDetalle] = useState([]);
  const [prediadorDetalleTotal, setPrediadorDetalleTotal] = useState(0);
  const [prediadorDetalleLoading, setPrediadorDetalleLoading] = useState(false);
  const [prediadorDetallePage, setPrediadorDetallePage] = useState(1);
  const [prediadorDetallePageSize, setPrediadorDetallePageSize] = useState(10);
  const [prediadorDetalleSortField, setPrediadorDetalleSortField] = useState('dias_transcurridos');
  const [prediadorDetalleSortOrder, setPrediadorDetalleSortOrder] = useState('descend');
  const [prediadorDetalleFiltroPrediador, setPrediadorDetalleFiltroPrediador] = useState(null);

  

  //const prediadorDetalleRequestRef = useRef(false);
  
  /*======NUEVO =====*/
    const rqPrediadorDetalle = useQuery({
      queryKey: [
        'calidad',
        'tabla',
        'prediador-detalle',
        prediadorDetallePage,
        prediadorDetallePageSize,
        prediadorDetalleSortField,
        prediadorDetalleSortOrder,
        prediadorDetalleFiltroPrediador,
      ],
      queryFn: () =>
        getDevueltosPorPrediadorDetalle({
          page: prediadorDetallePage,
          pageSize: prediadorDetallePageSize,
          sortField: prediadorDetalleSortField,
          sortOrder: prediadorDetalleSortOrder,
          prediador: prediadorDetalleFiltroPrediador,
        }),
      keepPreviousData: true,        // 👈 clave: no parpadea
      staleTime: 24 * 60 * 60 * 1000 // datos cambian 1 vez/día
    });


  /*
  const loadPrediadorDetalle = async (overrides = {}) => {
    if (prediadorDetalleRequestRef.current) return;
      prediadorDetalleRequestRef.current = true;
  setPrediadorDetalleLoading(true);
  try {
    const resp = await getDevueltosPorPrediadorDetalle({
      prediadorSap: overrides.prediadorSap ?? prediadorSapFilter,
      page: overrides.page ?? prediadorDetallePage,
      pageSize: overrides.pageSize ?? prediadorDetallePageSize,
      sortField: overrides.sortField ?? prediadorDetalleSortField,
      sortOrder: overrides.sortOrder ?? prediadorDetalleSortOrder,
    });

    if (resp?.success) {
      setPrediadorDetalle(resp.rows || []);
      setPrediadorDetalleTotal(resp.total || 0);
      setPrediadorDetallePage(resp.page || 1);
      setPrediadorDetallePageSize(resp.pageSize || 10);
    }
  } finally {
    prediadorDetalleRequestRef.current = false;
    setPrediadorDetalleLoading(false);
  }
};
*/

/* FUNCIÓN PARA EXPORTAR A EXCEL */
const exportPrediadorDetalleToExcel = async () => {
  // Respeta el filtro y el orden actuales
  const currentPrediadorSap = prediadorSapFilter;
  const currentSortField = prediadorDetalleSortField;
  const currentSortOrder = prediadorDetalleSortOrder;

  // Para exportar TODO, traemos por lotes (paginado)
  const pageSize = 200; // tope que pusimos en backend
  let page = 1;
  let total = 0;
  let allRows = [];

  try {
    // 1) Primer llamado para saber total
    const first = await getDevueltosPorPrediadorDetalle({
      prediadorSap: currentPrediadorSap,
      page,
      pageSize,
      sortField: currentSortField,
      sortOrder: currentSortOrder,
    });

    if (!first?.success) return;

    total = Number(first.total) || 0;
    allRows = [...(first.rows || [])];

    // 2) Traer el resto
    while (allRows.length < total) {
      page += 1;

      const resp = await getDevueltosPorPrediadorDetalle({
        prediadorSap: currentPrediadorSap,
        page,
        pageSize,
        sortField: currentSortField,
        sortOrder: currentSortOrder,
      });

      if (!resp?.success) break;

      const rows = resp.rows || [];
      if (!rows.length) break;

      allRows = allRows.concat(rows);
    }

    // 3) Transformar a formato Excel (con reglas de fechas)
    const excelRows = allRows.map((r) => {
      const fechaEntrega = r.fc_recepcion_tmt ? String(r.fc_recepcion_tmt).slice(0, 10) : '';
      const fechaSalidaRaw = r.fc_salida_tmt ? String(r.fc_salida_tmt).slice(0, 10) : '';
      const fechaSalida = fechaSalidaRaw === '1900-01-01' ? '' : fechaSalidaRaw;

      return {
        'Revisor Recibe': r.prediador_nombre || '',
        'Usuario SAP Revisor': r.prediador_sap || '',
        'Calidad Devuelve': r.revisor_nombre || '',
        'Usuario SAP Calidad': r.revisor_sap || '',
        'Número de trámite': r.nm_solicitud ?? '',
        'Fecha entrega': fechaEntrega,
        'Fecha salida': fechaSalida,
        'Días transcurridos': r.dias_transcurridos ?? '',
        'Estado': r.estado || '',
        /*'Cumple SLA': r.cumple_sla || '',*/
      };
    });

    // 4) Crear workbook y descargar
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelRows);

    XLSX.utils.book_append_sheet(wb, ws, 'Detalle');

    const ts = new Date();
    const yyyy = ts.getFullYear();
    const mm = String(ts.getMonth() + 1).padStart(2, '0');
    const dd = String(ts.getDate()).padStart(2, '0');

    const fileName = `tramites_devueltos_calidad_${yyyy}-${mm}-${dd}.xlsx`;

    XLSX.writeFile(wb, fileName);
  } catch (e) {
    console.error('Error exportando a Excel:', e);
  }
};


  /* =====NUEVO React Query — KPIs Calidad ===== */
    const rqTotalDevueltos = useQuery({
      queryKey: ['calidad', 'kpi', 'total-devueltos'],
      queryFn: getTotalTramitesDevueltos,
      staleTime: 24 * 60 * 60 * 1000,
    });

    const rqDevueltosConRespuesta = useQuery({
      queryKey: ['calidad', 'kpi', 'devueltos-con-respuesta'],
      queryFn: getTotalTramitesDevueltosConRespuesta,
      staleTime: 24 * 60 * 60 * 1000,
    });

    const rqDevueltosSinRespuesta = useQuery({
      queryKey: ['calidad', 'kpi', 'devueltos-sin-respuesta'],
      queryFn: getTotalTramitesDevueltosSinRespuesta,
      staleTime: 24 * 60 * 60 * 1000,
    });

    const rqCorteSap = useQuery({
      queryKey: ['calidad', 'kpi', 'corte-sap'],
      queryFn: getCorteDatosSap,
      staleTime: 24 * 60 * 60 * 1000,
    });

    const rqCumplenConRespuesta = useQuery({
      queryKey: ['calidad', 'kpi', 'con-respuesta-cumplen'],
      queryFn: getTramitesDevueltosCumplen,
      staleTime: 24 * 60 * 60 * 1000,
    });

    const rqSinRespuestaSla = useQuery({
      queryKey: ['calidad', 'kpi', 'sin-respuesta-sla'],
      queryFn: getTramitesDevueltosSinRespuestaSla,
      staleTime: 24 * 60 * 60 * 1000,
    });

    const rqPromDiasRespuesta = useQuery({
      queryKey: ['calidad', 'kpi', 'promedio-dias-respuesta'],
      queryFn: getPromedioDiasRespuesta,
      staleTime: 24 * 60 * 60 * 1000,
    });

    const rqPromDiasSinRespuesta = useQuery({
      queryKey: ['calidad', 'kpi', 'promedio-dias-sin-respuesta'],
      queryFn: getPromedioDiasSinRespuesta,
      staleTime: 24 * 60 * 60 * 1000,
    });

    const rqResumenPrediador = useQuery({
      queryKey: ['calidad', 'b5', 'prediador-resumen'],
      queryFn: getDevueltosPorPrediadorResumen,
      staleTime: 24 * 60 * 60 * 1000,
    });


  /* =====NUEVO Sincronizar KPIs desde React Query ===== */
    useEffect(() => {
      if (rqTotalDevueltos.data?.success) {
        setTotal(rqTotalDevueltos.data.total);
      }

      if (rqDevueltosConRespuesta.data?.success) {
        setTotalConRespuesta(rqDevueltosConRespuesta.data.total);
      }

      if (rqDevueltosSinRespuesta.data?.success) {
        setTotalSinRespuesta(rqDevueltosSinRespuesta.data.total);
      }

      if (rqCorteSap.data?.success) {
        setFechaCorte(rqCorteSap.data.fecha_max);
      }

      if (rqCumplenConRespuesta.data?.success) {
        setCumplen(rqCumplenConRespuesta.data.cumplen);
        setTotalRespuesta(rqCumplenConRespuesta.data.total_con_respuesta);
      }

      if (rqSinRespuestaSla.data?.success) {
        setSinRespCumplenSla(rqSinRespuestaSla.data.cumplen);
        setSinRespNoCumplenSla(rqSinRespuestaSla.data.no_cumplen);
      }

      if (rqPromDiasRespuesta.data?.success) {
        setPromDiasRespuesta(rqPromDiasRespuesta.data.promedio_dias);
      }

      if (rqPromDiasSinRespuesta.data?.success) {
        setPromDiasSinRespuesta(rqPromDiasSinRespuesta.data.promedio_dias);
      }

      if (rqResumenPrediador.data?.success) {
        setPrediadorResumen(rqResumenPrediador.data.rows || []);
      }
    }, [
      rqTotalDevueltos.data,
      rqDevueltosConRespuesta.data,
      rqDevueltosSinRespuesta.data,
      rqCorteSap.data,
      rqCumplenConRespuesta.data,
      rqSinRespuestaSla.data,
      rqPromDiasRespuesta.data,
      rqPromDiasSinRespuesta.data,
      rqResumenPrediador.data,
    ]);



  /* =====NUEVO Carga módulos Highcharts ===== */
  useEffect(() => {
    let mounted = true;

    (async () => {
      const more = await import('highcharts/highcharts-more');
      const solid = await import('highcharts/modules/solid-gauge');
      initHighchartsModule(more, Highcharts);
      initHighchartsModule(solid, Highcharts);
      if (mounted) setModulesReady(true);
    })();

    return () => (mounted = false);
  }, []);


      /* ===== Sincronizar KPI Total desde React Query ===== */
    useEffect(() => {
      const d = rqTotalDevueltos.data;
      if (d?.success) {
        setTotal(d.total);
      }
    }, [rqTotalDevueltos.data]);

  

  /* ===== Consumo de servicios existentes SIN CACHÉ ===== */
  /*
  useEffect(() => {
    getTotalTramitesDevueltos().then((d) => d.success && setTotal(d.total));
    getTotalTramitesDevueltosConRespuesta().then((d) => d.success && setTotalConRespuesta(d.total));
    getTotalTramitesDevueltosSinRespuesta().then((d) => d.success && setTotalSinRespuesta(d.total));
    getCorteDatosSap().then((d) => d.success && setFechaCorte(d.fecha_max));

    // Gauge existente (con respuesta)
    getTramitesDevueltosCumplen().then((d) => {
      if (d.success) {
        setCumplen(d.cumplen);
        setTotalRespuesta(d.total_con_respuesta);
      }
    });

    // ✅ BLOQUE 2: conectar endpoint real (sin respuesta SLA)
    getTramitesDevueltosSinRespuestaSla().then((d) => {
      if (d.success) {
        setSinRespCumplenSla(d.cumplen);
        setSinRespNoCumplenSla(d.no_cumplen);
      }
    });

    // ✅ BLOQUE 4
    getPromedioDiasRespuesta().then(d => d.success && setPromDiasRespuesta(d.promedio_dias));
    getPromedioDiasSinRespuesta().then(d => d.success && setPromDiasSinRespuesta(d.promedio_dias));

    // BLOQUE 5
    getDevueltosPorPrediadorResumen().then((d) => {
      if (d.success) setPrediadorResumen(d.rows || []);
    });
  }, []);
  */

  // BLOQUE 5
  /*
  useEffect(() => {
    loadPrediadorDetalle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    prediadorSapFilter,
    prediadorDetallePage,
    prediadorDetallePageSize,
    prediadorDetalleSortField,
    prediadorDetalleSortOrder,
  ]);
*/

  const totalNum = useMemo(() => toNumberSafe(total), [total]);
  const conRespNum = useMemo(() => toNumberSafe(totalConRespuesta), [totalConRespuesta]);
  const sinRespNum = useMemo(() => toNumberSafe(totalSinRespuesta), [totalSinRespuesta]);

  /* ===== BLOQUE 2: cálculo de barra apilada (si hay datos) ===== */
  const sinRespCumplenNum = useMemo(() => toNumberSafe(sinRespCumplenSla), [sinRespCumplenSla]);
  const sinRespNoCumplenNum = useMemo(() => toNumberSafe(sinRespNoCumplenSla), [sinRespNoCumplenSla]);

  const sinRespTotalSla = useMemo(() => {
    if (sinRespCumplenNum === null || sinRespNoCumplenNum === null) return null;
    return sinRespCumplenNum + sinRespNoCumplenNum;
  }, [sinRespCumplenNum, sinRespNoCumplenNum]);

  const pctCumplen = useMemo(() => {
    if (!sinRespTotalSla) return 0;
    return Math.round((sinRespCumplenNum / sinRespTotalSla) * 100);
  }, [sinRespCumplenNum, sinRespTotalSla]);

  const pctNoCumplen = useMemo(() => {
    if (!sinRespTotalSla) return 0;
    return 100 - pctCumplen;
  }, [pctCumplen, sinRespTotalSla]);


  /* ==== BLOQUE 5 ====== */
  const prediadorBarData = useMemo(() => {
    if (!prediadorResumen?.length) return { categories: [], data: [] };

    // ya viene ordenado DESC desde backend, pero aseguramos
    const sorted = [...prediadorResumen].sort(
      (a, b) => (b.total_devueltos || 0) - (a.total_devueltos || 0)
    );

    return {
      categories: sorted.map(r => r.prediador_nombre),
      data: sorted.map(r => Number(r.total_devueltos) || 0),
    };
  }, [prediadorResumen]);

  const maxPrediadorValue = useMemo(() => {
    if (!prediadorBarData.data.length) return 0;
    return Math.max(...prediadorBarData.data);
  }, [prediadorBarData]);



  
  /* OPCIONES GRÁFICA DE BARRA X PREDIADOR */
  const prediadorBarOptions = {
    chart: { type: 'bar', height: 420 },
    title: { text: null },
    xAxis: {
      categories: prediadorBarData.categories,
      title: { text: 'Revisor' },
      labels: { style: { fontSize: '12px' } },
    },
    yAxis: {
      title: { text: 'Trámites devueltos' },
      reversed: false, // mayor arriba
      min: 0,
      tickInterval: 1,
      allowDecimals: false,
      max: maxPrediadorValue, // 👈 AQUÍ SE USA
    },
    tooltip: {
      pointFormat: '<b>{point.y}</b> trámites',
    },
    plotOptions: {
      series: {
        dataLabels: { enabled: true },
      },
    },
    series: [
      {
        name: 'Trámites Devueltos',
        data: prediadorBarData.data,
      },
    ],
  };

  /* ==== FIN BLOQUE 5 ====== */

  /* ===== PIE (existente) ===== */
  const pieOptions = {
    chart: { type: 'pie', height: 320 },
    title: {
      text: 'Distribución Trámites Devueltos',
      style: { fontSize: '15px', fontWeight: 600, color: '#4f4f4f' },
    },
    tooltip: {
      pointFormat: '<b>{point.y}</b> trámites<br/>({point.percentage:.1f}%)',
    },
    plotOptions: {
      pie: {
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.y} ({point.percentage:.1f}%)',
          style: { fontSize: '13px', color: '#4f4f4f', textOutline: 'none' },
        },
      },
    },
    series: [
      {
        colorByPoint: true,
        data: [
          { name: 'Con Respuesta', y: conRespNum || 0 },
          { name: 'Sin Respuesta', y: sinRespNum || 0 },
        ],
      },
    ],
  };

  /* ===== SOLID GAUGE (existente) ===== */
  const INNER = '70%';
  const OUTER = '100%';
  const GREEN = '#68af25';

  const gaugeOptions = {
    chart: { type: 'solidgauge', height: 280 },
    title: null,
    pane: {
      center: ['50%', '65%'],
      size: '80%',
      startAngle: -90,
      endAngle: 90,
      background: {
        innerRadius: INNER,
        outerRadius: OUTER,
        shape: 'arc',
        backgroundColor: '#e6e6e6',
      },
    },
    tooltip: { enabled: false },
    yAxis: {
      min: 0,
      max: 100, //totalRespuesta || 1,
      tickPositions: [0, totalRespuesta || 1],
      lineWidth: 0,
      tickWidth: 0,
      minorTickInterval: null,
      gridLineWidth: 0,
      stops: [
        [0, GREEN],
        [1, GREEN],
      ],
      labels: {
        distance: 12,
        style: { fontSize: '13px', color: '#666', fontWeight: 'bold' },
      },
    },
    plotOptions: {
      solidgauge: { animation: false,
        dataLabels: {
          useHTML: true,
          borderWidth: 0,
          backgroundColor: 'transparent',
          shadow: false,
          overflow: 'visible',
          y: -40,
          crop: false,
          overflow: 'allow',
          allowOverlap: true,
          format: `
            <div style="text-align:center; line-height:1.1">
              <div style="font-size:50px;font-weight:700;color:#3f8600">
                {y}%
              </div>
              <div style="margin-top:6px;font-size:16px;font-weight:700;color:#3f8600">
                Cumplen SLA
              </div>
              <div style="margin-top:2px;font-size:12px;color:#6b6b6b">
                (solo trámites con respuesta)
              </div>
            </div>
          `,
        },
      },
    },
    series: [
      {
        //data: [{ y: cumplen, color: GREEN }],
        data: [{ y: pctCumplenConRespuesta, color: GREEN }],
        radius: OUTER,
        innerRadius: INNER,
        color: GREEN,
      },
    ],
  };

  return (
    <div style={{ padding: '1rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* ===== HEADER CONTEXTO + CORTE SAP ===== */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 750, color: '#1f1f1f', marginBottom: 6 }}>
            Calidad
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 750, color: '#1f1f1f', marginBottom: 6 }}>
            Dashboard - Seguimiento Trámites Devueltos
          </div>

          <div
            style={{
              width: '100%',
              backgroundColor: '#f7f7f9',
              padding: '0.5rem 1.0rem',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              border: '1px solid #ededed',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: '#6b6b6b' }}>
              
            </div>

            <div style={{ fontStyle: 'italic', fontSize: '0.65rem', color: '#606060', whiteSpace: 'nowrap' }}>
              {fechaCorte ? (
                <>
                  Corte Datos SAP:{' '}
                  <span
                    style={{
                      fontWeight: 700,
                      backgroundColor: '#e8e8e8',
                      padding: '0.18rem 0.55rem',
                      borderRadius: '8px',
                    }}
                  >
                    {fechaCorte}
                  </span>
                </>
              ) : (
                'Corte Datos SAP: —'
              )}
            </div>
          </div>
        </div>

        {/* =========================
            BLOQUE 1 — VOLUMEN GENERAL
           ========================= */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #ededed',
            borderRadius: 8,
            padding: '1.5rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 750, color: '#1f1f1f' }}>Volumen general de trámites</div>

          </div>

          {/* ✅ Ajuste responsive: SOLO 1 o 3 columnas (nunca 2) */}
          <div className="kpiGrid">
            <KpiItem label="Devueltos (Total)" value={totalNum} tone="neutral" />
            <KpiItem label="Sin respuesta" value={sinRespNum} tone="neutral" />
            <KpiItem label="Con respuesta" value={conRespNum} tone="neutral" />
          </div>

          <div style={{ fontSize: '0.7rem', color: '#6b6b6b', marginTop: '1.4rem', textAlign: 'left',width: '100%', }}>
            Total trámites devueltos de calidad a revisor y su estado de respuesta
          </div>          
        </div>

        {/* =====================================
            BLOQUE 2 — RIESGO SLA (SIN RESPUESTA)
           ===================================== */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #ededed',
            borderRadius: 8,
            padding: '2rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 750, color: '#1f1f1f' }}>
              Trámites sin respuesta
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6b6b6b' }}>* Cumplimiento: <b>≤ 5 días</b></div>
          </div>

          <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#6b6b6b' }}>
            Divide trámites sin respuesta en: <b>Cumplen </b> y <b>NO cumplen</b>.
          </div>

          {/* Barra apilada */}
          <div style={{ marginTop: '0.9rem' }}>
            <div
              style={{
                height: 15,
                width: '100%',
                background: '#f0f0f0',
                borderRadius: 999,
                overflow: 'hidden',
                border: '1px solid #e6e6e6',
              }}
              aria-label="Barra SLA sin respuesta"
            >
              {sinRespTotalSla === null ? (
                <div
                  style={{
                    height: '100%',
                    width: '100%',
                    background: 'linear-gradient(90deg,#f0f0f0,#fafafa,#f0f0f0)',
                  }}
                />
              ) : (
                <div style={{ display: 'flex', height: '100%', width: '100%' }}>
                  <div style={{ width: `${pctCumplen}%`, background: '#7aa6c2' }} />
                  <div style={{ width: `${pctNoCumplen}%`, background: '#ff7b1c' }} />
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 10,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 14, height: 14, borderRadius: 3, background: '#7aa6c2' }} />
                <div style={{ fontSize: '0.85rem', color: '#1f1f1f', display: 'flex', alignItems: 'center' }}>
                  <b>Cumplen</b> (≤ 5 días):{' '}
                  <span style={{ fontWeight: 800, fontSize: '1.6rem' }}>
                    {sinRespCumplenNum === null ? '—' : sinRespCumplenNum}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 14, height: 14, borderRadius: 3, background: '#ff7b1c' }} />
                <div style={{ fontSize: '0.85rem', color: '#1f1f1f', display: 'flex', alignItems: 'center' }}>
                  <b>NO cumplen</b> (&gt; 5 días):{' '}
                  <span style={{ fontWeight: 800, fontSize: '1.6rem' }}>
                    {sinRespNoCumplenNum === null ? '—' : sinRespNoCumplenNum}
                  </span>
                </div>
              </div>
            </div>

            {sinRespTotalSla === null && (
              <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#8c8c8c' }}>
                No hay trámites sin respuesta para el corte actual.
              </div>
            )}
          </div>
        </div>


        {/* =====================================
            BLOQUE 3 — RIESGO SLA (CON RESPUESTA)
           ===================================== */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #ededed',
            borderRadius: 8,
            padding: '2rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 750, color: '#1f1f1f' }}>
              Trámites con respuesta
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6b6b6b' }}>* Cumplimiento: <b>≤ 5 días</b></div>
          </div>

          <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#6b6b6b' }}>
            Divide trámites con respuesta en: <b>cumplen</b> y <b>NO cumplen</b>.
          </div>

          {/* Barra apilada */}
          <div style={{ marginTop: '0.9rem' }}>
            <div
              style={{
                height: 15,
                width: '100%',
                background: '#f0f0f0',
                borderRadius: 999,
                overflow: 'hidden',
                border: '1px solid #e6e6e6',
              }}
              aria-label="Barra SLA sin respuesta"
            >
              {conRespTotalSla === null ? (
                <div
                  style={{
                    height: '100%',
                    width: '100%',
                    background: 'linear-gradient(90deg,#f0f0f0,#fafafa,#f0f0f0)',
                  }}
                />
              ) : (
                <div style={{ display: 'flex', height: '100%', width: '100%' }}>
                  <div style={{ width: `${pctConRespCumplen}%`, background: '#7aa6c2' }} />
                  <div style={{ width: `${pctConRespNoCumplen}%`, background: '#004c6d' }} />
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 10,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 14, height: 14, borderRadius: 3, background: '#7aa6c2' }} />
                <div style={{ fontSize: '0.85rem', color: '#1f1f1f', display: 'flex', alignItems: 'center' }}>
                  <b>Cumplen</b> (≤ 5 días):{' '}
                  <span style={{ fontWeight: 800, fontSize: '1.6rem' }}>
                    {cumplen === null ? '—' : cumplen}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 14, height: 14, borderRadius: 3, background: '#004c6d' }} />
                <div style={{ fontSize: '0.85rem', color: '#1f1f1f', display: 'flex', alignItems: 'center' }}>
                  <b>NO cumplen</b> (&gt; 5 días):{' '}
                  <span style={{ fontWeight: 800, fontSize: '1.6rem' }}>
                    {conRespNoCumplenNum === null ? '—' : conRespNoCumplenNum}
                  </span>
                </div>
              </div>
            </div>

            {conRespTotalSla === null && (
              <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#8c8c8c' }}>
                No hay trámites sin respuesta para el corte actual.
              </div>
            )}
          </div>
        </div>

        {/* =========================
            BLOQUE 4 — TIEMPOS PROMEDIO
           ========================= */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #ededed',
            borderRadius: 8,
            padding: '2rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            marginBottom: '2rem',
          }}
        >
          <div style={{ fontSize: '1.05rem', fontWeight: 750, marginBottom: 12 }}>
            Tiempos promedio
          </div>

          <div
          className="kpiGridBloque3"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, max-content)',
              gap: '6rem',
              justifyItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KpiItem
              label="Días promedio de respuesta"
              value={promDiasRespuesta}
              suffix="días"
              tone="neutral"
            />
            <KpiItem
              label="Días promedio sin respuesta"
              value={promDiasSinRespuesta}
              suffix="días"
              tone="neutral"
            />
          </div>
          <div style={{ fontSize: '0.7rem', color: '#6b6b6b', marginTop: '1.4rem', textAlign: 'left',width: '100%', }}>
            Es el promedio de días en que se responde o no a los trámites devueltos
          </div> 
        </div>


        {/* =========================
            BLOQUE 5 — Trámites devueltos a prediadores
          ========================= */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #ededed',
            borderRadius: 8,
            padding: '2rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            marginBottom: '3rem',
          }}
        >
          <div style={{ fontSize: '1.1rem', fontWeight: 750, marginBottom: 12 }}>
            Trámites devueltos a revisores
          </div>

          <div style={{ fontSize: '0.8rem', color: '#6b6b6b', marginBottom: 12 }}>
            Total de trámites devueltos por calidad (ordenado de mayor a menor)
          </div>

          {modulesReady && (
            <HighchartsReact highcharts={Highcharts} options={prediadorBarOptions} />
          )}
        </div>

        {/* TABLA DETALLE X PREDIADOR */}        
        <div style={{ marginTop: '1.5rem', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 650 }}>Filtrar por revisor:</div>

            <Select
              style={{ minWidth: 340 }}
              allowClear
              placeholder="Seleccione revisor"
              value={prediadorSapFilter}
              onChange={(v) => {
                setPrediadorSapFilter(v || null);
                setPrediadorDetallePage(1); // al filtrar, vuelve a página 1
              }}
              options={(prediadorResumen || []).map((r) => ({
                value: r.prediador_sap,
                label: `${r.prediador_nombre} (${r.prediador_sap})`,
              }))}
            />
          </div>

          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportPrediadorDetalleToExcel}
          >
            Descargar Excel
          </Button>

          <Table
            size="small"   // 👈 TEXTO MÁS PEQUEÑO
            rowKey={(r) => `${r.nm_solicitud}-${r.prediador_sap}-${r.revisor_sap}-${r.fc_recepcion_tmt}`}
            dataSource={rqPrediadorDetalle.data?.rows || []}
            loading={rqPrediadorDetalle.isFetching}
            //loading={prediadorDetalleLoading}
            //dataSource={prediadorDetalle}
            columns={[
              { title: 'Revisor', dataIndex: 'prediador_nombre', key: 'prediador_nombre', sorter: true },
              { title: 'SAP Revisor', dataIndex: 'prediador_sap' },
              { title: 'Calidad', dataIndex: 'revisor_nombre', key: 'revisor_nombre', sorter: true },
              { title: 'SAP Calidad', dataIndex: 'revisor_sap' },
              { title: 'Trámite', dataIndex: 'nm_solicitud' },
              {title: 'Fecha entrega',
                dataIndex: 'fc_recepcion_tmt',
                key: 'fc_recepcion_tmt',
                sorter: true,
                render: (v) => (v ? String(v).slice(0, 10) : ''),
              },
              {title: 'Fecha salida',
                dataIndex: 'fc_salida_tmt',
                key: 'fc_salida_tmt',
                sorter: true,
                render: (v) => {
                  const s = v ? String(v).slice(0, 10) : '';
                  return s === '1900-01-01' ? '' : s;
                },
              },
              { title: 'Días', dataIndex: 'dias_transcurridos', key: 'dias_transcurridos', sorter: true, 
              render: (v) =>
                v > 5 ? (
                  <Tag
                    color="default"
                    style={{
                      backgroundColor: '#fff1f0',
                      color: '#ff4d4f',
                      borderColor: '#ffa39e',
                    }}
                  >
                    {v}
                  </Tag>
                ) : (
                  v
                ),
              },
              {title: 'Estado',
                dataIndex: 'estado',
                key: 'estado',
                sorter: true,
                width: 140,
                render: (v) =>
                  v === 'SIN RESPUESTA' ? (
                    <Tag color="default"
                          style={{
                            backgroundColor: '#fff4ed',
                            color: '#fa1414',
                            borderColor: '#ebb98f',
                          }}>SIN RESPUESTA</Tag>   
                  ) : (
                    <Tag color="default"
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#000000',
                            borderColor: '#ffffff',
                          }}>CON RESPUESTA</Tag>   
                  ),
              },
              /*{title: 'Cumple SLA',
                dataIndex: 'cumple_sla',
                key: 'cumple_sla',
                sorter: true,
                width: 120,
                align: 'center'
              },*/
            ]}
            pagination={{
              current: prediadorDetallePage,
              pageSize: prediadorDetallePageSize,
              total: rqPrediadorDetalle.data?.total || 0,
              showSizeChanger: true,            
            //pagination={{
            //  current: prediadorDetallePage,
            //  pageSize: prediadorDetallePageSize,
            //  total: prediadorDetalleTotal,
            //  showSizeChanger: true,
            }}
            onChange={(pagination, _filters, sorter) => {
              setPrediadorDetallePage(pagination.current || 1);
              setPrediadorDetallePageSize(pagination.pageSize || 10);

              // sorter puede venir como array o como objeto
              const s = Array.isArray(sorter) ? sorter[0] : sorter;

              if (s?.field && s?.order) {
                setPrediadorDetalleSortField(s.field);
                setPrediadorDetalleSortOrder(s.order);
              } else {
                // si el usuario quita el sort, vuelve al default
                setPrediadorDetalleSortField('dias_transcurridos');
                setPrediadorDetalleSortOrder('descend');
              }
            }}
          />
        </div>




        {/* ======================
           UI VIEJA (no eliminada)
           ====================== */}
        {SHOW_OLD_CARDS && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '3rem',
            }}
          >
            <CardIndicador
              emoji=""
              titulo="Trámites Devueltos Total"
              tooltip="Trámites devueltos por Revisor a Prediador"
              valor={total}
              texto="Total de trámites devueltos por Revisor a Prediador"
            />
            <CardIndicador
              emoji=""
              titulo="Devueltos con Respuesta"
              tooltip="Trámites devueltos por Revisor a Prediador con respuesta de Prediador"
              valor={totalConRespuesta}
              texto=""
            />
            <CardIndicador
              emoji=""
              titulo="Devueltos Sin Respuesta"
              tooltip="Trámites devueltos por Revisor a Prediador sin respuesta de Prediador"
              valor={totalSinRespuesta}
              texto="Pendientes de respuesta del Prediador"
            />

       {/* =========================
            BLOQUE GAUGE — SLA (CON RESPUESTA)
           ========================= */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #ededed',
            borderRadius: 8,
            padding: '2rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            marginBottom: '2rem',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '1.05rem', fontWeight: 750, marginBottom: 12 }}>
            Trámites con respuesta
          </div>

          <div style={{ width: 260, textAlign: 'center', marginLeft: 0 }}>
            {modulesReady && (
              <HighchartsReact highcharts={Highcharts} options={gaugeOptions} />
            )}

          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b6b6b' }}>
              Porcentaje de trámites con respuesta dentro del SLA ≤ 5 días
            </div>
          </div>
        </div>

        {/* ===== Lo demás queda igual (no tocado) ===== */}
        <div style={{ fontWeight: 600, fontSize: '1.2rem', color: '#385c8e' }}>
          Detalle Trámites Devueltos
        </div>
        <div style={{ height: 1, background: '#d9d9d9', margin: '1rem 0 1.5rem' }} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
          }}
        >
          {/* PIE */}
          <div
            style={{
              background: '#fff',
              padding: '1rem',
              borderRadius: 8,
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            <HighchartsReact highcharts={Highcharts} options={pieOptions} />
          </div>

          {/* GAUGE */}
          <div
            style={{
              background: '#fff',
              padding: '1rem',
              borderRadius: 8,
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 600, color: '#4f4f4f', fontSize: '15px' }}>
              Trámites Devueltos con Respuesta
            </div>
            <div style={{ fontSize: '1.3rem', color: '#3f8600', marginBottom: '1rem' }}>
              Cumplen SLA
            </div>

            {modulesReady && <HighchartsReact highcharts={Highcharts} options={gaugeOptions} />}
          </div>
        </div>


          </div>
        )}

 

        {/* ✅ CSS del ajuste BLOQUE 1 */}
        <style jsx>{`
          .kpiGrid {
            margin-top: 2.4rem;
            display: grid;
            grid-template-columns: 1fr; /* default: 1 KPI por fila */
            gap: clamp(0.6rem, 2vw, 1.1rem); /* márgenes se estrechan/ampían responsive */
            justify-items: center;
            align-items: start;
            max-width: 900px;   /* 👈 AJUSTE CLAVE */
            margin-left: auto;  /* 👈 centra el bloque */
            margin-right: auto; /* 👈 centra el bloque */
          }

          /* Solo cuando el ancho ya da, mostramos los 3 en una misma fila */
          @media (min-width: 800px) {
            .kpiGrid {
              grid-template-columns: repeat(3, minmax(220px, 1fr));
            }
          }
          /* ✅ BLOQUE 3 responsive: en pantallas pequeñas, 1 columna */
          @media (max-width: 700px) {
            .kpiGridBloque3 {
              grid-template-columns: 1fr !important;
            }}
        `}</style>

      </div>
    </div>
  );
}
