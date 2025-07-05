


import { Link } from "react-router-dom";
import { ChartBarIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="home">
      {/* HERO */}
      <section className="text-center">
        <h1 className="titulo">Tutor Virtual</h1>
        <p className="descripcion">
          Un tutor que se adapta a ti. Aprende, corrige, refuerza. 
        </p> 
        <div>
          <a href="/ejercicios" className=" btn-enviar ">
            Empezar ahora
          </a>
        </div>
      </section>

      

      {/* FUNCIONALIDADES
      <section className="funcionalidades">
        <Link to="/filtro">
          <div className="card card-funcion">
            <MagnifyingGlassIcon className="icono-funcion" />
            <h3 className="titulo-funcion">Ejercicios</h3>
            <p className="texto-funcion">Encuentra tus ejercicios.</p>
          </div>
        </Link>

        <Link to="/interacciones">
          <div className="card card-funcion">
            <ChatBubbleLeftRightIcon className="icono-funcion" />
            <h3 className="titulo-funcion">Tu chat</h3>
            <p>Habla con el tutor y corrige tus dudas.</p>
          </div>
        </Link>

        <Link to="/dashboard">
          <div className="card card-funcion">
            <ChartBarIcon className="icono-funcion" />
            <h3 className="titulo-funcion">Tu progreso</h3>
            <p className="texto-funcion">Consulta tu evolución y repasos recomendados.</p>
          </div>
        </Link>
      </section> */}

    <div className="bg-white rounded-xl text-center shadow p-6">
          <h2 className="text-md font-semibold text-dark mb-4">Resumen de la última sesión</h2>
          <p className="text-sm  text-gray-700 mb-2">
            Has trabajado 3 ejercicios. Fallaste en la identificación de la resistencia equivalente y en la aplicación de la ley de Norton.
          </p>
          <p className="text-sm font-medium text-rojo">
            Consejo: Deberías revisar la Ley de Ohm, especialmente el concepto de resistencia equivalente.
          </p>
        </div>

      {/* FINAL */}
      <section className="frase-final">
        <p>“Entender un error es avanzar dos veces.”</p>
      </section>
    </div>
  );
}

