# AUDITORÍA INTEGRAL DEL SISTEMA DE MÉTODOS DE ENVÍO — REPOSITORIO `store`

**Fecha:** Marzo 2025
**Repositorio Evaluado:** `store` (Frontend Ecommerce Multitenant SPA / SSR Angular 20)
**Alcance Auditado:**
- Tipo 1: Retiro en Tienda (`store_pickup`)
- Tipo 2: Despacho a Domicilio Local (`local_delivery`)
- Tipo 4: Despacho a Domicilio Local Programado (`scheduled_local_delivery`)
*(Tipo 3 Courier excluido según directiva).*
**Objetivo:** Conocer el estado real del checkout desde la perspectiva del cliente, auditar su interacción y contratos con `back_tienda`, documentar brechas funcionales/técnicas y contrastar con los hallazgos de los repositorios previos (`back_tienda_admin`, `tienda_admin_front` y `back_tienda`).

---

## 1. RESUMEN EJECUTIVO

Se completó la auditoría forense del sistema de métodos de envío en el frontend ecommerce `store`.

### Principales Conclusiones y Brechas Críticas:
1. **Ausencia de discriminación por tipo de método:**
   El modelo `ShippingBusiness` (`src/app/core/models/shippingBusiness.model.ts`) posee únicamente `{ id, name, desc, price, price_for_free }`. No contiene atributo de tipo (`shipping_type_id` o `type`). En consecuencia, el componente `ShippingMethodComponent` y el checkout principal tratan a todos los métodos de forma plana e indiferenciada, sin importar si conceptualmente representan Retiro en Tienda (Tipo 1), Despacho Local (Tipo 2) o Despacho Programado (Tipo 4).
2. **Retiro en Tienda (Tipo 1) irreal e incoherente:**
   Si el comercio activa una opción nombrada "Retiro en Tienda", el cliente no visualiza la dirección física del establecimiento (`business_info.address` ni `pick_up_dir`), ni sucursales ni horarios de atención para retirar. Además, el formulario de checkout en `CheckoutComponent.next()` valida de forma obligatoria que exista una dirección de entrega domiciliaria seleccionada (`this.selectedAddress`), impidiendo al cliente completar una compra para retiro sin asociar un domicilio personal.
3. **Despacho Programado (Tipo 4) inexistente en frontend:**
   No existe ninguna funcionalidad de agendamiento en el checkout: ni selector de fecha, ni calendario, ni selector de franja horaria AM/PM o específica, ni consulta de cupos disponibles. El Tipo 4 se muestra como una opción de radio más y se comporta de manera idéntica al Tipo 2.
4. **Desconexión en validación de cobertura geográfica:**
   El selector de dirección domiciliaria consulta regiones y comunas mediante `ShippingBusinessService.getRegions()` y `getCities(regionId)`, pero esta consulta se ejecuta dentro del modal de agregar dirección (`AddressAddEdtComponent`). El checkout nunca valida si la comuna de la dirección seleccionada por el cliente está cubierta por el método de envío elegido. Tampoco se bloquea el botón de compra si una dirección está fuera de cobertura.
5. **Cálculo de costo y recalculo ante cambios de dirección:**
   El costo se solicita al backend vía `POST /v1/shipping_business/cost` enviando `{ cartId, shippingBusinessId, totalCartCost }`. El endpoint del backend calcula el costo basándose en el total del carrito y las reglas del método, pero el frontend **no envía la comuna ni la dirección** en la consulta de costo, asumiendo un costo fijo o umbral de gratuidad independiente de la ubicación del cliente. Además, cuando el usuario cambia de dirección en el dropdown (`setSelectedAddress`), el método `getCost` **no se re-ejecuta**.
6. **Contrato de creación de pedido (`POST /v1/order`):**
   El payload enviado es estrictamente:
   ```json
   {
     "business_shipping_id": 1,
     "cart_id": "...",
     "shipping_id": "...",
     "payment_id": 1,
     "contact": "912345678"
   }
   ```
   El campo `shipping_id` (ID de la dirección domiciliaria `ShippingAddress`) siempre es enviado y es obligatorio. No existe ningún campo para fecha programada, franja horaria, sucursal de retiro o desglose geográfico.

---

## 2. ARQUITECTURA DEL CHECKOUT

El flujo de checkout está encapsulado en el módulo lazy-loaded `CheckoutModule` (`src/app/modules/checkout/checkout.module.ts`), protegido por `AuthGuard` en la ruta `/checkout`.

```
                    ┌────────────────────────────────────────┐
                    │            CheckoutComponent           │
                    │  (Paso 1: Envío y Dirección)           │
                    │  (Paso 2: Selección de Pago)           │
                    └───────┬────────────────────────┬───────┘
                            │                        │
         ┌──────────────────┴──────────────┐         │
         │                                 │         ▼
         ▼                                 ▼  ┌───────────────────────┐
┌─────────────────────────┐   ┌────────────┴┐ │ PurchaseDetailComponent│
│ ShippingMethodComponent │   │AddressComp. │ │ (Resumen en tiempo    │
│ (Lista radio/acordeón)  │   │(Selector dir│ │  real de items, costo │
└─────────────────────────┘   │ modal nueva)│ │  de envío y entrega)  │
                              └──────┬──────┘ └───────────────────────┘
                                     ▼
                       ┌─────────────────────────┐
                       │ AddressAddEdtComponent  │
                       │ (Modal agregar/editar)  │
                       └─────────────────────────┘
```

### Flujo de Navegación por Pasos:
1. **Paso 1 (Envío y Dirección):**
   - Carga de métodos de envío (`ShippingMethodComponent`).
   - Carga de direcciones del usuario autenticado (`AddressComponent`).
   - Ingreso/verificación de teléfono de contacto WhatsApp.
   - Validación al presionar "Siguiente": método de envío seleccionado, dirección seleccionada y teléfono no vacío.
2. **Paso 2 (Pago y Finalización):**
   - Selección de método de pago (`PaymentComponent`).
   - Botón "Comprar" ejecuta `gotoPayment()` invocando `OrderService.storeOrder()`.
   - Procesamiento de redirección (pasarelas como Webpay, Khipu) o navegación interna a `/checkout/confirm/:orderNum` gestionado por `PaymentProcessorService`.

---

## 3. COMPONENTES Y SERVICIOS IDENTIFICADOS

| Componente / Servicio / Modelo | Ruta Exacta | Rol Principal en el Sistema de Envíos |
|---|---|---|
| `CheckoutComponent` | `src/app/modules/checkout/components/checkout/checkout.component.ts` | Orquestador principal del checkout. Gestiona los pasos, almacena `selectedShippingMethod`, `shippingAddress`, `whatsappNumber`, invoca `getCost` y `storeOrder`. |
| `ShippingMethodComponent` | `src/app/modules/checkout/components/shipping-method/shipping-method.component.ts` | Renderiza la lista de métodos de envío disponibles usando un acordeón con radios. Emite `methodSelected`. |
| `AddressComponent` | `src/app/modules/checkout/components/address/address.component.ts` | Permite seleccionar una dirección guardada en un `<select>` o abrir el modal de nueva dirección. Emite `addressSelected` y `whatsappUpdated`. |
| `AddressAddEdtComponent` | `src/app/modules/user-admin/components/address-add-edt/address-add-edt.component.ts` | Modal para agregar o editar direcciones de despacho. Consulta regiones y comunas (`cities`). |
| `PurchaseDetailComponent` | `src/app/modules/checkout/components/purchase-detail/purchase-detail.component.ts` | Resumen de compra lateral. Muestra productos, subtotal, nombre del método de envío, costo de envío, dirección y mensaje de fecha estimada (`deliveryData`). |
| `PaymentComponent` | `src/app/modules/checkout/components/payment/payment.component.ts` | Selección del medio de pago en el Paso 2. |
| `ConfirmComponent` | `src/app/modules/checkout/components/confirm/confirm.component.ts` | Vista final de confirmación de pedido (`/checkout/confirm/:orderNum`). |
| `OrdersComponent` | `src/app/modules/user-admin/components/orders/orders.component.ts` | Historial de pedidos del cliente en `/admin/orders`. Consulta datos de despacho mediante `getShippedOrder`. |
| `OrderDetailsComponent` | `src/app/modules/user-admin/components/order-details/order-details.component.ts` | Muestra el detalle de una orden en el panel de usuario, incluyendo datos de `order.shipped`. |
| `ShippingBusinessService` | `src/app/core/services/shipping-business.service.ts` | Servicio que interactúa con `back_tienda` para obtener métodos (`/shipping_business`), costo (`/shipping_business/cost`), regiones (`/regions`) y comunas (`/cities/{regionId}`). |
| `DeliveryService` | `src/app/core/services/delivery.service.ts` | Consulta horarios generales (`/shipping_business/delivery`) y fecha estimada de entrega (`/shipping_business/delivery/{id}/{price}`). |
| `ShippingService` | `src/app/core/services/shipping.service.ts` | CRUD de direcciones domiciliarias del cliente (`/api/v1/shipping`). |
| `OrderService` | `src/app/core/services/order.service.ts` | Consulta monto total (`/order/total-amount`), última orden (`/order/last-order`), crea pedido (`POST /order`) y consulta datos de envío (`GET /order/shipped/{id}`). |
| `ShippingBusiness` (Modelo) | `src/app/core/models/shippingBusiness.model.ts` | Interface del método de envío del comercio. |
| `ShippingAddress` (Modelo) | `src/app/core/models/shippingAddress.model.ts` | Interface de la dirección física del cliente. |
| `DeliveryModel` (Modelo) | `src/app/core/models/delivery.model.ts` | Interface de la respuesta de fecha/texto de entrega. |
| `ScheduleModel` (Modelo) | `src/app/core/models/schedule.model.ts` | Interface de los horarios de atención y entrega. |
| `BusinessShippingModel` (Modelo)| `src/app/core/models/businessShipping.model.ts` | Interface heredada en desuso con campos `home_delivery`, `pick_up`, `pick_up_dir`. |

---

## 4. ANÁLISIS DEL TIPO 1: RETIRO EN TIENDA (`store_pickup`)

### 4.1 Identificación del Tipo 1
El frontend **no tiene ningún mecanismo programático** para reconocer si un método es de Tipo 1 (`store_pickup`).
- El modelo `ShippingBusiness` carece de discriminador numérico o alfanumérico de tipo:
  ```typescript
  // src/app/core/models/shippingBusiness.model.ts:1-7
  export interface ShippingBusiness {
      id: number;
      name: string;
      desc: string;
      price: number;
      price_for_free: number;
  }
  ```
- No hay comparaciones de texto, flags booleanos ni IDs reservados en `ShippingMethodComponent` ni en `CheckoutComponent`.
- Se renderiza únicamente el campo `name` y `desc` (sanitizado como HTML) dentro del acordeón.

### 4.2 Información Mostrada al Cliente
- **Dirección física del establecimiento:** No se muestra. El frontend no consulta ni renderiza `business_info.address` en el checkout.
- **Punto de retiro o sucursales:** No existe selector, dropdown ni listado de sucursales o puntos físicos de retiro.
- **Uso de `pick_up_dir`:** La interfaz `BusinessShippingModel` (`src/app/core/models/businessShipping.model.ts:5`) declara `pick_up_dir`, pero este modelo está completamente desconectado del checkout. El servicio `BusinessService.getShippingMethods` que lo consumía está comentado (`src/app/core/services/business.service.ts:162`).
- **Horarios de atención:** No se muestran en checkout. Los horarios de `DeliveryService.getSchedule()` sólo se leen en la página informativa estática `/info/shipment` (`ShipmentComponent`).

### 4.3 Formulario de Dirección y Bloqueo Obligatorio
En `CheckoutComponent.html` (líneas 14-17), el componente `<app-address>` se renderiza de forma estática bajo `<app-shipping-method>` sin directivas condicionales (`*ngIf` o `[hidden]`):
```html
<div [hidden]="currentStep !== 1">
  <app-shipping-method (methodSelected)="selectedShippingMethodFunc($event)"></app-shipping-method>
  <app-address (addressSelected)="setSelectedAddress($event)" (whatsappUpdated)="whatsappNumber = $event"></app-address>
</div>
```
En `CheckoutComponent.ts` (líneas 172-187), el método `next()` valida:
```typescript
if (!this.selectedShippingMethod || this.selectedShippingMethod.id === undefined || this.selectedShippingMethod.id === -1) {
  this.step1Error.set('Por favor seleccione un método de envío.');
  return;
}
if (!this.selectedAddress || this.selectedAddress === '') {
  this.step1Error.set('Por favor seleccione o ingrese una dirección de despacho.');
  return;
}
if (!this.whatsappNumber || this.whatsappNumber.trim() === '') {
  this.step1Error.set('Por favor ingrese un teléfono de contacto / WhatsApp.');
  return;
}
```
**Consecuencia crítica:** El cliente está **obligado** a seleccionar una dirección domiciliaria de entrega para avanzar al paso de pago. No es posible completar una orden con Retiro en Tienda sin vincular una dirección de domicilio personal.

### 4.4 Datos Enviados al Backend para Tipo 1
Al llamar a `OrderService.storeOrder()`, el payload envía invariablemente:
```json
{
  "business_shipping_id": <id_metodo_retiro>,
  "cart_id": "<cart_uuid>",
  "shipping_id": "<uuid_direccion_domiciliaria>",
  "payment_id": <id_pago>,
  "contact": "<telefono>"
}
```
No se envía identificador de tienda ni de sucursal. En el backend `back_tienda`, la tabla `orders` asocia `shipping_address_id`, generando la apariencia en base de datos de que el pedido debe despacharse al domicilio del cliente.

### 4.5 Resumen y Confirmación de Compra
- En `PurchaseDetailComponent.html` (líneas 100-104), se muestra el nombre del método (ej. "Retiro en Local"), pero debajo se imprime:
  ```html
  <p class="m-0">
    {{shipingAddress.address_line1}} {{shipingAddress.address_line2}} {{shipingAddress.nro}} {{shipingAddress.obs}}
  </p>
  ```
  Esto confunde al cliente, pues tras elegir retiro en tienda se le muestra su dirección de casa como lugar de entrega.
- En la confirmación (`ConfirmComponent.html`), únicamente se muestra el número de orden y mensaje genérico; no se detalla dirección física ni instrucciones de retiro.

### 4.6 Conclusión del Tipo 1
**Respuesta a la pregunta fundamental:** El cliente **no está realizando una compra con retiro en tienda real**. Simplemente selecciona una opción de radio con nombre "Retiro", sin información sobre dónde ni cuándo retirar, y el sistema le fuerza a registrar y vincular su dirección domiciliaria particular.

---

## 5. ANÁLISIS DEL TIPO 2: DESPACHO A DOMICILIO LOCAL (`local_delivery`)

### 5.1 Selección y Registro de Dirección
- **Listado y selección:** `AddressComponent` consulta las direcciones guardadas del cliente mediante `ShippingService.getShippingAdress()` (`GET /api/v1/shipping`). Se presentan en un `<select>` nativo.
- **Selección de Región y Comuna:** Se realiza exclusivamente dentro del modal de agregar/editar dirección (`AddressAddEdtComponent`), no en el flujo principal del checkout.
- **Consulta de Regiones:** Invocado vía `ShippingBusinessService.getRegions()` (`GET /api/v1/shipping_business/regions`).
- **Consulta de Comunas:** Invocado vía `ShippingBusinessService.getCities(regionId)` (`GET /api/v1/shipping_business/cities/{regionId}`).
- **Filtrado por comercio:** Las comunas retornadas por dicho endpoint son aquellas asociadas al comercio en `business_cities` (filtrado en backend vía header `businessId`).
- **Validación de Cobertura:**
  - En el modal de dirección, sólo se listan las comunas retornadas por el endpoint.
  - **Fallo:** Si el cliente ya tenía una dirección guardada previamente de otra comuna o si el comercio modificó su cobertura después, el checkout **no valida la cobertura** al seleccionar la dirección en el `<select>` ni antes de pagar. Tampoco hay verificación cruzada entre la comuna de la dirección y las comunas cubiertas por el método de envío específico.
- **Campos obligatorios:** Validados mediante Reactive Forms en `AddressAddEdtComponent.initializeForm()`:
  - `name`: requerido, máx 30 caracteres.
  - `address`: requerido (calle), máx 100 caracteres.
  - `number`: requerido (número de calle), máx 10 caracteres.
  - `region`: requerido (valor numérico > 0).
  - `city`: requerido (valor numérico > 0).
  - `houseNumber`: opcional (depto/block/casa).
  - `obs`: opcional (instrucciones adicionales, máx 200).
  - `phone`: opcional en modal, pero validado como obligatorio en `CheckoutComponent.next()` para el contacto WhatsApp.

### 5.2 Métodos de Envío y Costos
- **Obtención de métodos:** `ShippingMethodComponent` ejecuta `ShippingBusinessService.getShippingMetphods()` (`GET /api/v1/shipping_business`).
- **Renderizado visual:**
  - Nombre: `ship.name`.
  - Descripción: `ship.desc` procesado con pipe `htmlSanitize`.
  - Precio base: `Valor despacho: $${ship.price}`.
  - Umbral de gratuidad: `Despacho gratis por compras superiores o igual a: $${ship.price_for_free}` (si `price_for_free > 0`).
- **Cálculo dinámico de costo:**
  Al seleccionar un método en `CheckoutComponent.selectedShippingMethodFunc()` (líneas 161-168) o cuando cambia el carrito (líneas 217-223):
  ```typescript
  this.shippingBusinessService.getCost(this.cart().id, this.selectedShippingMethod.id, this.sub_total_price());
  ```
  El endpoint `POST /v1/shipping_business/cost` calcula el costo en el backend.
  El resultado se emite a través de `shippingCost` (Subject/Signal) y actualiza `this.shipping_price`.
- **Cálculo del total de la orden:**
  Tras recibir el costo, `CheckoutComponent` invoca:
  ```typescript
  this.orderService.getTotalAmount(this.cart().id, this.selectedShippingMethod.id);
  ```
  `POST /v1/order/total-amount` retorna el subtotal, descuento y `total_amount`.
- **Confianza en el valor:** El frontend confía plenamente en el valor retornado por el backend (`total_amount`).
- **Falta de reactividad al cambiar dirección:** Cuando el usuario cambia la dirección en el `<select>` (`setSelectedAddress`), `CheckoutComponent` **no vuelve a invocar `getCost` ni `getTotalAmount`**. Si el costo variara por comuna o zona, el checkout mantendría el costo anterior desactualizado.

### 5.3 Fechas Estimadas de Entrega
- **Llamada API:** `CheckoutComponent` escucha cambios en `amountModel` mediante un Observable derivado de Signal (`aomuntObs$`, línea 106) e invoca:
  ```typescript
  this.deliveryService.getDeliveryDate(this.selectedShippingMethod.id, this.totalOrderPrice());
  ```
  Endpoint: `GET /v1/shipping_business/delivery/{business_shipping_id}/{price}`.
- **Datos recibidos (`DeliveryModel`):**
  - `delivery_text` (ej. "Llega el" o "Despacho estimado:")
  - `arrival_estimated_time` (ej. "Martes 18 de Marzo entre 14:00 y 18:00 hrs")
  - `delivery_date`
  - `AMPM`
- **Presentación en UI:** Se muestra en `PurchaseDetailComponent.html` (líneas 108-111) dentro de un banner `alert delivery-msg`:
  ```html
  <div class="d-flex justify-content-between alert delivery-msg mt-2">
      <b>{{deliveryData()?.delivery_text}} </b>
      {{deliveryData()?.arrival_estimated_time}}
  </div>
  ```
- **Capacidad de edición:** El cliente **no puede modificar** la fecha ni la franja. Es un mensaje estrictamente informativo generado por el backend a partir de la configuración semanal de `business_delivery`.

---

## 6. ANÁLISIS DEL TIPO 4: DESPACHO A DOMICILIO LOCAL PROGRAMADO (`scheduled_local_delivery`)

### 6.1 Auditoría Técnica del Tipo 4
Se realizó una inspección exhaustiva de todo el repositorio en búsqueda de agendamiento o programación de entregas.
- **Selector de fecha:** NO EXISTE en ninguna plantilla ni componente.
- **Calendario (datepicker):** NO EXISTE. No hay librerías de calendario ni inputs de tipo `date` o componente equivalente.
- **Selector de franja horaria:** NO EXISTE. No hay dropdowns ni controles para elegir franja AM/PM ni rangos horarios específicos.
- **Consulta de fechas disponibles o cupos:** NO EXISTE ninguna llamada a `GET /v1/shipping_business/delivery/schedule` durante el checkout. Dicho método sólo existe en `DeliveryService.getSchedule()` y es llamado de manera aislada por `ShipmentComponent` en la ruta estática `/info/shipment`.
- **Persistencia y Payload:** El estado del checkout no contempla propiedades para fecha ni franja de entrega. Al enviar `OrderService.storeOrder()`, no se envían campos como `delivery_date`, `delivery_time_slot`, `schedule_id` ni similares.

### 6.2 Comportamiento en Checkout
Si en la base de datos existe un método de envío Tipo 4 activo, el frontend lo lista en `ShippingMethodComponent` exactamente igual que un Tipo 2. Al ser seleccionado, consulta `getCost` y `getDeliveryDate`, mostrando el texto estimado estándar del backend.

### 6.3 Conclusión del Tipo 4
**Respuesta a la pregunta fundamental:** El frontend **no implementa una experiencia de despacho programado real**. Se limita a mostrar el método como una opción plana con comportamiento idéntico al despacho local ordinario (Tipo 2), sin permitir al cliente elegir fecha ni hora de entrega.

---

## 7. AUDITORÍA DE INTEGRACIÓN CON `back_tienda`

### 7.1 Matriz de Consumo de Endpoints

| Endpoint en `back_tienda` | Método | Invocado por Servicio / Componente | ¿Consumido en Checkout? | Estado de Integración |
|---|---|---|---|---|
| `/v1/shipping_business` | GET | `ShippingBusinessService.getShippingMetphodsCall()` | **SÍ** | Consumido en `ShippingMethodComponent` |
| `/v1/shipping_business/regions` | GET | `ShippingBusinessService.getRegions()` | **SÍ (Indirecto)** | Consumido en modal `AddressAddEdtComponent` |
| `/v1/shipping_business/cities/{regionId}` | GET | `ShippingBusinessService.getCities(regionId)` | **SÍ (Indirecto)** | Consumido en modal `AddressAddEdtComponent` |
| `/v1/shipping_business/cost` | POST | `ShippingBusinessService.getCost(...)` | **SÍ** | Consumido en `CheckoutComponent` |
| `/v1/shipping_business/delivery/{id}/{price}` | GET | `DeliveryService.getDeliveryDate(...)` | **SÍ** | Consumido en `CheckoutComponent` |
| `/v1/shipping_business/delivery/schedule` | GET | `DeliveryService.getScheduleCall()` | **NO** (en checkout) | Consumido únicamente en `/info/shipment` |
| `/v1/order/total-amount` | POST | `OrderService.getTotalAmount(...)` | **SÍ** | Consumido en `CheckoutComponent` |
| `/v1/order` | POST | `OrderService.storeOrder(...)` | **SÍ** | Consumido en `CheckoutComponent.gotoPayment()` |
| `/v1/order/shipped/{order_id}` | GET | `OrderService.getShippedOrder(order_id)` | **NO** (en checkout) | Consumido en panel `/admin/orders` |

### 7.2 Detalle de Contratos de los Endpoints Consumidos en Checkout

#### 1. `GET /api/v1/shipping_business`
- **Servicio:** `ShippingBusinessService.getShippingMetphodsCall()` (`src/app/core/services/shipping-business.service.ts:51-57`).
- **Headers:** `businessId` inyectado por `TenantInterceptor`.
- **Caché:** Persistido en `TransferState` bajo la clave `business_shipping`.
- **Respuesta esperada:** Array de `ShippingBusiness` (`id`, `name`, `desc`, `price`, `price_for_free`).
- **Momento:** Carga del Paso 1 del checkout.

#### 2. `POST /api/v1/shipping_business/cost`
- **Servicio:** `ShippingBusinessService.getCost(cartId, shippingBusinessId, totalCartCost)` (`src/app/core/services/shipping-business.service.ts:68-76`).
- **Payload:**
  ```json
  {
    "cartId": "UUID",
    "shippingBusinessId": 1,
    "totalCartCost": 15990
  }
  ```
- **Respuesta esperada:** `number` (precio numérico final del envío).
- **Momento:** Selección de método o recálculo de subtotal de carrito.

#### 3. `GET /api/v1/shipping_business/delivery/{deliveryId}/{price}`
- **Servicio:** `DeliveryService.getDeliveryDate(deliveryId, price)` (`src/app/core/services/delivery.service.ts:55-61`).
- **Parámetros en URL:** `deliveryId` (ID del método), `price` (monto total de la orden).
- **Respuesta esperada:** Objeto `DeliveryModel` (`name`, `desc`, `cost`, `delivery_date`, `delivery_text`, `AMPM`, `arrival_estimated_time`).
- **Momento:** Se ejecuta reactivamente cuando `amountModel` emite un nuevo valor en `CheckoutComponent`.

#### 4. `POST /api/v1/order/total-amount`
- **Servicio:** `OrderService.getTotalAmount(cartId, businessShippingId)` (`src/app/core/services/order.service.ts:71-77`).
- **Payload:**
  ```json
  {
    "cartId": "UUID",
    "shippingBusinessId": 1
  }
  ```
- **Respuesta esperada:** `OrderTotalAmountModel` (`total_cart_amount`, `total_shipping_cost`, `disc_percentage`, `disc_text`, `disc_amount`, `total_amount`).
- **Momento:** Inmediatamente tras recibir respuesta de `getCost`.

#### 5. `POST /api/v1/order`
- **Servicio:** `OrderService.storeOrder(...)` (`src/app/core/services/order.service.ts:79-114`).
- **Payload:** Ver Sección 8 detallada.
- **Momento:** Clic en "Comprar" en Paso 2 de checkout.

#### 6. `GET /api/v1/shipping` (CRUD Direcciones)
- **Servicio:** `ShippingService.getShippingAdress()` (`src/app/core/services/shipping.service.ts:31-38`).
- **Headers:** `Authorization: Bearer <JWT>`, `businessId`.
- **Respuesta esperada:** `ShippingAddress[]`.
- **Momento:** Inicialización de `AddressComponent`.

---

## 8. AUDITORÍA DEL PAYLOAD DE CREACIÓN DE PEDIDOS

### 8.1 Inspección Forense de `OrderService.storeOrder`
En `src/app/core/services/order.service.ts` (líneas 79-88):
```typescript
storeOrder(cartId:string, shipping_id:string, business_shipping_id:number, payment:PaymentModel, contact:string){

  let toJson = {
    "business_shipping_id": business_shipping_id,
    "cart_id": cartId,
    "shipping_id": shipping_id,
    "payment_id": payment.id,
    "contact": contact
  }

  this.httpClient.post<any>(`${this.URL}`, toJson, {observe: 'response', responseType: 'json'}).subscribe({
    ...
```

### 8.2 Desglose de Campos del Payload

| Campo en Payload | Tipo | Origen del Dato | Obligatoriedad | ¿Puede ser null/omitido? | Observaciones |
|---|---|---|---|---|---|
| `cart_id` | `string` | `$currentCartSignal.id` | Obligatorio | No | UUID del carrito activo en sesión. |
| `shipping_id` | `string` | `selectedAddress` (`ShippingAddress.id`) | Obligatorio | No | **Siempre se envía.** Si el usuario no tiene dirección, `CheckoutComponent.next()` no permite continuar. |
| `business_shipping_id` | `number` | `selectedShippingMethod.id` | Obligatorio | No | ID del método de envío seleccionado. |
| `payment_id` | `number` | `selectedPaymentMethod.id` | Obligatorio | No | ID del método de pago elegido. |
| `contact` | `string` | `whatsappNumber` | Obligatorio | No | Teléfono celular de 9 dígitos. |

### 8.3 Contrastación con `OrderLaravelController@storeOrder` de `back_tienda`
- **Exigencia de `shipping_id`:** El backend valida obligatoriamente `'shipping_id' => 'required'`. El frontend cumple forzando `selectedAddress`, lo cual confirma que el backend no soporta órdenes sin dirección, reforzando la imposibilidad técnica de un Retiro en Tienda limpio.
- **Campos ausentes que imposibilitan Despacho Programado:** No existe en el payload ningún campo para fecha (`delivery_date`, `scheduled_date`) ni franja horaria (`time_slot`, `delivery_window`). El backend no recibe ninguna preferencia temporal del cliente.
- **Campos geográficos:** No se envían comuna ni región en el payload; el backend debe resolverlas mediante la relación con la tabla `shipping_addresses` usando `shipping_id`.

---

## 9. ESTADO, PERSISTENCIA Y RECUPERACIÓN DEL CHECKOUT

### 9.1 Mecanismos de Estado en el Checkout
- **Signals y Observables:**
  - Carrito: Signal `$currentCartSignal` y Observable `totalPriceCartSignal` en `CartService`.
  - Métodos de envío: Signal `shippingMethodsSignal` en `ShippingBusinessService`.
  - Costo de envío: Signal `shippingCostSignal` y Subject `shippingCost$` en `ShippingBusinessService`.
  - Totales: Signal `totalAmountSignal` en `OrderService`.
  - Fechas de entrega: Signal `deliveryDataSignal` en `DeliveryService`.
  - Estado local de paso: Propiedades de instancia en `CheckoutComponent` (`currentStep`, `selectedShippingMethod`, `shippingAddress`, `whatsappNumber`).

### 9.2 Persistencia en Almacenamiento Local (`localStorage`)
- **Carro:** Almacenado en `localStorage.getItem('cart_' + busId)`.
- **Sesión y Usuario:** `access_token_<busId>` y `user_<busId>`.
- **Selección de método de envío y dirección:** **NO SE PERSISTEN** en `localStorage` ni `sessionStorage`. Están exclusivamente en la memoria volátil del componente Angular.

### 9.3 Comportamiento ante Eventos Críticos
- **Recarga de página (F5):**
  - La propiedad `currentStep` se reinicia a `1` (`CheckoutComponent` constructor).
  - El método de envío seleccionado se pierde en memoria; `ShippingMethodComponent` vuelve a autoseleccionar el primer método del array por defecto (`this.selectMethod(this.ships()[0])`).
  - La dirección se reinicia a la primera dirección del array (`this.shippingAddress[0]`).
  - El teléfono de contacto se reinicia al teléfono de la dirección o del perfil del usuario.
- **Recuperación de última orden (`lastOrder`):**
  `OrderService.getLastOrder()` consulta `GET /v1/order/last-order`.
  En `CheckoutComponent.ngOnInit()`:
  ```typescript
  this.destroyLastOrder = this.orderService.lastOrder.subscribe(lastOrder => {
    if(lastOrder.shipping_address_id != undefined && this.currentStep == 1){
      this.currentStep++;
    }
  });
  ```
  **Efecto colateral no deseado:** Si el usuario tiene una compra previa registrada en `lastOrder`, al entrar a `/checkout`, esta suscripción detecta `shipping_address_id` e incrementa automáticamente `this.currentStep++` saltándose el Paso 1 y enviándolo directo al Paso 2 (pago) sin permitirle revisar o cambiar el método de envío ni la dirección en primer término, a menos que presione explícitamente "Atrás".
- **Cambio en el Carrito:**
  `CheckoutComponent` observa `$currentCartSignal`. Si cambia la cantidad de items, ejecuta `calculateTotalProce()`, el cual vuelve a consultar `getCost` y `getTotalAmount`.
- **Cambio de Tenant:**
  Las claves de `localStorage` están segmentadas por `busId` (`cart_<id>`, `user_<id>`, `access_token_<id>`). Al cambiar de dominio o subdominio, `TenantService` carga el nuevo tenant y no se mezclan los carritos ni credenciales.

---

## 10. SEGURIDAD Y MULTITENANT

### 10.1 Resolución y Propagación del Tenant
1. **Identificación del Host:** `BusinessService.getNameHost()` obtiene el hostname (`window.location.hostname` en navegador o encabezado `host` en SSR) y extrae el subdominio o nombre base (fallback: `'mipatita'`).
2. **Inyección de Cabecera:** `TenantInterceptor` (`src/app/core/tenants/tenant.interceptor.ts`) intercepta todas las peticiones HTTP e inyecta:
   ```typescript
   const tenantReq = req.clone({
     setHeaders: { 'businessId': businessId }
   });
   ```
3. **Aislamiento en Base de Datos:** Tanto `GET /v1/shipping_business` como `GET /v1/shipping_business/regions` y `cities` reciben `businessId` y filtran en el backend los métodos y coberturas correspondientes exclusivamente al tenant actual.

### 10.2 Validación y Prevención de Filtración
- Los identificadores de métodos (`business_shipping_id`) y de direcciones provienen del backend del tenant respectivo.
- No hay métodos de envío hardcodeados en el código TypeScript ni en HTML.
- **Riesgo Multitenant detectado:** No hay validación de coherencia en el frontend que certifique que la dirección seleccionada (`shipping_id`) pertenezca estrictamente al tenant activo si un usuario compartiera sesión entre comercios. No obstante, al estar el token JWT y el perfil vinculados a `access_token_<busId>`, el riesgo de cruce entre comercios queda mitigado por el aislamiento de claves de sesión.

---

## 11. EXPERIENCIA DE USUARIO Y VALIDACIONES

### 11.1 Validaciones Visuales y Manejo de Errores
- **Validación Paso 1 (`CheckoutComponent.next()`):**
  - Muestra mensaje flotante en alerta amarilla: `step1Error()` (`alert alert-warning`).
  - Mensajes posibles:
    - `"Por favor seleccione un método de envío."`
    - `"Por favor seleccione o ingrese una dirección de despacho."`
    - `"Por favor ingrese un teléfono de contacto / WhatsApp."`
- **Validaciones en Modal de Dirección (`AddressAddEdtComponent`):**
  - Marca campos con clase Bootstrap `is-invalid` y textos `invalid-feedback`.
  - Impide guardar si faltan calle, número o región/comuna.
- **Validación del Botón Comprar:**
  En `CheckoutComponent.html` (línea 46):
  ```html
  <button class="btn btn-primary-c1 mt-3" type="button" (click)="gotoPayment()" [disabled]="isSubmitting || !isPaymentReady()">
  ```
  `isPaymentReady()` verifica que existan medios de pago, que haya uno seleccionado y que el total de la orden no sea nulo.
- **Manejo de Errores HTTP (4xx / 5xx) en Orden:**
  - Status 422: Error de falta de stock (`ProductNStockError`). Muestra componente `<app-nostock>`.
  - Status 402: Error de pago. Activa `paymentError$` y muestra alerta en `PaymentComponent`.
  - Status 401 / 403: En `TokenInterceptor`, cierra sesión y redirige a `/auth/login`.

### 11.2 Inconsistencias entre Frontend y Backend
1. **Dirección fuera de cobertura:**
   Si el cliente selecciona una dirección cuya comuna no tiene cobertura en `business_cities` para ese método, la interfaz **lo deja continuar y comprar** sin advertencia. Si el backend no tiene validación estricta de comuna en `OrderLaravelController@storeOrder`, el pedido se crea inválido.
2. **Método desactivado concurrentemente:**
   Si el comercio desactiva el método de envío mientras el cliente está en el checkout, el frontend intentará llamar a `getCost` o `storeOrder` con un ID inexistente, arrojando error HTTP 500 o 422 sin un mensaje explicativo claro en la interfaz (se muestra error genérico de pago).

---

## 12. COMPARACIÓN FUNCIONAL CON LOS OTROS TRES REPOSITORIOS

| Aspecto Evaluado | Hallazgo en `back_tienda_admin` / `tienda_admin_front` | Hallazgo en `back_tienda` | Comportamiento Confirmado en `store` (Frontend) |
|---|---|---|---|
| **Retiro en Tienda (Tipo 1) - Puntos Físicos** | No hay gestión de sucursales ni direcciones de retiro en base de datos. | No existen tablas de sucursales físicas ni validación de retiro. Exige `shipping_id`. | No muestra dirección física ni sucursales. Exige obligatoriamente seleccionar dirección particular. |
| **Retiro en Tienda (Tipo 1) - Persistencia** | No hay campo para guardar sucursal seleccionada. | `orders` almacena `shipping_address_id`. | Envía siempre `shipping_id` de la dirección particular del cliente. |
| **Despacho Local (Tipo 2) - Configuración** | Administrador define precio, umbral gratis y tiempos de entrega. | Expone `/shipping_business` y calcula costo en `/cost`. | Muestra precios y umbrales fielmente. Consume `/cost` y `/total-amount`. |
| **Despacho Local (Tipo 2) - Cobertura** | Administrador asocia comunas mediante `business_cities`. | Filtra comunas en `/cities/{regionId}`, pero no valida comuna al crear orden. | Modal consulta comunas filtradas, pero checkout no valida cobertura de la dirección elegida. |
| **Despacho Local (Tipo 2) - Fechas** | Administrador define tabla horaria semanal `business_delivery`. | Calcula fecha en `/delivery/{id}/{price}` según día y hora de corte. | Muestra pasivamente el texto generado por el backend (`arrival_estimated_time`). No editable. |
| **Despacho Programado (Tipo 4) - Agendamiento** | No hay configuración de calendarios, cupos ni franjas horarias. | No existen tablas de franjas, cupos ni validación de disponibilidad programada. | **Completamente inexistente.** No hay calendario, ni selector de fecha ni franja. Se comporta como Tipo 2. |

---

## 13. MATRIZ DE FUNCIONALIDADES

| Funcionalidad | Tipo 1: Retiro en Tienda | Tipo 2: Despacho Local | Tipo 4: Despacho Programado | Justificación y Evidencia en Código |
|---|---|---|---|---|
| **Mostrar método** | IMPLEMENTADO | IMPLEMENTADO | IMPLEMENTADO | Renderizado en `ShippingMethodComponent.html:5-40` mediante `@for(ship of ships())`. |
| **Mostrar descripción** | IMPLEMENTADO | IMPLEMENTADO | IMPLEMENTADO | Renderizado en `ShippingMethodComponent.html:30` con `ship.desc`. |
| **Mostrar costo** | IMPLEMENTADO | IMPLEMENTADO | IMPLEMENTADO | Muestra precio base en acordeón y costo calculado en `PurchaseDetailComponent.html:95`. |
| **Seleccionar dirección domiciliaria** | IMPLEMENTADO | IMPLEMENTADO | IMPLEMENTADO | Selector nativo en `AddressComponent.html:5-11`. |
| **Seleccionar punto de retiro** | NO IMPLEMENTADO | NO APLICA | NO APLICA | No existe selector ni entidad de sucursales de retiro en `ShippingMethodComponent`. |
| **Mostrar dirección del local físico** | NO IMPLEMENTADO | NO APLICA | NO APLICA | `business_info.address` no se consume en checkout; `pick_up_dir` está desconectado. |
| **Consultar comunas habilitadas** | NO APLICA | IMPLEMENTADO | IMPLEMENTADO | Invocado vía `ShippingBusinessService.getCities()` en modal `AddressAddEdtComponent`. |
| **Filtrar checkout por cobertura** | NO APLICA | NO IMPLEMENTADO | NO IMPLEMENTADO | No se valida si la dirección seleccionada está en la lista de cobertura del método. |
| **Consultar costo al backend** | IMPLEMENTADO | IMPLEMENTADO | IMPLEMENTADO | Invocado vía `ShippingBusinessService.getCost()` en `CheckoutComponent:166`. |
| **Mostrar fecha estimada** | NO APLICA | IMPLEMENTADO | NO IMPLEMENTADO | Se muestra texto informativo en `PurchaseDetailComponent:108` para entrega local. |
| **Seleccionar fecha de entrega** | NO APLICA | NO APLICA | NO IMPLEMENTADO | No existe selector de fecha ni calendario en ningún componente. |
| **Seleccionar franja horaria** | NO APLICA | NO APLICA | NO IMPLEMENTADO | No existe selector de franjas AM/PM ni horarias en el checkout. |
| **Enviar fecha al backend** | NO APLICA | NO APLICA | NO IMPLEMENTADO | `OrderService.storeOrder()` no incluye parámetro ni campo de fecha. |
| **Enviar franja al backend** | NO APLICA | NO APLICA | NO IMPLEMENTADO | `OrderService.storeOrder()` no incluye parámetro ni campo de franja horaria. |
| **Persistir selección durante checkout** | PARCIAL | PARCIAL | PARCIAL | Vive en memoria del componente; se pierde tras recargar (F5). |
| **Mostrar resumen de envío** | IMPLEMENTADO | IMPLEMENTADO | IMPLEMENTADO | Resumen visual en `PurchaseDetailComponent`. |
| **Permitir finalizar compra** | IMPLEMENTADO | IMPLEMENTADO | IMPLEMENTADO | Ejecuta `OrderService.storeOrder()` y procesa pago en `gotoPayment()`. |

---

## 14. HALLAZGOS Y RIESGOS CLASIFICADOS POR PRIORIDAD

### Hallazgo 1: Retiro en Tienda exige obligatoriamente dirección domiciliaria [CRÍTICO]
- **Tipo de envío afectado:** Tipo 1 (`store_pickup`).
- **Archivo y Método:** `src/app/modules/checkout/components/checkout/checkout.component.ts`, método `next()` (líneas 176-179).
- **Comportamiento actual:** La validación bloquea el paso al pago si `selectedAddress` está vacío, sin verificar si el método seleccionado es de retiro en tienda.
- **Consecuencia para el cliente:** Si el cliente desea retirar en tienda porque no tiene o no desea dar su dirección, el sistema no le permite comprar a menos que ingrese un domicilio ficticio o personal.
- **Consecuencia para el backend:** La orden se crea con `shipping_address_id` apuntando al domicilio particular, falseando el registro contable y logístico del pedido.
- **Dependencia:** Requiere modificar `back_tienda` para permitir `shipping_id` nullable en órdenes de retiro y adaptar la validación del frontend.

### Hallazgo 2: Salto no intencionado de Paso 1 por `lastOrder` [ALTO]
- **Tipo de envío afectado:** Todos los tipos (1, 2 y 4).
- **Archivo y Método:** `src/app/modules/checkout/components/checkout/checkout.component.ts`, `ngOnInit()` (líneas 143-149).
- **Comportamiento actual:** Si el cliente tiene una orden previa, `lastOrder.shipping_address_id` ejecuta automáticamente `this.currentStep++`, enviando al usuario directamente al Paso 2 (Pago).
- **Consecuencia para el cliente:** El usuario no visualiza el método de envío asignado por defecto (que toma el primer método de la lista) ni puede cambiar su dirección a menos que presione manualmente el botón "Atrás".
- **Consecuencia para el backend:** Posible generación de pedidos con métodos o direcciones obsoletas no revisadas por el cliente.

### Hallazgo 3: Ausencia total de agendamiento para Tipo 4 [ALTO]
- **Tipo de envío afectado:** Tipo 4 (`scheduled_local_delivery`).
- **Archivo y Método:** `src/app/modules/checkout/components/shipping-method/shipping-method.component.ts` y `CheckoutComponent.ts`.
- **Comportamiento actual:** No existen controles ni modelos de captura de fecha/hora. El método opera exactamente igual que el Tipo 2.
- **Consecuencia para el cliente:** Si un comercio ofrece "Entrega Programada", el cliente asume que podrá elegir cuándo recibir su pedido, pero el sistema no le da ninguna opción.
- **Consecuencia para el backend:** No se persisten franjas horarias ni compromisos de entrega específicos.

### Hallazgo 4: Falta de validación de cobertura de la dirección seleccionada [ALTO]
- **Tipo de envío afectado:** Tipo 2 y Tipo 4.
- **Archivo y Método:** `src/app/modules/checkout/components/checkout/checkout.component.ts`, `setSelectedAddress()` (líneas 208-211) y `next()`.
- **Comportamiento actual:** Se valida únicamente que `selectedAddress` no esté vacío (`!= ''`). No se verifica si la comuna de esa dirección (`city_id`) figura dentro de las comunas cubiertas por el método.
- **Consecuencia para el cliente:** Puede completar la compra seleccionando una dirección que el comercio no puede despachar.
- **Consecuencia para el backend:** `back_tienda` recibe una orden con dirección fuera de zona.

### Hallazgo 5: No se recalcula el costo de envío al cambiar de dirección [MEDIO]
- **Tipo de envío afectado:** Tipo 2 y Tipo 4.
- **Archivo y Método:** `src/app/modules/checkout/components/checkout/checkout.component.ts`, `setSelectedAddress()` (líneas 208-211).
- **Comportamiento actual:** `setSelectedAddress` sólo asigna `this.shippingAddress = event` y `this.selectedAddress = event.id`, pero no llama a `shippingBusinessService.getCost()` ni a `orderService.getTotalAmount()`.
- **Consecuencia para el cliente:** Si en el futuro el backend implementa costos diferenciados por comuna o zona, el checkout mantendrá el valor calculado de la dirección inicial.

### Hallazgo 6: Desconexión de datos físicos de la tienda (`pick_up_dir` y `business_info.address`) [MEDIO]
- **Tipo de envío afectado:** Tipo 1 (`store_pickup`).
- **Archivo y Método:** `src/app/core/services/business.service.ts` (línea 162) y `src/app/modules/checkout/components/purchase-detail/purchase-detail.component.html`.
- **Comportamiento actual:** El servicio que consultaba `BusinessShippingModel` (`/shipping/${id}`) está comentado. El checkout no lee la dirección del local desde `BusinessService.getBusinessStorage().info.address`.
- **Consecuencia para el cliente:** Desorientación sobre dónde acudir a retirar los productos comprados.

### Hallazgo 7: Información de entrega confusa en el resumen de compra [BAJO]
- **Tipo de envío afectado:** Tipo 1 (`store_pickup`).
- **Archivo y Método:** `src/app/modules/checkout/components/purchase-detail/purchase-detail.component.html` (líneas 100-111).
- **Comportamiento actual:** Siempre muestra la dirección física del cliente y la alerta de fecha estimada de despacho local, incluso si el cliente seleccionó retiro en tienda.
- **Consecuencia para el cliente:** Mensajes contradictorios en el resumen de compra lateral.

---

## 15. ARCHIVOS RELEVANTES CON RUTAS EXACTAS

1. **`src/app/modules/checkout/components/checkout/checkout.component.ts`**
   - Controlador principal del checkout.
   - Manejo de pasos, validación `next()` (líneas 171-188), envío de orden `storeOrder()` (líneas 192-202) y salto automático por `lastOrder` (líneas 143-149).
2. **`src/app/modules/checkout/components/checkout/checkout.component.html`**
   - Plantilla del checkout. Estructura de pasos 1 y 2, inclusión de `<app-shipping-method>`, `<app-address>` y `<app-purchase-detail>`.
3. **`src/app/modules/checkout/components/shipping-method/shipping-method.component.ts`**
   - Selección de método de envío. Efecto de autoselección del primer método (líneas 28-44) y emisión de evento.
4. **`src/app/modules/checkout/components/shipping-method/shipping-method.component.html`**
   - Acordeón de métodos de envío con radio buttons y renderizado de precio base y umbral gratis.
5. **`src/app/modules/checkout/components/address/address.component.ts`**
   - Gestión de direcciones del cliente y emisión de dirección seleccionada.
6. **`src/app/modules/checkout/components/purchase-detail/purchase-detail.component.html`**
   - Resumen lateral de compra con detalle de productos, método, dirección y mensaje estimado.
7. **`src/app/modules/user-admin/components/address-add-edt/address-add-edt.component.ts`**
   - Modal de creación y edición de direcciones; consulta de regiones y comunas filtradas.
8. **`src/app/core/services/shipping-business.service.ts`**
   - Comunicación HTTP para métodos (`/shipping_business`), cálculo de costo (`/cost`), regiones y comunas.
9. **`src/app/core/services/delivery.service.ts`**
   - Comunicación HTTP para fecha estimada (`/delivery/{id}/{price}`) y horarios (`/delivery`).
10. **`src/app/core/services/order.service.ts`**
    - Métodos `getTotalAmount` (`/order/total-amount`), `storeOrder` (`POST /order`) y `getShippedOrder`.
11. **`src/app/core/models/shippingBusiness.model.ts`**
    - Modelo de datos del método de envío (sin campo `type` ni `shipping_type_id`).
12. **`src/app/core/models/shippingAddress.model.ts`**
    - Modelo de datos de dirección domiciliaria del cliente.
13. **`src/app/core/models/delivery.model.ts`**
    - Modelo de datos de fecha y texto estimado de entrega.

---

## 16. CONCLUSIONES Y DEPENDENCIAS DE IMPLEMENTACIÓN FUTURA

La auditoría técnica y funcional confirma que el frontend `store` posee un flujo de compra operativo para despacho a domicilio genérico (Tipo 2), pero **carece de especialización para Retiro en Tienda (Tipo 1) y Despacho Programado (Tipo 4)**.

### Matriz de Dependencias entre los 4 Repositorios:

1. **Para Retiro en Tienda (Tipo 1):**
   - `back_tienda_admin`: Permitir configurar dirección o sucursales físicas de retiro en los métodos de envío.
   - `tienda_admin_front`: Formulario administrativo para ingresar datos físicos y horarios de retiro.
   - `back_tienda`:
     - Exponer `type` o `shipping_type_id` en `GET /v1/shipping_business`.
     - Exponer dirección/sucursales de retiro en la respuesta.
     - Modificar `OrderLaravelController@storeOrder` para que `shipping_id` sea opcional o nullable cuando el método es de tipo retiro.
   - `store`:
     - Identificar el método Tipo 1 en base a su discriminador.
     - Ocultar la exigencia de dirección domiciliaria en `CheckoutComponent.next()`.
     - Mostrar la dirección del local y horarios de retiro en lugar del formulario de domicilio.
     - Enviar `shipping_id: null` en `storeOrder()`.

2. **Para Despacho Local (Tipo 2):**
   - `back_tienda`: Validar cobertura comunal en `OrderLaravelController@storeOrder`.
   - `store`:
     - Validar en el cliente que la comuna de la dirección seleccionada esté dentro de las comunas cubiertas por el método antes de pasar al paso de pago.
     - Recalcular `getCost()` y `getTotalAmount()` cada vez que el usuario cambie de dirección en `setSelectedAddress()`.

3. **Para Despacho Programado (Tipo 4):**
   - `back_tienda_admin`: Configuración de reglas de agendamiento (días disponibles, franjas horarias y cupos máximos por franja).
   - `tienda_admin_front`: Interfaz para configurar franjas horarias y cupos.
   - `back_tienda`:
     - Endpoints para consultar disponibilidad de fechas y cupos (`/shipping_business/delivery/schedule-slots`).
     - Modificar `OrderLaravelController@storeOrder` para recibir y persistir `delivery_date` y `time_slot_id`.
   - `store`:
     - Diseñar componente selector de fecha (calendario con días bloqueados) y franjas horarias disponibles.
     - Enviar `delivery_date` y franja en el payload de `POST /v1/order`.
