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

## Rutas y navegación

La portada `/legal/` muestra un selector y un catálogo de documentos por
idioma. Cada ficha usa los títulos de su idioma. En los documentos, el menú
de secciones conserva el idioma, el selector de idioma conserva la sección
y la marca ArcanaLogic vuelve a la portada.

Las rutas usan `/legal/{idioma}/{seccion}/`, con seis idiomas (`es`, `en`,
`pt`, `fr`, `it`, `de`) y cinco secciones (`terms`, `privacy`, `faq`,
`contact`, `delete-account`). La portada y los menús muestran únicamente
las rutas incluidas en la salida que se está consultando.

## Preparación y publicación en GitHub Pages

- `npm test` valida la salida de producción en `dist/` con los estados
  editoriales que constan en `site.config.json`.
- `npm run preview` valida las 30 páginas de documentos y la portada en
  `dist-preview/`, con los avisos de revisión que correspondan.
- `node scripts/test-release.mjs` ejecuta los mismos scripts que Actions,
  comprueba que el directorio coincide con el paso de subida del workflow y
  exige las 30 rutas más la raíz con la configuración real.

Los documentos en `draft` solo aparecen en la vista previa. Los documentos
en `review` se incluyen en `dist/` con sus avisos de revisión. El estado
`approved` exige verificar la eliminación de cuentas antes de retirar los
avisos editoriales o activar el enlace de correo de eliminación.
La publicación informativa en `review` no requiere cambiar
`accountDeletionVerified`.

El workflow valida los PR dirigidos a `main`. La subida de `dist/` y el
despliegue se ejecutan desde `main` en push o despacho manual, tras completarse
el job de construcción. `dist-preview/` es una salida local de revisión.

Para publicar el catálogo completo:

1. Ejecutar `node scripts/test-release.mjs` y revisar las 30 páginas y la
   portada en `dist/`. El workflow genera el artefacto desde las fuentes
   versionadas.
2. Revisar el PR de `develop` a `main` y confirmar en **Settings → Pages**
   que **Source** es **GitHub Actions** antes del merge autorizado, pues este
   inicia el workflow de publicación.
3. Comprobar que los jobs `build` y `deploy` terminan correctamente para el SHA
   promovido. Verificar por HTTPS los 31 HTML y el CSS en la URL pública. Revisar
   el idioma, el cambio de sección y de idioma, y el regreso a la portada.

El job de construcción tiene acceso de lectura. El de publicación recibe
`pages: write` e `id-token: write` en el entorno `github-pages`.

## Revisión del procedimiento de eliminación de cuentas

Ejecutar `npm test` para generar y validar el artefacto de publicación en
`dist/`. Ejecutar `npm run preview` para generar y validar también los
borradores en `dist-preview/`. Para revisar en navegador, servir el directorio
de vista previa bajo `/legal/`. La vista previa contiene cuatro secciones nuevas
en seis idiomas: `privacy`, `faq`, `contact` y `delete-account`. El borrador
de Privacidad cubre el procedimiento de eliminación y requiere completar la
política del producto antes de su aprobación.

`site.variables.json` centraliza los valores públicos de todos los idiomas.
En Markdown, `{{nombreVariable}}` requiere un valor. `{{?nombreVariable}}` se
coloca al final de un elemento de lista completo y omite ese elemento si
el valor es `null`. Los valores se escapan al renderizar HTML.
Para exigir un campo opcional en una sección, añadirlo a `requiredVariables`
en su entrada del catálogo. La generación y validación fallarán si está
pendiente. `taxId` se omite mientras se determina si corresponde publicarlo.
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
