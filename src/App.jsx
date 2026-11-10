import { useEffect, useState } from 'react';
import { fetchPopularMovies, fetchCatalogMovies } from './services/movieService';

function App() {
  const [populars, setPopulars] = useState([]);
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    // Cargamos los datos para ambas secciones en paralelo
    const loadDashboardData = async () => {
      const popularData = await fetchPopularMovies();
      const catalogData = await fetchCatalogMovies();

      setPopulars(popularData);
      setCatalog(catalogData);

      console.log("Tendencias/Populares cargadas:", popularData.length);
      console.log("Catálogo del dashboard cargado:", catalogData.length);
    };

    loadDashboardData();
  }, []);

  return (
    <div style={{ padding: '20px', color: '#fff', backgroundColor: '#121212', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1>CineSpot Dashboard 🎬</h1>

      <section style={{ marginBottom: '30px' }}>
        <h2>🔥 Tendencias Populares ({populars.length})</h2>
        <p>Para el banner principal o carrusel.</p>
      </section>

      <section>
        <h2>📚 Catálogo Completo para Explorar ({catalog.length} películas)</h2>
        <p>Para la cuadrícula principal de tarjetas donde vamos a implementar filtros y búsqueda[cite: 2].</p>
      </section>
    </div>
  );
}

export default App;
