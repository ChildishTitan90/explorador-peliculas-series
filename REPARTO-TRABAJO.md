# Reparto del frontend de Cinepollis

## Pablo: pantallas y presentación
- `src/screens/`: Inicio, catálogo/búsqueda, colección, detalle y temporadas.
- `src/components/ui.jsx`, `ModalView.jsx`, `Icon.jsx`: tarjetas, botones, buscador y ventanas.
- `src/App.css`, `src/index.css`, `public/images/`: diseño y adaptación móvil.
- `src/presentation/moviePresentation.js`: textos, enlaces e imágenes para mostrar los datos.

Las pantallas reciben datos y callbacks por props; no consultan TMDb ni acceden al almacenamiento. El estado del carrusel, las pestañas de detalle y el control de foco de ventanas son comportamiento visual.

## Compañero 1: datos y TMDb
- `src/services/movieService.js`: trabajo original de develop, conservado sin cambios.
- `src/services/interfaceApi.js`: ampliaciones adelantadas como referencia, en archivo separado.
- `src/application/controllers.jsx`: carga, búsqueda, filtros, paginación, detalle y temporadas.
- `src/application/useResource.js`: carga, errores, cancelación y reintentos.

Los controladores usan temporalmente `interfaceApi.js` para conservar el funcionamiento de la demostración. Pueden migrar sus consultas al servicio del equipo y cambiar ese import sin tocar las pantallas.

## Compañero 2: colecciones y acciones
- `src/application/useAppController.js`: favoritos, quiero ver, ya vi, persistencia y navegación.
- Controlador `Modal` en `src/application/controllers.jsx`: elección de tráiler y copia de enlace.

## Contratos entre las partes
- Una historia conserva `id`, `media_type` (`movie` o `tv`), `title`, `release_date`, `vote_average`, `poster_path`, `backdrop_path` y `genre_ids` o `genres`.
- `saved`: objeto con listas `favoritos`, `quiero-ver`, `ya-vi`.
- `toggle(lista, historia)`: agrega o retira una historia de esa lista.
- `resource`: `{data, loading, error, retry}` para las pantallas con consultas.
- `onSearch(titulo)`: recibe el texto del buscador.
- `openModal(tipo, historia)`: abre `trailer` o `share`.

La lógica adelantada sigue activa como referencia funcional; no representa trabajo pendiente que ya hayan realizado los compañeros. Su responsabilidad es revisarla, sustituirla o ampliarla en esos módulos. Los cambios se proponen desde Interfaz-con-API hacia develop mediante un PR; la rama develop no se modifica hasta que el equipo lo apruebe y mezcle.
