const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const LANGUAGE = 'es-MX'; // Para obtener las sinopsis y títulos en español

// Obtener solo las películas populares (ideal para un banner principal o sección "Tendencias")
export const fetchPopularMovies = async () => {
    try {
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=${LANGUAGE}&page=1`);
        const data = await response.json();
        return data.results; // Regresa 20 películas
    } catch (error) {
        console.error('Error al obtener películas populares:', error);
        return [];
    }
};

// Obtener un catálogo amplio de 50-60 películas (combinando páginas 1, 2 y 3) para el dashboard
export const fetchCatalogMovies = async () => {
    try {
        const pagesToFetch = [1, 2, 3];
        const requests = pagesToFetch.map(page =>
            fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=${LANGUAGE}&page=${page}`)
                .then(res => res.json())
        );

        const responses = await Promise.all(requests);
        const combinedMovies = responses.flatMap(data => data.results);

        return combinedMovies; // Regresa ~60 películas únicas para la cuadrícula
    } catch (error) {
        console.error('Error al obtener el catálogo amplio:', error);
        return [];
    }
};

// Búsqueda general (para cuando tus compañeros programen la barra de búsqueda)
export const searchMovies = async (query) => {
    if (!query.trim()) return [];
    try {
        const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=${LANGUAGE}&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error al buscar contenido:', error);
        return [];
    }
};

// Obtener detalles completos de una película/serie (para cuando seleccionen una tarjeta)
export const fetchMovieDetails = async (id, type = 'movie') => {
    try {
        const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=${LANGUAGE}&append_to_response=videos`);
        const data = await response.json();
        return data; // Incluye sinopsis, duración, géneros y videos (tráilers)
    } catch (error) {
        console.error('Error al obtener los detalles:', error);
        return null;
    }
};