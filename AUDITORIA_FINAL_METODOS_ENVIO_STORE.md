# AUDITORÍA TÉCNICA FINAL — SISTEMA DE MÉTODOS DE ENVÍO EN `store`

**Fecha:** Noviembre 2026
**Repositorio:** `store` (Angular 20 SPA / SSR híbrido multitenant)
**Rama:** `feat/shipping-methods-integration-3778949430291847119`
**Alcance:** Tipo 1 (`store_pickup`), Tipo 2 (`local_delivery`), Tipo 4 (`scheduled_local_delivery`).
**Exclusión:** Tipo 3 (`courier`) fuera de alcance y no modificado.

---

## 1. Resultado por Cada Tipo de Envío

### 1.1. Tipo 1: Retiro en Tienda (`store_pickup`) — APROBADO
- **Discriminador:** `shipping_type_id === 1` o `shipping_type === 'store_pickup'`.
- **Comportamiento en UI:**
  - Oculta completamente el selector de dirección domiciliaria (`<app-address>`) en `CheckoutComponent`.
  - Muestra `<app-pickup-location>` con selector de sucursales activas, detalle de dirección, horarios, teléfono de contacto e instrucciones especiales.
  - Validación estricta en `next()`: exige que se haya seleccionado una sucursal física válida (`selectedPickupLocationId`) y un teléfono de contacto/WhatsApp (`whatsappNumber`). Omite la validación de dirección domiciliaria.
  - En `PurchaseDetailComponent`, el resumen de entrega muestra la tarjeta con datos de la sucursal física de retiro en lugar del domicilio del cliente.
- **Creación de Orden:** Se invoca `storeOrder(cartId, null, business_shipping_id, payment, contact, { pickup_location_id })`.

### 1.2. Tipo 2: Despacho a Domicilio Local (`local_delivery`) — APROBADO
- **Discriminador:** `shipping_type_id === 2`, `shipping_type === 'local_delivery'`, o fallback sin identificador explícito de tipo.
- **Comportamiento en UI:**
  - Preserva íntegramente el flujo tradicional sin regresiones.
  - Mantiene visible y activo el selector de dirección domiciliaria (`<app-address>`).
  - Validación en `next()`: exige dirección domiciliaria válida y número de contacto/WhatsApp.
  - Mantiene el cálculo de tarifas base y regla de despacho gratuito (`price_for_free`).
  - Al cambiar de dirección (`setSelectedAddress()`), ejecuta la sincronización de costos mediante `getCost()` y `getTotalAmount()`.
- **Salto Automático de `lastOrder`:** Se restringió exclusivamente al Tipo 2. Si la compra anterior del usuario fue Tipo 1 o Tipo 4, no avanza automáticamente de paso para evitar omitir la selección de punto de retiro o fecha/franja.
- **Creación de Orden:** Se invoca `storeOrder(cartId, shipping_id, business_shipping_id, payment, contact)` manteniendo la retrocompatibilidad con el backend.

### 1.3. Tipo 4: Despacho Local Programado (`scheduled_local_delivery`) — APROBADO
- **Discriminador:** `shipping_type_id === 4` o `shipping_type === 'scheduled_local_delivery'`.
- **Comportamiento en UI:**
  - Mantiene visible `<app-address>` para la captura de dirección domiciliaria.
  - Despliega `<app-delivery-schedule-picker>` para la selección interactiva de fecha y franja horaria.
  - Consulta dinámicamente la configuración (`min_advance_minutes`, `max_days_ahead`) y la disponibilidad de franjas horarias en zona horaria local `America/Santiago`.
  - Selector horizontal deslizable (touch scroll) con chips para los días dentro del horizonte permitido.
  - Franjas horarias renderizadas con badges de cupos (`available_quota > 0`) o deshabilitadas visualmente con badge `Agotado` (`available_quota <= 0`).
  - Validación estricta en `next()`: exige dirección domiciliaria, fecha de entrega (`delivery_date`), franja horaria (`time_slot_id`) y teléfono de contacto.
  - En `PurchaseDetailComponent`, despliega la fecha y el rango horario programado.
- **Creación de Orden:** Se invoca `storeOrder(cartId, shipping_id, business_shipping_id, payment, contact, { delivery_date, time_slot_id })`.

---

## 2. Contratos HTTP Comprobados

| Método | Endpoint Backend | Parámetros / Query | Modelo TypeScript en `store` |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/shipping_business/pickup-locations` | N/A | `PickupLocationModel[]` |
| `GET` | `/api/v1/shipping_business/delivery-schedule/settings` | N/A | `DeliveryScheduleSettings` |
| `GET` | `/api/v1/shipping_business/delivery-schedule/availability` | `?from=YYYY-MM-DD&to=YYYY-MM-DD` | `DeliveryScheduleDay[]` |
| `POST` | `/api/v1/order` | Payload JSON según tipo de entrega | `storeOrder(...)` |

### Discriminadores de Tipo de Envío
En `ShippingBusiness` (`shippingBusiness.model.ts`):
- `shipping_type_id?: number` (1: Retiro, 2: Despacho Local, 4: Despacho Programado).
- `shipping_type?: 'store_pickup' | 'local_delivery' | 'scheduled_local_delivery' | string`.

### Manejo de Errores HTTP 422
En `OrderService.storeOrder()`:
- Errores con arreglo de stock o estructura `stockDetails` / `errorCode === 'NO_STOCK'` emiten por `noStockError$`.
- Errores de disponibilidad de franja horaria, cupo agotado o punto de retiro inactivo emiten por `orderAvailabilityError$`, permitiendo al usuario modificar la selección en el checkout sin reiniciar el estado ni limpiar el carrito.

---

## 3. Evidencia de los Payloads (`POST /api/v1/order`)

### Tipo 1: Retiro en Tienda (`store_pickup`)
```json
{
  "business_shipping_id": 5,
  "cart_id": "cart-12345",
  "shipping_id": null,
  "payment_id": 1,
  "contact": "+56912345678",
  "pickup_location_id": 10
}
```

### Tipo 2: Despacho Local Tradicional (`local_delivery`)
```json
{
  "business_shipping_id": 6,
  "cart_id": "cart-12345",
  "shipping_id": "address-uuid-99",
  "payment_id": 2,
  "contact": "+56912345678"
}
```

### Tipo 4: Despacho Programado (`scheduled_local_delivery`)
```json
{
  "business_shipping_id": 7,
  "cart_id": "cart-12345",
  "shipping_id": "address-uuid-99",
  "payment_id": 1,
  "contact": "+56912345678",
  "delivery_date": "2026-11-10",
  "time_slot_id": 42
}
```

---

## 4. Resultados de Pruebas

### 4.1. Pruebas Unitarias Automatizadas
- **Comando:** `npm test -- --watch=false --browsers=ChromeHeadless`
- **Total:** 92 pruebas ejecutadas en Karma / Jasmine.
- **Resultado:** **92 exitosas, 0 fallidas (100% SUCCESS)**.
- **Casos de prueba cubiertos en servicios:**
  - `ShippingBusinessService`: Consulta de `/pickup-locations`, `/delivery-schedule/settings` y `/delivery-schedule/availability`.
  - `OrderService`: Envío de payloads correctos para Tipo 1, Tipo 2 y Tipo 4, y discriminación de errores HTTP 422 (stock vs agenda/cupos).

### 4.2. Compilación de Producción (SPA y Servidor SSR)
- **Comando:** `npm run build`
- **Resultado:** Compilación completa y exitosa de bundles de navegador y servidor SSR (`/app/dist/store`). Sin errores de sintaxis, imports faltantes ni violaciones de tipado.

### 4.3. Nota sobre Pruebas de Integración Real
> **Declaración expresa:** Las pruebas del frontend en este entorno se ejecutaron contra el entorno de pruebas unitarias con simulación de peticiones HTTP (`HttpClientTestingModule` / `HttpTestingController`) y validación de compilación del servidor SSR. No se ejecutó una sesión con el servicio backend `back_tienda` levantado en vivo en este contenedor, por lo que la compatibilidad con el backend se sustenta en el estricto apego a los contratos de interfaz y payloads documentados.

---

## 5. Riesgos Encontrados

1. **Concurrencia en Último Cupo (Race Condition Backend):**
   - El frontend muestra la disponibilidad de cupos de forma puramente informativa (según lo dispuesto en los requerimientos, sin reservas temporales).
   - *Mitigación:* Si dos clientes seleccionan el último cupo simultáneamente, el backend rechaza la orden con HTTP 422. `OrderService` captura este error y `CheckoutComponent` despliega una alerta clara que permite volver y seleccionar otra franja horaria sin reiniciar la sesión del checkout.
2. **Discrepancia Horaria Cliente-Servidor:**
   - Si el dispositivo del usuario tuviese la hora o zona horaria desconfigurada, los cálculos de `min_advance_minutes` podrían diferir ligeramente.
   - *Mitigación:* Se fijó explícitamente la zona horaria `America/Santiago` (`Intl.DateTimeFormat`) para formatear y calcular las fechas límite (`from` y `to`).
3. **Persistencia Histórica de Órdenes:**
   - La orden confirmada debe mostrar los datos históricos de la entrega programada o del punto de retiro.
   - *Observación:* La pantalla de confirmación posterior (`ConfirmComponent`) delega en el backend (`/confirm`) la lectura de los datos finales guardados en la orden.

---

## 6. Defectos Pendientes

- **Ninguno detectado:** Todos los requerimientos especificados para Tipo 1, Tipo 2 y Tipo 4 fueron cubiertos, los tipos de datos son estrictos y no hay regresiones en la suite de pruebas ni en el proceso de compilación SSR.

---

## 7. Archivos Afectados

1. `src/app/core/models/shippingBusiness.model.ts` (modificado)
2. `src/app/core/models/pickupLocation.model.ts` (creado)
3. `src/app/core/models/deliverySchedule.model.ts` (creado)
4. `src/app/core/services/shipping-business.service.ts` (modificado)
5. `src/app/core/services/shipping-business.service.spec.ts` (creado)
6. `src/app/core/services/order.service.ts` (modificado)
7. `src/app/core/services/order.service.spec.ts` (creado)
8. `src/app/modules/checkout/checkout.module.ts` (modificado)
9. `src/app/modules/checkout/components/checkout/checkout.component.ts` (modificado)
10. `src/app/modules/checkout/components/checkout/checkout.component.html` (modificado)
11. `src/app/modules/checkout/components/purchase-detail/purchase-detail.component.ts` (modificado)
12. `src/app/modules/checkout/components/purchase-detail/purchase-detail.component.html` (modificado)
13. `src/app/modules/checkout/components/pickup-location/pickup-location.component.ts` (creado)
14. `src/app/modules/checkout/components/pickup-location/pickup-location.component.html` (creado)
15. `src/app/modules/checkout/components/pickup-location/pickup-location.component.scss` (creado)
16. `src/app/modules/checkout/components/delivery-schedule-picker/delivery-schedule-picker.component.ts` (creado)
17. `src/app/modules/checkout/components/delivery-schedule-picker/delivery-schedule-picker.component.html` (creado)
18. `src/app/modules/checkout/components/delivery-schedule-picker/delivery-schedule-picker.component.scss` (creado)

---

## 8. Conclusión

### **APROBADO**

La integración técnica de los tres métodos de envío (`store_pickup`, `local_delivery` y `scheduled_local_delivery`) en `store` cumple rigurosamente con los contratos acordados, la arquitectura multitenant, el soporte para SSR, el diseño responsive y táctil (≥44px), y la prevención de regresiones en el flujo tradicional de compras.
