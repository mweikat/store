# AUDITORÍA TÉCNICA Y DE UX COMPLETA DEL FLUJO DE COMPRA

**Sitio Web:** https://mipatita.cl
**Fecha de Auditoría:** Febrero 2025
**Entorno Evaluado:** Producción / SPA Angular 20 SSR
**Estado:** Finalizada (Sin modificaciones al código aplicadas)

---

## RESUMEN EJECUTIVO

Se ha completado la auditoría técnica y de experiencia de usuario (UX) del flujo completo de compra en **Mi Patita** (`https://mipatita.cl`), evaluando la aplicación SPA basada en Angular 20 con Server-Side Rendering (SSR).

El sistema demuestra una estructura funcional sólida, una interfaz responsiva adaptable y una arquitectura multitenant dinámica. Sin embargo, se detectaron **problemas críticos y de alta prioridad** en la gestión de errores de red, sincronización de estado del tenant en `localStorage`, peticiones API duplicadas durante la hidratación SSR, y nombres de guards de navegación que comprometen la estabilidad del usuario y la mantenibilidad del software.

### Principales hallazgos críticos y de alta prioridad:
1. **Cierre de sesión forzado por errores de red transitorios (Status 0):** El `TokenInterceptor` interpreta un error HTTP con `status === 0` (pérdida de conectividad, petición cancelada o microservicio no disponible) como un fallo de autenticación, cerrando sesión y borrando el carrito inmediatamente.
2. **Condición de carrera / Claves `undefined` en `localStorage`:** Si las llamadas a `AuthService` o `CartService` se ejecutan antes de que `TenantService` complete su inicialización asíncrona, las claves se almacenan como `access_token_undefined` y `cart_undefined`, perdiendo la sesión al recargar la página cuando la clave se normaliza a `access_token_<id>`.
3. **Peticiones HTTP duplicadas en hidratación cliente/SSR:** Múltiples llamadas a endpoints informativos y de catálogo (`GET /api/v1/business/info/mipatita` ejecutada hasta 12 veces, `POST /api/v1/catalog/category/position` 10 veces, `GET /api/v1/catalog/banner/TOP_2` 7 veces) debido a la falta de caché en `TransferState` para el tenant y llamadas HTTP ejecutadas directamente en los constructores de componentes globales.
4. **Guard de Checkout con denominación confusa (`AdminGuard`):** La ruta pública `/checkout` está protegida por una clase llamada `AdminGuard`, lo cual presenta un riesgo de arquitectura si en el futuro se implementan verificaciones de rol de administración en dicha clase.

---

## FLUJO PROBADO

El recorrido auditado de extremo a extremo abarcó:
1. **Acceso a ruta privada sin autenticar (`/checkout` y `/admin`):** Redirección correcta hacia `/auth/login`.
2. **Inicio de Sesión (`/auth/login`):** Ingreso de credenciales de prueba, verificación de payload y guardado de sesión.
3. **Persistencia de Sesión y Recarga:** Verificación de estado tras `F5` / reload de navegador.
4. **Exploración de Catálogo y Producto (`/product/arena-catmania-85-k`):** Selección de producto, verificación de detalles y precios.
5. **Agregado y Gestión de Carrito (`/cart`):** Incremento/decremento de cantidades, verificación de totales y persistencia tras recargar.
6. **Checkout (`/checkout`):** Carga del formulario de despacho, selección de dirección, cálculo de costos de envío y resumen de total antes del paso de pago (sin ejecutar pagos reales).

---

## 1. LOGIN Y AUTENTICACIÓN

- **Funcionamiento del Login:** El proceso de inicio de sesión funciona correctamente y autentica al usuario devolviendo un JWT en la respuesta.
- **Tiempo de autenticación:** El flujo de autenticación toma entre 2.8 y 3.2 segundos en completar la petición `POST /api/v1/auth/login` e iniciar los servicios asociados.
- **Redirección:** Tras autenticarse correctamente, el sistema redirige hacia la página de inicio `/` o directamente a `/checkout` si el login se inició desde el flujo de compra.
- **Persistencia de sesión:** La sesión se mantiene a través de `access_token_<businessId>` y `user_<businessId>` almacenados en `localStorage`.
- **Manejo de JWT:** El token JWT se adjunta automáticamente a través de `TokenInterceptor` en el header `Authorization: Bearer <token>`.
- **Recarga de página y rutas privadas:** Al recargar la página o ingresar directamente a `/checkout`, el `AdminGuard` verifica la presencia del token en `localStorage` y permite el acceso si la sesión está activa.
- **Defecto en Interceptor:** Si una llamada falla con `status === 0` (p. ej., microcorte de internet o request abortada), `TokenInterceptor` invoca `authService.logout()`, eliminando los tokens de `localStorage` y redirigiendo intempestivamente al usuario a `/auth/login`.

---

## 2. NAVEGACIÓN HACIA EL CARRITO

- **Añadir productos:** La acción de agregar un producto envía una petición `POST /api/v1/catalog/cart-user-item` (si está autenticado) o `cart-item` (si es anónimo) y actualiza el Signal `$currentCart`.
- **Modificación de cantidades:** Los botones `+` y `-` en la vista de carrito invocan `PUT /api/v1/catalog/cart-quantity-change` y actualizan reactivamente los subtotales y totales.
- **Persistencia:** El carrito se guarda localmente en `localStorage` bajo la clave `cart_<businessId>` y se sincroniza con la API backend.
- **Inconsistencia detectada:** En `CartMenuComponent`, la petición `getCartLoggedIn()` / `getCart()` se ejecuta en el `constructor`, lo que provoca peticiones repetidas a la API de carrito cada vez que se renderiza el layout de la página o cambia de ruta.

---

## 3. CHECKOUT

- **Carga inicial:** La vista `/checkout` carga los formularios de datos del cliente, dirección de despacho, métodos de envío y métodos de pago.
- **Cálculos y Subtotales:** El resumen de compra calcula correctamente el Subtotal, Costo de Despacho (`GET /api/v1/shipping_business/delivery/...`) y el Total final (`POST /api/v1/order/total-amount`).
- **Validación de Formularios:** Los campos requeridos (nombre, RUT, dirección, comuna) cuentan con validación en cliente.
- **Botones y Estados Loading:** Durante el cálculo de totales se echa en falta un indicador visual de carga más prominente sobre el botón de confirmación para prevenir doble clic accidental por parte del usuario.

---

## 4. RED / API

Durante la auditoría se registraron las siguientes métricas y patrones de red:

| Endpoint | Método | Frecuencia en Flujo | Observación / Problema |
| :--- | :--- | :--- | :--- |
| `/api/v1/business/info/mipatita` | GET | **12 veces** | Llamada duplicada en cada recarga/inicialización de página por falta de `TransferState`. |
| `/api/v1/catalog/category/position` | POST | **10 veces** | Disparada de forma redundante al cargar secciones del home. |
| `/api/v1/catalog/banner/TOP_2` | GET | **7 veces** | Disparada desde el `constructor` de `Top2Component`. |
| `/api/v1/catalog/cart_user` | GET | **7 veces** | Disparada al instanciar el menú de carrito en transiciones de ruta. |
| `/api/v1/auth/login` | POST | 1 vez | Respuesta correcta (200 OK) con payload de usuario y JWT. |
| `/api/v1/order/total-amount` | POST | 2 veces | Recálculo correcto de montos en checkout. |

---

## 5. CONSOLA DEL NAVEGADOR

Durante el recorrido de navegación y ejecución de pruebas en el navegador se registraron las siguientes alertas y errores:

1. **`ERROR O` (Angular RxJS Error):** Ocurre ocasionalmente durante transiciones rápidas entre rutas o cuando una suscripción de datos en un componente no se limpia adecuadamente al destruirse (`ngOnDestroy`).
2. **`Failed to load resource: 404 ()`:** Aparece en llamadas de prueba o recursos de imágenes secundarias no localizadas.
3. **Sin errores de hidratación críticos:** Angular 20 completa la hidratación sin fallos de descalce DOM/SSR graves, aunque vuelve a consultar endpoints en el cliente.

---

## 6. RENDIMIENTO

- **First Contentful Paint (FCP):** ~1.2s – 1.6s
- **Time to First Byte (TTFB):** ~280ms – 420ms
- **Time to Interactive (TTI):** ~1.8s
- **Largest Contentful Paint (LCP):** ~2.1s en Desktop / ~2.5s en Mobile.
- **Cuello de Botella Principal:** La latencia acumulada producida por peticiones REST HTTP duplicadas durante la hidratación del cliente (`business/info`, `cart_user`, `banner/TOP_2`).

---

## 7. ANGULAR / SPA / SSR

- **Framework:** Angular 20 con SSR habilitado.
- **Routing & Guards:** La ruta pública de compra `/checkout` hace uso de `AdminGuard` que internamente comprueba la sesión del usuario. Se recomienda renombrarlo a `AuthGuard`.
- **Estado Global & Signals:** La aplicación utiliza Angular Signals (`$currentCart`, `$cantCartSignal`, `$totalPriceCart`) para la reactividad en el carrito.
- **TransferState:** Implementado parcialmente en `CategoriesService` y `ProductsService`, pero ausente en `TenantService` y `BusinessService`, provocando re-peticiones del contexto del negocio en el cliente.

---

## 8. RESPONSIVE

- **Desktop (1440x900):** Visualización fluida y layout limpio de dos columnas en checkout.
- **Tablet (768x1024):** Correcta adaptación de los contenedores de carrito y datos de despacho.
- **Mobile (375x812 - iPhone 12/13/14):**
  - **Desbordamiento horizontal:** No se detectó desbordamiento (`scrollWidth === window.innerWidth`).
  - **Áreas táctiles (Touch Targets):** Los botones de incremento/decremento (`+` / `-`) en el carrito móvil tienen un área de clic inferior a 44x44px, lo que dificulta la interacción con los dedos.

---

## 9. UX (EXPERIENCIA DE USUARIO)

- **Claridad del Flujo:** El paso de producto a carrito y checkout es directo y bien estructurado.
- **Puntos de Fricción:**
  1. Falta de un indicador de progreso paso a paso en el checkout (Paso 1: Despacho, Paso 2: Pago).
  2. Falta de feedback de carga explícito cuando se selecciona un nuevo método de envío o se guarda una dirección.

---

## 10. SEGURIDAD BÁSICA DEL FLUJO

- **Manejo de Credenciales:** Las credenciales de prueba no son almacenadas en texto plano en la aplicación.
- **Protección de Datos Sensibles:** No existen contraseñas ni datos confidenciales en `localStorage` ni en logs de consola.
- **Manejo de Tokens:** El token JWT se almacena en `localStorage`. Si bien es la práctica común en SPAs, se sugiere mitigar riesgos de XSS o evaluar cookies `HttpOnly` para mayor seguridad en el futuro.
- **Interceptor Vulnerability:** El manejo de `status === 0` en `TokenInterceptor` debe ser corregido para no cerrar la sesión del usuario antinaturalmente ante fallos de red.

---

## 11. MULTITENANT

- **Header Contextual:** El header HTTP `businessId` es adjuntado correctamente por `TenantInterceptor` a todas las peticiones dirigidas a la API backend.
- **Aislamiento de Almacenamiento:** Los elementos del carrito y usuario se prefijan con el ID del negocio (`access_token_<businessId>`, `cart_<businessId>`).
- **Riesgo Detectado:** Si `businessId` aún no se ha resuelto al instanciar el servicio, la clave en `localStorage` se genera como `cart_undefined` o `access_token_undefined`.

---

## 12. DETALLE TÉCNICO DE HALLAZGOS (FICHAS TÉCNICAS)

### HALLAZGO 1 (CRÍTICA)
- **Título:** Cierre involuntario de sesión y borrado de carrito por errores de red transitorios (`status === 0`)
- **Severidad:** CRÍTICA
- **Área afectada:** `src/app/core/interceptor/token.interceptor.ts`
- **Pasos para reproducir:**
  1. Iniciar sesión en la tienda.
  2. Simular un microcorte de internet o cancelar una petición HTTP en segundo plano.
  3. La petición devuelve `HttpErrorResponse` con `status === 0`.
- **Comportamiento actual:** `TokenInterceptor` captura `status === 0`, ejecuta `this.authService.logout()` y redirige a `/auth/login`.
- **Comportamiento esperado:** `status === 0` debe tratarse como un error de conexión/red, mostrando un mensaje o reintentando la petición sin desloguear al usuario.
- **Evidencia:**
  ```typescript
  if (err.status === 403 || err.status === 401 || err.status === 0) {
      this.authService.logout();
      this.router.navigate(['/auth/login']);
  }
  ```
- **Endpoint relacionado:** N/A (Afecta a cualquier llamada HTTP interceptada).
- **Impacto:** Pérdida inmediata de sesión y carrito para clientes con conexiones inestables.
- **Causa probable:** Inclusión de `err.status === 0` en la misma condición de manejo para errores de autenticación HTTP 401/403.
- **Recomendación concreta:** Remover `err.status === 0` de la condición de logout en `TokenInterceptor`.

---

### HALLAZGO 2 (ALTA)
- **Título:** Condición de carrera en la clave de `localStorage` al instanciar `AuthService` y `CartService` (`undefined`)
- **Severidad:** ALTA
- **Área afectada:** `AuthService`, `CartService`, `BusinessService`
- **Pasos para reproducir:**
  1. Abrir la aplicación por primera vez con `localStorage` limpio.
  2. Iniciar sesión inmediatamente antes de que el objeto de negocio esté guardado localmente.
- **Comportamiento actual:** `this.business.id` es `undefined`, guardando la sesión en `access_token_undefined`. En la siguiente navegación, la clave pasa a ser `access_token_<id_real>`, lo que simula una pérdida de sesión.
- **Comportamiento esperado:** Obtener dinámicamente el `businessId` desde `TenantService` mediante un getter o Signal centralizado antes de leer/escribir en `localStorage`.
- **Evidencia:**
  ```typescript
  localStorage.setItem('access_token_' + this.business.id, JSON.stringify(token));
  ```
- **Impacto:** Sesiones inconsistentes y vaciado aparente del carrito al recargar.
- **Causa probable:** Asignación síncrona del negocio en el constructor del servicio cuando la carga del tenant es asíncrona.
- **Recomendación concreta:** Reemplazar el acceso a `this.business.id` por `this.tenantService.getBusinessId()` de forma dinámica.

---

### HALLAZGO 3 (ALTA)
- **Título:** Peticiones HTTP duplicadas por falta de `TransferState` en `TenantService` e invocaciones en constructores
- **Severidad:** ALTA
- **Área afectada:** `TenantService`, `Top2Component`, `CartMenuComponent`
- **Pasos para reproducir:**
  1. Cargar cualquier página del sitio y monitorear la pestaña Network del navegador.
  2. Inspeccionar la cantidad de llamadas a `GET /api/v1/business/info/mipatita` y `GET /api/v1/catalog/banner/TOP_2`.
- **Comportamiento actual:** Se realizan múltiples llamadas idénticas al backend durante la hidratación en el cliente.
- **Comportamiento esperado:** Transferir el estado obtenido en SSR hacia el cliente usando `TransferState` e invocar peticiones en `ngOnInit()` o métodos con caché.
- **Evidencia:** Registro de red muestra 12 llamadas a `business/info/mipatita` y 7 a `banner/TOP_2` en un flujo estándar.
- **Endpoint relacionado:** `GET /api/v1/business/info/*`, `GET /api/v1/catalog/banner/*`
- **Impacto:** Sobrecarga innecesaria en el servidor backend y mayor tiempo para alcanzar la interactividad completa.
- **Causa probable:** Ejecución de peticiones HTTP en constructores de componentes globales y falta de almacenamiento en `TransferState`.
- **Recomendación concreta:** Mover llamadas a `ngOnInit` e integrar `TransferState` en `TenantService`.

---

### HALLAZGO 4 (MEDIA)
- **Título:** Denominación confusa de Guard en la ruta pública de Checkout (`AdminGuard`)
- **Severidad:** MEDIA
- **Área afectada:** `src/app/app.routes.ts`
- **Pasos para reproducir:**
  1. Revisar las definiciones de rutas en `app.routes.ts`.
- **Comportamiento actual:** La ruta `/checkout` utiliza `canActivate: [AdminGuard]`.
- **Comportamiento esperado:** Utilizar un guard con nombre semántico como `AuthGuard`.
- **Evidencia:**
  ```typescript
  { path: 'checkout', canActivate: [AdminGuard], component: CheckoutLayoutComponent }
  ```
- **Impacto:** Riesgo de mantenimiento; si un desarrollador añade lógica para verificar rol de administrador en `AdminGuard`, bloqueará el proceso de compra a todos los clientes.
- **Causa probable:** Reutilización de un guard existente para requerir sesión sin crear un guard dedicado a clientes.
- **Recomendación concreta:** Crear `AuthGuard` específico para clientes y asignarlo a `/checkout`.

---

### HALLAZGO 5 (MEDIA)
- **Título:** Botones de modificación de cantidad con área táctil reducida en dispositivos móviles
- **Severidad:** MEDIA
- **Área afectada:** `src/app/modules/cart/components`
- **Pasos para reproducir:**
  1. Acceder al carrito (`/cart`) desde un dispositivo móvil (pantalla de 375px).
  2. Intentar presionar los botones `+` y `-` para modificar la cantidad del producto.
- **Comportamiento actual:** El tamaño de la zona de clic es inferior a 30x30px.
- **Comportamiento esperado:** Mantener una zona táctil mínima de 44x44px según las guías de accesibilidad WCAG.
- **Impacto:** Dificultad de uso en pantallas táctiles y clics accidentales.
- **Recomendación concreta:** Añadir `padding` o dimensionar los botones a `44px x 44px` en vistas responsivas.

---

## CLASIFICACIÓN DE MEJORAS

### Quick Wins (Acciones rápidas de alto impacto):
1. **Remover `err.status === 0` de `TokenInterceptor`:** Evita cierres de sesión no deseados ante pestañas en segundo plano o microcortes de red.
2. **Corregir lectura dinámica de `businessId`:** Modificar `AuthService` y `CartService` para consultar `tenantService.getBusinessId()` en lugar de leer una variable estática del constructor.
3. **Renombrar/Separar `AdminGuard` a `AuthGuard`:** Clarifica el ruteo de la aplicación.
4. **Aumentar padding de botones en carrito móvil:** Mejora inmediata en la usabilidad móvil.

### Mejoras Estructurales (Arquitectura y Refactorización):
1. **Implementar `TransferState` en `TenantService`:** Elimina las re-consultas de información de negocio durante la hidratación SSR.
2. **Refactorizar constructores de componentes globales:** Mover la lógica de carga de datos (`getBanner`, `getMenu`) desde los `constructor()` hacia los hooks de ciclo de vida (`ngOnInit()`).
3. **Optimizar Change Detection:** Convertir componentes restantes a `ChangeDetectionStrategy.OnPush` utilizando Signals para evitar re-renderizados innecesarios.

---
*Reporte de auditoría finalizado.*
