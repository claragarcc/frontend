import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";
import {
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const initialState = {
  // ✅ mantenemos lo que ya tienes
  resumenSemanal: {
    ejerciciosCompletados: 0,
    conceptosDistintos: 0,
    rachaDias: 0
  },

  // ✅ reutilizamos tu array actual (aunque lo renombremos visualmente)
  eficienciaPorConcepto: [], // [{ concepto: 'Ley de Ohm', interacciones: 4 }, ...]

  ultimaSesion: {
    tituloEjercicio: "",
    analisis: "Completa un ejercicio para ver aquí tu resumen.",
    consejo: "¡Mucho ánimo!"
  },

  // ✅ NUEVO: errores o patrones frecuentes (para que el dashboard “tutorice”)
  erroresFrecuentes: [
    // ejemplo de forma:
    // { etiqueta: "CA_OHM_01", texto: "Confunde tensión e intensidad", veces: 3 }
  ],

  // ✅ NUEVO: recomendación accionable
  recomendacion: {
    titulo: "",
    motivo: "Haz un ejercicio para que el tutor pueda recomendarte una práctica personalizada.",
    ejercicioId: null,
    concepto: ""
  }
};

export default function Dashboard() {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // NOTA: esto debe venir de tu login real (CAS) más adelante
  const MOCK_USER_ID = "681cd8217918fbc4fc7a626f";
  const BACKEND = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    axios
      .get(`${BACKEND}/api/progreso/${MOCK_USER_ID}`)
      .then((res) => {
        const fullData = { ...initialState, ...(res.data || {}) };
        setData(fullData);
      })
      .catch((error) => {
        console.error("Error al cargar los datos del progreso:", error);
        setData(initialState);
      })
      .finally(() => setLoading(false));
  }, [BACKEND]);

  const hasChartData = (data.eficienciaPorConcepto || []).length > 0;
  const hasErrores = (data.erroresFrecuentes || []).length > 0;

  // Para no “castigar” a quien habla más con el tutor, evitamos lenguaje “eficiencia”
  const chartTitle = "Dificultad estimada por concepto";
  const chartHelp =
    "Aproximación basada en el número medio de mensajes necesarios para resolver ejercicios. Úsalo como señal de qué reforzar, no como nota.";

  // CTA: llevar a Interacciones con ejercicio recomendado
  const handlePracticar = () => {
    if (!data.recomendacion?.ejercicioId) {
      navigate("/busqueda"); // o a donde tengas ejercicios / búsqueda
      return;
    }
    // Si tu Interacciones abre por query param, por ejemplo:
    // /interacciones?ejercicioId=...
    navigate(`/interacciones?ejercicioId=${data.recomendacion.ejercicioId}`);
  };

  if (loading) {
    return <div className="dashboard-loading">Cargando tu progreso...</div>;
  }

  return (
    <div className="dashboard-scope">
      <header className="dashboard-header container-app">
        <h1 className="dashboard-title">Tu Progreso</h1>
        <div className="dashboard-acento" />
        <p className="dashboard-subtitle">
          Actividad semanal, conceptos que te cuestan más y una recomendación clara para tu próxima sesión.
        </p>
      </header>

      <main className="dashboard-main container-app">
        {/* FILA 1 */}
        <section className="dashboard-grid dashboard-grid-top">
          {/* Resumen semanal */}
          <article className="card dashboard-card dashboard-card-wide">
            <h2 className="dashboard-card-title">
              <CalendarDaysIcon className="dashboard-icon" />
              Actividad (últimos 7 días)
            </h2>

            <div className="dashboard-metrics">
              <div className="dashboard-metric">
                <span className="dashboard-metric-value">
                  {data.resumenSemanal.ejerciciosCompletados}
                </span>
                <span className="dashboard-metric-label">Ejercicios completados</span>
              </div>

              <div className="dashboard-divider" />

              <div className="dashboard-metric">
                <span className="dashboard-metric-value">
                  {data.resumenSemanal.conceptosDistintos}
                </span>
                <span className="dashboard-metric-label">Conceptos practicados</span>
              </div>

              <div className="dashboard-divider" />

              <div className="dashboard-metric">
                <span className="dashboard-metric-value dashboard-streak">
                  {data.resumenSemanal.rachaDias}
                </span>
                <span className="dashboard-metric-label">Días de racha</span>
              </div>
            </div>
          </article>

          {/* Recomendación (sustituye eficiencia general) */}
          <article className="card dashboard-card dashboard-card-center">
            <h2 className="dashboard-card-title">
              Recomendación para tu próxima sesión
            </h2>

            <p className="dashboard-help" style={{ marginTop: "-0.25rem" }}>
              {data.recomendacion?.titulo ? (
                <>
                  <strong>{data.recomendacion.titulo}</strong>
                  {data.recomendacion.concepto ? (
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {" "}· {data.recomendacion.concepto}
                    </span>
                  ) : null}
                </>
              ) : (
                <strong>Sin recomendación aún</strong>
              )}
            </p>

            <p className="dashboard-help">
              {data.recomendacion?.motivo}
            </p>

            <button
              type="button"
              className="btn-secondary"
              onClick={handlePracticar}
              style={{ borderRadius: 9999, marginTop: "0.75rem" }}
            >
              Practicar ahora <ArrowRightIcon style={{ width: 18, height: 18 }} />
            </button>
          </article>
        </section>

        {/* FILA 2 */}
        <section className="dashboard-grid dashboard-grid-bottom">
          {/* Gráfico (renombrado) */}
          <article className="card dashboard-card">
            <h2 className="dashboard-card-title">
              {chartTitle}
            </h2>

            <p className="dashboard-help">{chartHelp}</p>

            <div className="dashboard-chart">
              {hasChartData ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={data.eficienciaPorConcepto}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="concepto"
                      width={140}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(231,38,33,0.06)" }}
                      contentStyle={{
                        backgroundColor: "var(--color-bg-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "12px"
                      }}
                    />
                    {/* seguimos usando "interacciones" porque es lo que ya tienes */}
                    <Bar
                      dataKey="interacciones"
                      name="Mensajes medios"
                      fill="var(--color-primary)"
                      barSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="dashboard-empty">
                  No hay datos suficientes para mostrar el gráfico.
                </div>
              )}
            </div>
          </article>

          {/* Errores frecuentes + última sesión en la misma card (más sentido) */}
          <article className="card dashboard-card">
            <h2 className="dashboard-card-title">
              <ExclamationTriangleIcon className="dashboard-icon" />
              En qué te estás equivocando más
            </h2>

            {hasErrores ? (
              <div style={{ display: "grid", gap: "0.6rem" }}>
                {(data.erroresFrecuentes || []).slice(0, 3).map((e, idx) => (
                  <div
                    key={e.etiqueta || idx}
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.85rem 0.9rem",
                      background: "rgba(0,0,0,0.02)"
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {e.texto}
                    </div>
                    <div style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: "0.92rem" }}>
                      Detectado {e.veces} vez/veces recientemente.
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                Cuando completes ejercicios, aquí verás patrones de error y concepciones alternativas frecuentes.
              </div>
            )}

            {/* Separador */}
            <div style={{ height: 1, background: "var(--color-border)", margin: "1rem 0" }} />

            {/* Última sesión */}
            <h3 className="dashboard-last-title" style={{ marginBottom: 6 }}>
              Resumen de la última sesión
            </h3>

            <div className="dashboard-last">
              <h4 className="dashboard-last-title">
                {data.ultimaSesion.tituloEjercicio || "Aún no hay sesión registrada"}
              </h4>

              <p className="dashboard-last-text">{data.ultimaSesion.analisis}</p>

              <p className="dashboard-last-advice">
                <span>Consejo del tutor:</span> {data.ultimaSesion.consejo}
              </p>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
