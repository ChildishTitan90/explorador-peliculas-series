# Cinepollis — Explorador de películas y series

Proyecto desarrollado para el **Tema 3: Programación del lado del cliente — Manejo de frameworks**.

Cinepollis es una aplicación web que permite explorar películas y series, buscar títulos, consultar sus detalles y organizar colecciones personales.

- [Aplicación publicada](https://explorador-peliculas-series.vercel.app/)
- [Repositorio en GitHub](https://github.com/ChildishTitan90/explorador-peliculas-series)

## 1. Objetivo

Aplicar los conceptos de componentes, comunicación mediante propiedades, manejo de estado, eventos y renderizado dinámico utilizando React.

La aplicación utiliza arreglos de objetos obtenidos de The Movie Database (TMDb). Aunque la actividad permite utilizar datos locales y no exige consumir una API, se incorporó este servicio para mostrar un catálogo actualizado.

## 2. Tecnologías utilizadas

| Tecnología | Uso en el proyecto |
|---|---|
| React 19 | Construcción de componentes y actualización de la interfaz. |
| React DOM | Renderizado de la aplicación en el navegador. |
| Vite 8 | Servidor de desarrollo y generación de la versión de producción. |
| JavaScript y JSX | Lógica, eventos y estructura de los componentes. |
| CSS | Diseño visual y adaptación a diferentes pantallas. |
| Fetch API | Consultas HTTP a TMDb. |
| localStorage | Persistencia de las colecciones en el navegador. |
| ESLint | Revisión estática del código. |
| Git y GitHub | Control de versiones y colaboración. |
| Vercel | Publicación del sitio. |

React permite dividir la interfaz en componentes reutilizables y actualizar lo mostrado cuando cambia el estado. Estos conceptos se describen en la [documentación oficial de React](https://es.react.dev/learn).

El proyecto no utiliza un backend propio ni una base de datos. Node.js se emplea para ejecutar las herramientas de desarrollo y compilación.

## 3. Instalación de Node.js y npm

Para preparar el entorno en Windows:

1. Acceder a la [página oficial de Node.js](https://nodejs.org/en/download).
2. Descargar una versión LTS compatible con Vite.
3. Ejecutar el instalador de Windows y conservar la instalación de npm.
4. Abrir nuevamente la terminal o Visual Studio Code.
5. Comprobar la instalación:

```powershell
node --version
npm --version
```

Ambos comandos deben mostrar su número de versión. npm permite instalar las dependencias y ejecutar los comandos definidos en `package.json`.

En el entorno revisado se detectaron Node.js `24.9.0` y npm `11.17.0`.

## 4. Creación de un proyecto con React y Vite

El procedimiento para crear la estructura inicial con la plantilla de React y JavaScript es:

```powershell
npm create vite@latest cinepollis -- --template react
cd cinepollis
npm install
npm run dev
```

La plantilla configura React, Vite y los archivos iniciales. Este procedimiento está basado en la [guía oficial de Vite](https://vite.dev/guide/).

Estos comandos corresponden a la creación de un proyecto nuevo. Para ejecutar el repositorio existente se utiliza el procedimiento de la siguiente sección.

## 5. Instalación y ejecución del repositorio

### Descargar el proyecto

```powershell
git clone https://github.com/ChildishTitan90/explorador-peliculas-series.git
cd explorador-peliculas-series
npm ci
```

`npm ci` instala las versiones registradas en `package-lock.json`.

### Configurar el acceso a TMDb

Crear una cuenta en [TMDb](https://www.themoviedb.org/) y obtener una credencial desde la configuración de API.

En la raíz del proyecto, junto a `package.json`, crear un archivo `.env` a partir de `.env.example`.

Configurar una clave de API:

```env
VITE_TMDB_API_KEY=TU_CLAVE_DE_TMDB
```

Como alternativa, el servicio principal también admite un token de lectura:

```env
VITE_TMDB_READ_TOKEN=TU_TOKEN_DE_LECTURA
```

TMDb admite autenticación mediante el parámetro `api_key` o mediante un token Bearer en el encabezado `Authorization`. Si se configura el token, el servicio principal le da prioridad. [Documentación de autenticación](https://developer.themoviedb.org/docs/authentication-application).

El archivo `.env` está excluido del repositorio mediante `.gitignore`. Sin embargo, las variables con prefijo `VITE_` se incorporan al código del navegador y no deben considerarse secretos protegidos. [Documentación de variables de entorno](https://vite.dev/guide/env-and-mode).

### Iniciar el servidor

```powershell
npm run dev
```

Abrir la dirección indicada en la terminal, normalmente:

[http://localhost:5173](http://localhost:5173)

Si se modifica `.env`, reiniciar el servidor para cargar los nuevos valores.

## 6. Comandos disponibles

| Comando | Función |
|---|---|
| `npm run dev` | Iniciar el servidor de desarrollo. |
| `npm run build` | Generar la versión de producción en `dist/`. |
| `npm run preview` | Revisar localmente la versión compilada. |
| `npm run lint` | Revisar el código con ESLint. |

Para revisar la compilación:

```powershell
npm run build
npm run preview
```

`preview` permite comprobar el resultado de producción localmente.

## 7. Estructura del proyecto

```text
cinepollis/
├── public/
│   ├── images/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── application/
│   │   ├── controllers.jsx
│   │   ├── useAppController.js
│   │   └── useResource.js
│   ├── components/
│   │   ├── Icon.jsx
│   │   ├── ModalView.jsx
│   │   └── ui.jsx
│   ├── presentation/
│   │   └── moviePresentation.js
│   ├── screens/
│   │   ├── HomeScreen.jsx
│   │   ├── CatalogScreen.jsx
│   │   ├── CollectionScreen.jsx
│   │   ├── DetailScreen.jsx
│   │   └── SeasonScreen.jsx
│   ├── services/
│   │   ├── interfaceApi.js
│   │   └── movieService.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── .env.example
├── index.html
├── package.json
├── package-lock.json
├── eslint.config.js
└── vite.config.js
```

## 8. Componentes y responsabilidades

| Componente o módulo | Responsabilidad |
|---|---|
| `App` | Organizar la navegación, las pantallas y las ventanas modales. |
| `HomeScreen` | Mostrar el carrusel y las recomendaciones del inicio. |
| `CatalogScreen` | Presentar búsqueda, filtros, tarjetas y paginación. |
| `CollectionScreen` | Mostrar favoritos, pendientes y títulos vistos. |
| `DetailScreen` | Presentar sinopsis, año, duración o temporadas y acciones. |
| `SeasonScreen` | Mostrar los episodios de una temporada. |
| `Card` | Representar una película o serie mediante una tarjeta. |
| `Grid` | Generar una cuadrícula de tarjetas desde un arreglo. |
| `Search` | Capturar el texto y activar la búsqueda. |
| `Status` | Mostrar carga, errores y opciones de reintento. |
| `ModalView` | Mostrar el tráiler o el enlace para compartir. |
| `Brand`, `Button`, `Heading`, `Icon` | Reutilizar elementos comunes de la interfaz. |

Los controladores de `controllers.jsx` obtienen y preparan los datos. Las pantallas reciben esos datos y las funciones de interacción mediante **props**.

Por ejemplo:

```jsx
<Grid items={items} saved={saved} toggle={toggle} />
```

`items` contiene las historias, `saved` representa las colecciones y `toggle` permite agregar o retirar un título.

## 9. Estado, eventos y renderizado dinámico

La aplicación utiliza:

- **`useState`:** texto de búsqueda, filtros, paginación, selección del carrusel y colecciones.
- **`useEffect`:** consultas, temporizadores, persistencia y escucha de cambios de navegación.
- **`useRef`:** referencias a elementos y temporizadores.
- **`useCallback`:** mantener estable la función utilizada por el buscador.

Los eventos `onClick`, `onChange` y `onSubmit` conectan las acciones del usuario con cambios de estado.

Las tarjetas se generan con `map()` y los filtros se aplican con `filter()`. Cada elemento utiliza una clave que combina su tipo e identificador, por ejemplo `movie:157336`.

Cuando cambia el estado, React actualiza la interfaz. El renderizado condicional permite mostrar el catálogo, un indicador de carga, un error o un mensaje de resultados vacíos.

## 10. Uso de la API

Las consultas principales están centralizadas en `interfaceApi.js`. El inicio utiliza además `fetchRandomHomeCatalog`, definido en `movieService.js`.

La dirección base es:

```text
https://api.themoviedb.org/3
```

Las solicitudes utilizan `fetch`, `async/await` y respuestas JSON.

### Consultas utilizadas

| Endpoint | Información |
|---|---|
| `/movie/popular` | Películas populares. |
| `/tv/popular` | Series populares. |
| `/search/movie` | Búsqueda de películas. |
| `/search/tv` | Búsqueda de series. |
| `/movie/{id}` | Detalles de una película. |
| `/tv/{id}` | Detalles de una serie. |
| `/tv/{id}/season/{number}` | Episodios de una temporada. |

En los detalles se utiliza `append_to_response` para solicitar créditos, videos, recomendaciones y proveedores junto con la información principal.

Las peticiones configuran el idioma `es-MX`, aunque algunos textos pueden no estar disponibles en español.

### Normalización de datos

TMDb utiliza campos distintos para películas y series. La función `normalize` unifica los datos que necesita la interfaz:

- `title`: título de película o nombre de serie.
- `release_date`: fecha de estreno o primera emisión.
- `media_type`: `movie` o `tv`.

Esto permite reutilizar las mismas tarjetas para ambos tipos de contenido.

### Imágenes

Las imágenes se obtienen combinando una dirección base, un tamaño y la ruta devuelta por TMDb. El proyecto utiliza tamaños como `w500`, `w780` y `original`. [Documentación de imágenes](https://developer.themoviedb.org/docs/image-basics).

Cuando no existe una ruta de imagen se utiliza `placeholder.svg`.

### Carga y errores

`useResource` administra:

- Datos recibidos.
- Estado de carga.
- Mensajes de error.
- Reintentos.
- Cancelación de consultas mediante `AbortController`.

También evita que una respuesta de una consulta anterior actualice una pantalla que ya cambió.

## 11. Funcionamiento general

### Inicio

Consulta películas y series populares de páginas elegidas aleatoriamente entre las primeras cinco. Mezcla los resultados, reserva cinco títulos para el carrusel y utiliza el resto en las recomendaciones.

Con las respuestas habituales de veinte elementos por consulta, se obtienen cuarenta títulos: cinco destacados y treinta y cinco tarjetas.

### Búsqueda

El buscador espera **350 milisegundos después de dejar de escribir** antes de consultar la API. Enter y el botón “Buscar” ejecutan la búsqueda inmediatamente.

En Películas consulta películas; en Series consulta series; en Explorar consulta ambas. Al cambiar el término, reinicia la paginación y el filtro. Al borrar el texto, vuelve al catálogo popular.

### Filtros

Explorar permite filtrar por tipo. Películas y Series ofrecen filtros de género.

Los filtros se aplican a los resultados de la página cargada, no a todo el catálogo de TMDb.

### Detalles

Seleccionar una tarjeta abre una pantalla con título, sinopsis, año, calificación, géneros, duración o temporadas, créditos y recomendaciones.

También permite consultar disponibilidad en México y reproducir un tráiler de YouTube cuando existe un video adecuado.

### Colecciones

Se pueden agregar y retirar títulos de:

- Favoritos.
- Quiero ver.
- Ya vi.

Los cambios se guardan en `localStorage` con la clave `cinepollis.collection`. Permanecen al recargar el mismo sitio en el mismo navegador.

Las colecciones no se sincronizan entre dispositivos ni con una cuenta de TMDb.

## 12. Navegación y diseño adaptable

La navegación utiliza el fragmento de la URL y el evento `hashchange`, sin React Router.

Ejemplos:

```text
#/
#/explorar
#/peliculas
#/series
#/favoritos
#/quiero-ver
#/ya-vi
#/pelicula/157336
#/serie/70523
```

El diseño utiliza CSS Grid, Flexbox y consultas de medios. En pantallas pequeñas se muestra una navegación inferior y una sola columna de tarjetas.

Se incluyen etiquetas accesibles, navegación del carrusel mediante teclado, control de foco en modales y respeto por la preferencia de reducir movimiento.

## 13. Relación con los requisitos de la actividad

| Requisito | Implementación |
|---|---|
| Catálogo de al menos veinte títulos mediante un arreglo de objetos | Arreglos obtenidos de las consultas de películas y series; cuadrícula del inicio. |
| Tarjetas con imagen, título y género | Componente `Card`. |
| Búsqueda por título | `Search` y consultas de búsqueda de TMDb. |
| Filtros por género o tipo | Filtros del controlador `Catalog`. |
| Información detallada | `DetailScreen` y `SeasonScreen`. |
| Marcar y desmarcar favoritos | Función `toggle`. |
| Sección de favoritos | `CollectionScreen`. |
| Componentes, estado y eventos | Componentes funcionales, props y hooks de React. |
| Interfaz adaptable | Reglas responsive en CSS. |

## 14. Guía de pruebas y demostración

Antes de entregar, comprobar:

| Prueba | Resultado esperado |
|---|---|
| Abrir el inicio | Carrusel y catálogo con al menos veinte tarjetas cuando la API responde normalmente. |
| Escribir un título | Actualización de resultados después de la pausa de escritura. |
| Borrar la búsqueda | Regreso al catálogo popular. |
| Aplicar un filtro | Mostrar únicamente coincidencias dentro de los resultados cargados. |
| Seleccionar una tarjeta | Mostrar la información del título correcto. |
| Agregar un favorito | Aparecer en la sección Favoritos. |
| Recargar la página | Conservar los favoritos guardados. |
| Retirar un favorito | Desaparecer de la colección. |
| Cambiar de página | Cargar otro grupo de resultados. |
| Abrir un tráiler | Reproducirlo o informar que no está disponible. |
| Cambiar el ancho de la ventana | Adaptar tarjetas y navegación. |
| Ejecutar `npm run build` | Generar la compilación de producción. |

Esta tabla es una guía de comprobación; no representa una suite de pruebas automatizadas.

Para la demostración en clase se puede seguir el recorrido: inicio, búsqueda, filtros, detalles, favoritos y recarga para mostrar persistencia.

## 15. Despliegue y consideraciones

La compilación genera archivos estáticos en `dist/`. Para desplegar en Vercel se configura:

- Framework: Vite.
- Comando de compilación: `npm run build`.
- Directorio de salida: `dist`.
- Credencial de TMDb mediante las variables de entorno del despliegue.

El catálogo requiere conexión a internet y disponibilidad de TMDb. La reproducción de videos depende de YouTube.

La búsqueda escrita se conserva en el estado de la pantalla y no modifica automáticamente la URL. Los cambios de género filtran la página actual.

La aplicación es un explorador de información: no reproduce las películas o series completas.

## 16. Créditos

Los datos e imágenes del catálogo proceden de The Movie Database.

Este producto utiliza la API de TMDb, pero TMDb no lo respalda ni certifica.