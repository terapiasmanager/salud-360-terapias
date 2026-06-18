# salud-360-terapias

Sistema web Salud 360 para gestion de pacientes, visitas, actas, formularios e informes terapeuticos.

## Supabase

Para guardar formularios, encuestas y borradores en Supabase, ejecuta en el SQL Editor el archivo:

`supabase_documentos_y_seguridad.sql`

La app mantiene respaldo local en el navegador con `localStorage`, pero Supabase debe tener la tabla `documentos` para sincronizar formularios y encuestas entre dispositivos.

## Seguridad

El login antiguo con usuarios en `script.js` queda como respaldo temporal. Para produccion, crea usuarios en Supabase Auth con emails internos como `admi@salud360.local` y activa las politicas RLS comentadas en `supabase_documentos_y_seguridad.sql`.
