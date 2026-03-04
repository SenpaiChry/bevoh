import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Log dell'errore (magari verso un servizio esterno come Sentry in produzione)
    console.error(`404 - Rotta non trovata: ${location.pathname}`);
    
    // Aggiorna il titolo della scheda nel browser
    document.title = "404 - Pagina non trovata";
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white px-4">
      <div className="text-center">
        {/* Un tocco visivo più marcato */}
        <h1 className="text-9xl font-extrabold text-white tracking-widest">404</h1>
        <div className="bg-blue-500 px-2 text-sm rounded rotate-12 absolute">
          Pagina non trovata
        </div>
        
        <p className="text-gray-400 mt-8 mb-8 text-lg">
          L'indirizzo <span className="text-blue-400 italic font-mono">"{location.pathname}"</span> non esiste.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-white hover:bg-white hover:text-black transition-colors rounded"
          >
            Torna indietro
          </button>
          
          <Link 
            to="/" 
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Home Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;