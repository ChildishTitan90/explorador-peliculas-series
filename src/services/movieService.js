import {
    fetchPopularMovies as loadPopularMovies,
    fetchPopularSeries as loadPopularSeries,
} from './interfaceApi.js';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const LANGUAGE = 'es-MX';

export async function fetchRandomHomeCatalog(signal) {
    const randomPage = () => Math.floor(Math.random() * 5) + 1;
    const [movies, series] = await Promise.all([
        loadPopularMovies(randomPage(), signal),
        loadPopularSeries(randomPage(), signal),
    ]);
    const catalog = [...movies, ...series];

    for (let index = catalog.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [catalog[index], catalog[randomIndex]] = [catalog[randomIndex], catalog[index]];
    }

    return {
        featured: catalog.slice(0, 5),
        catalog: catalog.slice(5),
    };
}

// Obtener películas populares
export const fetchPopularMovies = async () => {
    try {
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=${LANGUAGE}&page=1`);
        const data = await response.json();
        // propiedad 'media_type' para identificar que son películas
        return data.results.map(movie => ({ ...movie, media_type: 'movie' }));
    } catch (error) {
        console.error('Error al obtener películas:', error);
        return [];
    }
};

// Obtener series populares de TV
export const fetchPopularSeries = async () => {
    try {
        const response = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=${LANGUAGE}&page=1`);
        const data = await response.json();
        // Nota: Las series de TV usan 'name' en lugar de 'title' tons toca normalizarlo
        return data.results.map(serie => ({
            ...serie,
            title: serie.name, // Normalizamos
            release_date: serie.first_air_date, // Normalizamos la fecha
            media_type: 'tv'
        }));
    } catch (error) {
        console.error('Error al obtener series:', error);
        return [];
    }
};

// Obtener un catálogo combinado
export const fetchMixedCatalog = async () => {
    try {
        const [movies, series] = await Promise.all([
            fetchPopularMovies(),
            fetchPopularSeries()
        ]);

        // Combinamos ambos arreglos para tener de todo en la cuadrícula
        const combined = [...movies, ...series];

        // los revolvemos para que no salgan puras películas primero
        return combined.sort(() => Math.random() - 0.5);
    } catch (error) {
        console.error('Error al combinar catálogo:', error);
        return [];
    }
};

// Búsqueda general (Busca películas y series automáticamente)
export const searchMovies = async (query) => {
    if (!query.trim()) return [];
    try {
        const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=${LANGUAGE}&query=${encodeURIComponent(query)}`);
        const data = await response.json();

        // Normalizamos resultados para que las series tengan la propiedad 'title' uniforme
        return data.results.map(item => ({
            ...item,
            title: item.title || item.name,
            release_date: item.release_date || item.first_air_date
        }));
    } catch (error) {
        console.error('Error al buscar contenido:', error);
        return [];
    }
};
