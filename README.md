# ArcanaLogic · Legal

Sitio estático independiente para `arcanaLogic/legal`, destinado a GitHub Pages.
No contiene SDK, integraciones RapidAPI ni código de la aplicación móvil/backend.

## Estado del contenido

- Español: plantilla del original aportado, versión candidata 1.0, borrador
  del 2 de noviembre de 2026.
- Inglés, portugués, francés, italiano y alemán: traducciones completas,
  **pendientes de revisión jurídica y lingüística y de aprobación**.
- El original también está pendiente de revisión jurídica, técnica y aprobación.
  La plantilla española conserva el contenido del original e incorpora
  referencias a los datos del titular. `site.config.json` conserva el hash del
  original histórico y el hash independiente de la plantilla.
- No se ha establecido una fecha de entrada en vigor: la fecha visible es la del
  borrador, no una declaración de aprobación o vigencia.
- Las condiciones describen el motor de reglas Rider-Waite-Smith (RWS), los planes
  y los límites del documento original. No describen el estado de implementación
  de la PoC ni modifican sus funcionalidades.
- Las páginas no registran aceptación, identidad ni consentimiento. No incluyen
  formularios, scripts de seguimiento, publicidad ni recursos de terceros.
  La infraestructura de GitHub Pages puede tratar datos según sus propias reglas;
  este proyecto no establece una política de privacidad para esa infraestructura.

## Construcción reproducible

Se necesita Node.js 22 o posterior. **No hay dependencias npm ni instalación.**
El workflow fija Node 22. Ejecutar desde la raíz del repositorio:

```bash
node scripts/build.mjs
node scripts/validate.mjs
node scripts/test.mjs
```

Alternativamente, `npm test` ejecuta las tres operaciones sin instalar paquetes.
El conversor propio acepta únicamente el subconjunto Markdown utilizado: títulos,
párrafos, listas, negritas y separadores. Escapa HTML y rechaza bloques no soportados.
Las traducciones se editan en `src/<idioma>/terms.md`; no editar `dist/` a mano.
`dist/` se genera localmente, está ignorado en Git y se sube como artefacto de Pages.

Las validaciones comprueban el hash de la plantilla española, 17 apartados ordenados y aceptación,
estructura de 95 bloques, cantidades de listas, todos los números y los textos
traducidos de cuotas comerciales, precios, referencias RWS, etiquetas de revisión,
balance de etiquetas HTML, rutas y fragmentos bajo `/legal/`, archivos permitidos
para publicar y patrones de secretos. La segunda generación debe ser idéntica.
Estas comprobaciones **no sustituyen la revisión jurídica/lingüística ni un validador
HTML completo**. Tras cambiar el original autorizado, revisar manualmente todas las
traducciones y actualizar deliberadamente el hash de la plantilla, la versión y las comprobaciones.

## Rutas previstas

- Selección de idioma: `https://arcanalogic.github.io/legal/`.
- Español predeterminado: `https://arcanalogic.github.io/legal/es/terms/`.
- Otros idiomas: `/legal/en/terms/`, `/legal/pt/terms/`, `/legal/fr/terms/`,
  `/legal/it/terms/` y `/legal/de/terms/` en el mismo host.

La raíz ofrece español como acción principal; no redirige automáticamente ni
elige por geolocalización. El idioma de cada página está declarado con `lang`.
El diseño usa CSS local responsive, controles enfocables, enlaces de salto,
índice, selector de idioma y estilos de impresión. Las páginas se marcan
`noindex,follow` mientras sean borradores; esto no impide su acceso público.

## GitHub Actions y publicación

Remoto previsto: `https://github.com/arcanaLogic/legal.git`. Rama principal: `main`.

**Crear el repositorio público, hacer push y activar Pages requieren autorización
expresa del usuario.** El usuario ya ha creado el repositorio público y ha
autorizado el primer push. La publicación efectiva y la activación de Pages
deben verificarse; la existencia del repositorio no acredita el despliegue.
Se necesita autenticación válida con permisos sobre la cuenta de destino. No
introducir contraseñas ni tokens en comandos, remotos, código, archivos o commits.

Después de la aprobación y autenticación:

1. Inspeccionar de nuevo el repositorio remoto si existe; no sobrescribir su
   contenido ni usar force push. Si no existe, crear únicamente `arcanaLogic/legal`.
2. Revisar y guardar los archivos fuente y el workflow en la rama principal,
   sin incluir `dist/` ni datos de acceso.
3. Configurar Settings → Pages → Source: **GitHub Actions** (API: build_type=workflow).
   No seleccionar una carpeta `/dist` de una rama como origen.
4. Publicar los cambios revisados. El workflow valida pull requests y construye
   la rama main; solo main/despacho manual publican el artefacto `dist/`.
5. Revisar los jobs `build` y `deploy` y el entorno `github-pages`.
6. Comprobar por HTTPS la raíz y las seis rutas: HTTP 200, idioma correcto,
   contenido íntegro, CSS cargado, enlaces, índice y aviso de borrador/revisión.

El job de construcción solo puede leer el contenido. El job de publicación tiene
`pages: write` e `id-token: write`, mediante el token efímero del workflow.
No hace falta añadir secretos personales al repositorio. Las acciones oficiales
se seleccionan por versión mayor; revisar actualizaciones de esas acciones.

## Revisión del procedimiento de eliminación de cuentas

Ejecutar `npm test` para generar y validar el artefacto de publicación en
`dist/`. Ejecutar `npm run preview` para generar y validar también los
borradores en `dist-preview/`. Para revisar en navegador, servir el directorio
de vista previa bajo `/legal/`. La vista previa contiene cuatro secciones nuevas
en seis idiomas: `privacy`, `faq`, `contact` y `delete-account`. El borrador
de Privacidad cubre el procedimiento de eliminación y requiere completar la
política del producto antes de su aprobación.

El catálogo de `site.config.json` admite los estados `draft`, `review` y
`approved`. El workflow publica exclusivamente `dist/`. Las secciones nuevas
en estado `draft` o `review` se generan solo en la vista previa. Las seis
Condiciones históricas conservan su disponibilidad y sus avisos de revisión.
`site.variables.json` centraliza los valores públicos de todos los idiomas.
En Markdown, `{{nombreVariable}}` requiere un valor. `{{?nombreVariable}}` se
coloca al final de un elemento de lista completo y omite ese elemento si
el valor es `null`. Los valores se escapan al renderizar HTML.
Para exigir un campo opcional en una sección, añadirlo a `requiredVariables`
en su entrada del catálogo. La generación y validación fallarán si está
pendiente. `taxId` se omite mientras se determina si corresponde publicarlo.
`supportEmail` sigue pendiente de confirmación en la configuración oficial.
Nunca incorporar datos de acceso al buzón al repositorio.

Antes de aprobar estas secciones, comprobar el flujo en la app, el borrado
efectivo, la confirmación y la atención del buzón alternativo. Confirmar el
inventario de datos, la retención aplicable y el tratamiento de cuentas sin
un canal verificado. Revisar el original español y las cinco traducciones,
actualizar la redacción al estado comprobado y registrar la evidencia de
verificación antes de cambiar `accountDeletionVerified` y el estado de cada
documento. La URL de eliminación de cuenta solo se debe registrar en Play
Console una vez publicada y comprobada desde fuera de la app.

### Cambios para una futura revisión de Condiciones

- **§5, Cuentas y autenticación.** Añadir la solicitud autenticada desde
  Perfil, con confirmación expresa. Conservar las advertencias actuales sobre
  recuperación de cuentas anónimas. Remitir a la página de eliminación para
  solicitudes sin acceso a la app y verificación de la titularidad.
- **§10, Historial, conservación y eliminación.** Añadir que el servicio
  registra la solicitud, que el plazo máximo previsto es de 48 horas desde
  su recepción y que se enviará confirmación tras completar el borrado.
  Conservar la cobertura de los datos asociados y las excepciones legales
  de conservación.
- **§§7 y 10, Compras y eliminación.** Mantener las cláusulas actuales y
  aclarar que eliminar la cuenta no cancela automáticamente una suscripción
  de Google Play, que se gestiona por separado en la tienda.
- **§17, Contacto.** Añadir el canal específico de eliminación, separado
  del soporte general, cuando ambos datos estén confirmados.

Aplicar estos cambios a las seis versiones mediante revisión editorial
autorizada y actualizar el hash de la plantilla de forma deliberada.

## Pendientes antes de declarar publicado

Revisión/aprobación del borrador y traducciones; confirmar si corresponde publicar
la identificación fiscal del titular; autenticación y
permisos GitHub; autorización para crear/publicar; ejecución real del workflow;
verificación de todas las URL públicas y revisión visual en Android/iOS.
La preparación técnica local no acredita un despliegue ni aprobación legal.
