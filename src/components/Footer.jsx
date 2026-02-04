import logoUPV from "../assets/logo-upv.png";

export default function Footer() {
  return (
    <footer className="w-full bg-dark text-gray-300 text-sm mt-16">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">

        {/* Logo UPV */}
        <div className="flex-shrink-0">
          <img
            src={logoUPV}
            alt="Universitat Politècnica de València"
            className="h-12 opacity-90"
          />
        </div>

        {/* Información */}
        <div className="text-center md:text-right leading-relaxed">
          <p className="font-medium text-gray-200">
            Autora: Clara García Angulo
            </p>

            <p className="text-gray-300">
            Contacto:&nbsp;
            <a
                href="mailto:asperez@upv.es"
                className="text-gray-300 hover:text-red transition-colors"
            >
                asperez@upv.es
            </a>,{" "}
            <a
                href="mailto:macasu@upv.es"
                className="text-gray-300 hover:text-red transition-colors"
            >
                macasu@upv.es
            </a>,{" "}
            <a
                href="mailto:vtorres@upv.es"
                className="text-gray-300 hover:text-red transition-colors"
            >
                vtorres@upv.es
            </a>
            </p>

          <p className="text-xs text-gray-400 mt-2">
            Trabajo Fin de Grado · Uso académico
          </p>
        </div>
      </div>
    </footer>
  );
}
