# Cobro seguro de planes con MercadoPago

## Qué cambió

Antes el plan se activaba en el navegador al volver de MercadoPago: bastaba con
abrir `/planificador?payment_success=true&plan=premium` para tener el plan gratis,
y el precio lo mandaba el navegador (se podía pagar $1).

Ahora:

1. **El precio lo pone el servidor.** La función `mercadopago` lee el precio de
   `app_settings` y verifica que el evento sea de quien paga.
2. **El plan lo activa solo MercadoPago.** Al aprobarse el pago, MercadoPago avisa
   a la función `mercadopago-webhook`. Esa función consulta el pago a MercadoPago
   con nuestro token, controla que esté aprobado, en pesos y por el monto correcto,
   activa los módulos y registra el pago (una sola vez).
3. **El navegador no puede tocar `active_modules`.** Un trigger en la base conserva
   los módulos aunque el planificador guarde `planner_data` entero. Solo el servidor
   y el superadmin (panel Clientes) los cambian.
4. **"Es premium" se decide por `active_modules`**, ya no por el servicio
   `eventpix_premium` marcado como listo (eso también lo podía escribir el navegador).
5. Solo el superadmin ve los pagos y cambia los precios.

Al volver de MercadoPago, el planificador espera hasta 1 minuto a que llegue la
confirmación y avisa. Si tarda más, el plan se activa igual cuando llegue el aviso.

## Pasos para ponerlo en producción (en este orden)

1. **Base de datos:** ejecutar `migrations/2026_10_cobro_seguro_planes.sql` en el
   SQL Editor de Supabase. Se puede ejecutar más de una vez.
2. **Funciones:**
   ```bash
   supabase functions deploy mercadopago
   supabase functions deploy mercadopago-webhook --no-verify-jwt
   ```
   El webhook va sin verificación de JWT porque MercadoPago no manda uno
   (también queda indicado en `supabase/config.toml`).
3. **Secreto:** `MP_ACCESS_TOKEN` ya debería estar en Supabase Secrets (lo usaba la
   función anterior). `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los pone Supabase solo.
4. **Sitio:** publicar el frontend nuevo.

## Cómo probarlo

- Abrir `/planificador?payment_success=true&plan=premium` sin pagar: no se activa
  nada y al minuto aparece el aviso de "MercadoPago todavía lo está confirmando".
- Hacer un pago real (o de prueba con credenciales de test): el plan se activa y
  aparece en Admin → Premium con el número de pago de MercadoPago.
- En Supabase → Edge Functions → `mercadopago-webhook` → Logs se ve cada aviso.

## Pendiente (no incluido)

- Devoluciones y contracargos: hoy un pago devuelto no desactiva el plan.
  Se puede agregar en `mercadopago-webhook` (estados `refunded` / `charged_back`).
