import { useEffect, useState } from "react";
import axios from "axios"; // Usamos axios para consistencia y la URL base
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";

const initialState = {
  porcentajeAciertos: 0,
  objetivoSemanal: { realizados: 0, objetivo: 15 },
  actividadSemanal: [],
  resumenSesion: { analisis: "", consejo: "" },
  recomendaciones: [],
  conceptosDominados: [],
};

export default function Dashboard() {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(true);

  // NOTA: Este ID debe venir de tu sistema de login en el futuro.
  const MOCK_USER_ID = "681cd8217918fbc4fc7a626f";

  useEffect(() => {
    // CORRECCIÓN: Usamos axios y añadimos el ID de usuario a la URL para que coincida con la ruta del backend.
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/progreso/${MOCK_USER_ID}`)
      .then((res) => {
        // Verificamos si la respuesta tiene datos antes de actualizar el estado
        if (res.data) {
          setData(res.data);
        }
      })
      .catch(error => {
        console.error("Error al cargar los datos del progreso:", error);
        // En caso de error, es bueno mantener el estado inicial o mostrar un mensaje.
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // El array vacío [] asegura que se ejecute solo una vez.

  const radio = 40;
  const circunferencia = 2 * Math.PI * radio;
  const relleno = circunferencia - (circunferencia * (data.porcentajeAciertos || 0) / 100);

  if (loading) {
    return <div className="text-center p-10">Cargando tu progreso...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-10">
      <h1 className="text-3xl font-bold text-center text-dark mb-8">Tu progreso</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6 text-center flex flex-col items-center justify-center">
          <div className="relative w-40 h-40">
             <svg viewBox="0 0 100 100" className="w-full h-full">
               <circle cx="50" cy="50" r={radio} stroke="#e5e7eb" strokeWidth="12" fill="none" />
               <circle
                 cx="50" cy="50" r={radio} stroke="#E72621" strokeWidth="12" fill="none"
                 strokeDasharray={circunferencia} strokeDashoffset={relleno}
                 strokeLinecap="round" transform="rotate(-90 50 50)"
               />
             </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-dark">
              {data.porcentajeAciertos || 0}%
            </span>
          </div>
          <p className="mt-4 text-sm text-gray-600">Porcentaje de aciertos</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-md font-semibold text-dark mb-4">Actividad semanal</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.actividadSemanal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="ejercicios" stroke="#E72621" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-md font-semibold text-dark mb-4">Objetivo semanal</h2>
          <p className="text-sm text-gray-700 mb-2">
            Has realizado {data.objetivoSemanal.realizados} de {data.objetivoSemanal.objetivo} ejercicios esta semana.
          </p>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-red-600 h-4 rounded-full"
              style={{ width: `${(data.objetivoSemanal.realizados / data.objetivoSemanal.objetivo) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-md font-semibold text-dark mb-4">Resumen de la última sesión</h2>
          <p className="text-sm text-gray-700 mb-2">
            {data.resumenSesion.analisis}
          </p>
          <p className="text-sm font-medium text-rojo">
            Consejo: {data.resumenSesion.consejo}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-md font-semibold text-dark mb-4">Recomendaciones personalizadas</h2>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            {data.recomendaciones.map((rec, idx) => (
              <li key={idx}>💡 {rec}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-md font-semibold text-dark mb-4">Conceptos dominados</h2>
        <ul className="flex flex-wrap gap-4">
          {data.conceptosDominados.map((c, idx) => (
            <li key={idx} className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm">
              ✔️ {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}