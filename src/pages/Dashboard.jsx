import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";
import { ChatBubbleLeftRightIcon, ChartBarIcon, CalendarDaysIcon, FireIcon, SparklesIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';

// --- PASO 1: Definimos la nueva "forma" de los datos que esperamos del backend ---
const initialState = {
  interaccionesMedias: 0,
  eficienciaPorConcepto: [], // Un array de objetos: [{ concepto: 'Ley de Ohm', interacciones: 4.1 }, ...]
  resumenSemanal: {
    ejerciciosCompletados: 0,
    conceptosDistintos: 0,
    rachaDias: 0
  },
  ultimaSesion: {
    tituloEjercicio: "",
    analisis: "Completa un ejercicio para ver aquí tu resumen.",
    consejo: "¡Mucho ánimo!"
  }
};

export default function Dashboard() {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(true);

  // NOTA: Este ID debe venir de tu sistema de login en el futuro.
  const MOCK_USER_ID = "681cd8217918fbc4fc7a626f";

  useEffect(() => {
    // La llamada al backend sigue siendo la misma, pero ahora esperamos
    // que la respuesta de /api/progreso/ tenga la nueva estructura de datos.
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/progreso/${MOCK_USER_ID}`)
      .then((res) => {
        if (res.data) {
          // Si faltan datos en la respuesta, los rellenamos con los iniciales para evitar errores
          const fullData = { ...initialState, ...res.data };
          setData(fullData);
        }
      })
      .catch(error => {
        console.error("Error al cargar los datos del progreso:", error);
        // En caso de error, mostramos el estado inicial para que la página no se rompa.
        setData(initialState);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // El array vacío [] asegura que se ejecute solo una vez.

  if (loading) {
    return <div className="text-center p-10 text-xl text-gray-600">Cargando tu progreso...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 space-y-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Tu Progreso</h1>

      {/* --- FILA 1: Métricas Principales (Resumen Semanal y Eficiencia General) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tarjeta: Resumen Semanal */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
            <CalendarDaysIcon className="h-6 w-6 mr-3 text-red-500"/>
            Actividad de los Últimos 7 Días
          </h2>
          <div className="flex flex-col sm:flex-row justify-around items-center text-center space-y-4 sm:space-y-0 h-full">
            <div className="flex flex-col items-center p-2">
              <span className="text-4xl font-bold text-red-600">{data.resumenSemanal.ejerciciosCompletados}</span>
              <span className="text-sm text-gray-500 mt-1">Ejercicios Completados</span>
            </div>
            <div className="h-16 w-px bg-gray-200 hidden sm:block"></div>
            <div className="flex flex-col items-center p-2">
              <span className="text-4xl font-bold text-red-600">{data.resumenSemanal.conceptosDistintos}</span>
              <span className="text-sm text-gray-500 mt-1">Conceptos Practicados</span>
            </div>
            <div className="h-16 w-px bg-gray-200 hidden sm:block"></div>
            <div className="flex flex-col items-center p-2">
              <span className="text-4xl font-bold text-red-600 flex items-center">
                {data.resumenSemanal.rachaDias} <FireIcon className="h-8 w-8 text-negro-400 ml-1"/>
              </span>
              <span className="text-sm text-gray-500 mt-1">Días de Racha</span>
            </div>
          </div>
        </div>

        {/* Tarjeta: Interacciones Medias por Ejercicio */}
        <div className="bg-white rounded-xl shadow-md p-6 text-center flex flex-col justify-center items-center border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-2 flex items-center">
            <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2 text-red-500"/>
            Eficiencia General
          </h2>
          <p className="text-6xl font-bold text-red-600">{data.interaccionesMedias.toFixed(1)}</p>
          <p className="mt-1 text-sm text-gray-500">Interacciones medias / ejercicio</p>
        </div>
      </div>

      {/* --- FILA 2: Desglose por Concepto y Última Sesión --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gráfico: Análisis de Eficiencia por Concepto */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-3 text-red-500"/>
            Eficiencia por Concepto
          </h2>
          <p className="text-xs text-gray-500 mb-4 -mt-2">Muestra las interacciones medias que necesitas para cada tema. Barras más largas indican mayor dificultad.</p>
          <ResponsiveContainer width="100%" height={300}>
            {data.eficienciaPorConcepto.length > 0 ? (
              <BarChart data={data.eficienciaPorConcepto} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="concepto" width={120} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{fill: '#fef2f2'}} contentStyle={{backgroundColor: '#fff', border: '1px solid #ddd'}}/>
                <Bar dataKey="interacciones" name="Interacciones Medias" fill="#ef4444" barSize={20} />
              </BarChart>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No hay datos suficientes para mostrar el gráfico.</div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Tarjeta: Resumen de la Última Sesión */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 flex flex-col">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
            Resumen de la Última Sesión
          </h2>
          <div className="bg-gray-100 rounded-lg p-4 flex-grow flex flex-col justify-center">
            <h3 className="font-bold text-gray-800">{data.ultimaSesion.tituloEjercicio}</h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">
              {data.ultimaSesion.analisis}
            </p>
            <p className="text-sm font-semibold text-red-800 border-t border-gray-300 pt-3">
              <span className="font-bold">Consejo del tutor:</span> {data.ultimaSesion.consejo}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}