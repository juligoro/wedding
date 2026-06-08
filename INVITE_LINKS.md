# Links de invitación personalizados — progreso

Cada **hogar** (household) recibe un link único e impredecible
(`juli-tomi.wedding/i/<token>`). El link saluda al hogar por su nombre, viene
con **los nombres de los invitados precargados** y deja que cada persona
confirme **individualmente** (viene / no viene). El RSVP abierto queda
deshabilitado: el link es la única puerta de entrada (por ahora).

> **Restricción del entorno:** este asistente no corre `prisma` / `next build`
> en su sandbox. Las migraciones se escriben a mano (estilo del repo) y **la
> verificación la corre el usuario localmente** (`npx prisma migrate deploy`,
> `npx prisma generate`, `npm run build`).

## Decisiones (confirmadas con el usuario)

1. **Una fila por persona** en la planilla, agrupadas por una columna **Grupo**
   (alias aceptados: Hogar / Familia / Group). Filas con el mismo Grupo = un
   hogar = un link. Grupo vacío ⇒ hogar de una sola persona.
2. **Por persona**: cada invitado precargado tiene su propio toggle
   viene / no viene.
3. **`party` ya no se escribe** — se deriva de la cantidad de miembros.
4. **Saludo** (lo que ve el invitado): "Familia Goro" o "Lorena y Pablo", a
   elección por hogar. Columna **Saludo**.
5. **Idioma** por hogar (ES/EN) desde una columna **Idioma** → genera el link en
   el idioma correcto.
6. **Contacto a nivel hogar**: un email + un WhatsApp para quien completa (no por
   persona).
7. **Ya confirmaste**: si reabren el link tras responder, ven "¡Ya confirmaste!"
   + detalles del evento + calendario + "si necesitás editar algo, escribinos".
8. **Admin**: dos columnas nuevas — **Link personalizado** y **Mensaje completo**
   (saludo + link, listo para pegar en WhatsApp), cada una con botón de copiar.
9. **Solo el link**: el formulario abierto de `/` y `/en` se reemplaza por una
   nota "buscá tu link personalizado". Reversible en una línea.

Mensaje completo (placeholder, editable después):
> ¡Hola {greeting}! Nos encantaría que nos acompañen en nuestro casamiento.
> Confirmá tu asistencia acá: {link}

## Modelo de datos

`Invitee` (= hogar): `+token @unique`, `+greeting`, `+locale (default "es")`,
`+members` (JSON String `[{firstName,lastName}]`). `party` se mantiene = cantidad
de miembros. `Rsvp`: `+inviteeId` (FK → Invitee, `onDelete: SetNull`) para el
vínculo **exacto** respuesta↔hogar. El matcheo difuso existente queda como red de
seguridad.

**Estado general:** 🟡 En progreso

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Schema + migración + tipos compartidos | ✅ Aplicada en local |
| 2 | Importer agrupa filas en hogares + tokens | ✅ typecheck limpio |
| 3 | Ruta pública `/i/[token]` | ✅ typecheck limpio |
| 4 | RsvpForm con tarjetas por persona | ✅ typecheck limpio |
| 5 | API RSVP + `buildGuestsFromRsvp` por persona | ✅ typecheck limpio |
| 6 | Link como única entrada (`/`, `/en`) | ⏳ |
| 7 | Admin: columnas Link + Mensaje completo | 🟡 Hecho · falta verificación local |

Leyenda: ✅ hecho · 🟡 en progreso · ⏳ pendiente

---

## Fase 1 — Schema + migración 🟡

- [x] `prisma/schema.prisma`: `Invitee.token/@unique`, `greeting`, `locale`,
      `members`; `Invitee.rsvps Rsvp[]`. `Rsvp.inviteeId` + relación
      `invitee Invitee?` (`onDelete: SetNull`) + `@@index([inviteeId])`.
- [x] `prisma/migrations/20260608130000_add_invite_links/migration.sql`
      (hecho a mano, con **backfill de tokens** para invitees existentes antes de
      `SET NOT NULL`, usando `md5(random()::text || ':' || id)`).
- [x] `lib/types.ts`: `InviteeMember`, `InviteeContext`.

**Falta (lo corre el usuario en local):**
```bash
npx prisma migrate deploy   # aplica la migración (o npm run build, que ya la corre)
npx prisma generate         # regenera el client con los campos nuevos
npm run typecheck           # debe seguir limpio
```

> ⚠️ Hasta correr `prisma generate`, el client de Prisma no conoce `token` /
> `members` / `inviteeId`, así que TS marcará esos accesos. Es esperado: se
> resuelve al regenerar. Las fases 2–7 asumen el client regenerado.

---

## Fase 2 — Importer 🟡

- [x] `lib/invite.ts` (nuevo): `generateInviteToken` / `generateUniqueToken`
      (node:crypto, ~12 chars URL-safe), `parseLocale`, `joinNames` (es/en),
      `memberFullName`.
- [x] `app/api/admin/invitees/import/route.ts` reescrito:
      detecta **Grupo** (alias Hogar/Familia/Group/Household), **Saludo**,
      **Idioma**; agrupa filas por Grupo (vacío ⇒ hogar de una persona); arma
      `members` (dedup por nombre dentro del hogar); contacto a nivel hogar
      (primer valor no vacío); `greeting = Saludo || joinNames(nombres)`;
      `fullName = normalized = greeting`; `party = members.length`; **token
      único por hogar** (chequea contra tokens existentes en modo append).
      Append saltea hogares con `normalized` ya existente.
- [x] `FollowUpView` hint actualizado (una fila por persona; Grupo/Saludo/Idioma).
- [x] **Reimport estable por token** (mejora): el import ahora hace *upsert* por
      hogar usando `householdMatchKey` (Grupo normalizado, o nombres completos si
      no hay Grupo). **Conserva el token/link** al actualizar. `Agregar /
      actualizar` actualiza+suma sin borrar; `Reemplazar lista` además elimina
      los hogares que ya no están en la planilla. Respuesta del endpoint:
      `{ created, updated, deleted, skipped, imported }`. `AdminContext` muestra
      el resumen.

**Verificación local:** `npm run typecheck` (debe quedar limpio — antes fallaba
solo por `token` faltante). Prueba funcional real en Fase 3, cuando exista la
página del link; igual podés importar una planilla de prueba y mirar en
`npx prisma studio` que los hogares queden bien agrupados con su token.

## Fase 3 — Ruta `/i/[token]` 🟡

- [x] `app/i/[token]/page.tsx` (server component, `dynamic = "force-dynamic"`,
      `robots: noindex`): busca el invitee por token (`notFound()` si no existe),
      resuelve locale, parsea `members`, arma `InviteeContext`. Si el hogar ya
      tiene un RSVP (no borrado) → `InviteConfirmed`; si no → `WeddingLanding`
      con el contexto.
- [x] `components/InviteConfirmed.tsx` (nuevo): pantalla "¡Ya confirmaste!" con
      saludo, fecha (`getEventWhen`), botones de calendario y la nota
      "escribinos para editar". ES/EN.
- [x] `components/WeddingLanding.tsx`: prop opcional `invitee`; muestra
      `¡Hola {greeting}!` arriba del RSVP y le pasa `invitee` al formulario.
- [x] `components/RsvpForm.tsx`: acepta prop `invitee` (todavía **sin** efecto —
      el comportamiento por persona llega en Fase 4; renderiza genérico).
- [x] `app/globals.css`: estilos `.rsvp-greeting` + bloque `.invite-*`.

> **Nota de fase:** en esta fase el formulario del link todavía es el genérico
> (un titular + selector de acompañantes). La precarga de nombres y el "viene/no
> viene" por persona se implementan en Fase 4. La pantalla "ya confirmaste" y el
> saludo personalizado ya funcionan.

**Verificación local:** `npm run typecheck`. Prueba funcional: importá una
planilla de prueba, copiá un `token` desde `npx prisma studio`, y entrá a
`/i/<token>` → deberías ver el saludo. Cargá un RSVP de prueba con ese
`inviteeId` (o esperá a Fase 5) para ver la pantalla "ya confirmaste".

## Fase 4 — RsvpForm por persona 🟡

`components/RsvpForm.tsx` ahora tiene **dos modos** en un solo componente:

- **Modo link** (`invitee` presente): una **tarjeta por miembro** precargada con
  nombre/apellido (editables) + radios **Viene / No viene** + select de menú si
  viene. Sección de **contacto del hogar** (email + WhatsApp, precargados si la
  planilla los tenía). Si **alguno** viene: alergias + micro (a nivel grupo). Si
  **nadie** viene: se ocultan menú/alergias/micro y es un RSVP "no". Mensaje
  opcional. Arma un payload JSON con `token` + `members[]` y lo postea a
  `/api/rsvp`. Validación cliente: nombre por persona, email+WhatsApp, micro si
  hay asistentes.
- **Modo abierto** (sin `invitee`): el formulario de siempre, **intacto**
  (titular + selector de acompañantes + FormData). Se desactiva en Fase 6.

Helpers compartidos extraídos: `postRsvp`, `showSuccess`, bloque de éxito/error.

> **De esta fase:** el envío real desde el link **todavía no persiste** porque la
> API (`/api/rsvp`) aún no entiende el payload nuevo con `members[]`/`token`. Eso
> es la **Fase 5**. Hasta entonces, en el link vas a ver el formulario por persona
> correctamente, pero al enviar la API lo procesará como el shape viejo (faltan
> campos → error controlado). La UI y la validación cliente ya se pueden revisar.

**Verificación local:** `npm run typecheck`. Visual: entrá a `/i/<token>` y mirá
las tarjetas por persona, el toggle viene/no viene, y que al marcar "no viene" a
todos se oculten menú/micro.

## Fase 5 — API RSVP + builder ✅ (código)

- [x] `lib/types.ts`: `InviteRsvpMember`, `InviteRsvpPayload`.
- [x] `lib/guests.ts`: `buildGuestsFromMembers(members, contact)` — un `Guest`
      por miembro con su propio `attending` (rol Titular = índice 0, resto
      Acompañante), comida sólo si viene.
- [x] `app/api/rsvp/route.ts` reescrito con **dispatch**:
      `isInvitePayload` (tiene `token` + `members[]`) → `handleInviteRsvp`; si no
      → `handleOpenRsvp` (la lógica vieja, intacta). Helpers compartidos
      `resolveBaseUrl`, `memberName`.
- [x] `handleInviteRsvp`: busca el invitee por `token` (404 si no existe),
      normaliza/valida miembros y contacto, **bloquea doble confirmación**
      (409 si el hogar ya tiene RSVP no borrado), crea el `Rsvp` con
      `inviteeId` + agregado **sólo de los que vienen** (para que el mail liste
      bien a "los esperamos"), crea los `Guest` por persona, y manda el mail si
      alguno viene.

**Verificación local:** `npm run typecheck` + prueba end-to-end real:
1. Importá una planilla de prueba (con Grupo/Saludo/Idioma).
2. Copiá un token de `npx prisma studio` y entrá a `/i/<token>`.
3. Confirmá con asistencia mixta (uno viene, otro no) → debería:
   - guardar un `Rsvp` con `inviteeId` y `attending=true`;
   - crear N `Guest` con `attending` por persona (mirá en Studio);
   - al recargar `/i/<token>`, ver la pantalla **"ya confirmaste"**;
   - reintentar el POST → **409** "ya recibimos la confirmación".

## Extra — Alta manual de hogares ✅ (código)

- [x] `POST /api/admin/invitees`: crea **un hogar a mano** (members, saludo,
      idioma, email, whatsapp) generando su token. `joinNames` arma el saludo si
      no lo pasan.
- [x] `AdminContext.addInvitee(payload)` + expuesto en el contexto.
- [x] `FollowUpView`: panel **"Agregar un hogar a mano"** (filas de personas con
      agregar/quitar, saludo, idioma, contacto) → crea el hogar y su link sin
      planilla.
- [x] Protección: `Reemplazar lista` ya **no borra hogares que confirmaron**
      (cubre los altas manuales una vez que responden, y cualquier hogar que ya
      respondió aunque no esté en la planilla).

## Fase 6 — Solo el link (pendiente)
Reemplazar el formulario abierto en `/` y `/en` por una nota; reversible.

## Fase 7 — Admin 🟡

- [x] Estado **por `inviteeId` exacto**: `Row` ahora lleva `inviteeId`
      (`rows.ts`); `match.ts` agrega un índice `byInviteeId` y una coincidencia
      nueva **`link`** de máxima prioridad (prefiere una fila que asista, así un
      hogar mixto figura "Confirmó", y marca **todo** el hogar como matcheado
      para que no caiga en "fuera de lista"). `CONFIDENCE_LABELS.link = "Por
      link"`. El matcheo difuso por nombre queda de respaldo.
- [x] `FollowUpView`: dos columnas nuevas en la tabla de Seguimiento —
      **Link personalizado** (muestra `/i/<token>`, abre en pestaña nueva, botón
      *copiar*) y **Mensaje completo** (botón *Copiar mensaje*: arma
      "¡Hola {saludo}! … {link}", en ES o EN según el hogar). Origin tomado de
      `window.location.origin`. Estilos en `admin.css`.

> El mensaje completo por ahora es el placeholder acordado; se edita fácil en
> `messageFor()` cuando quieras afinarlo.

**Verificación local:** `npm run typecheck`. Visual: importá la planilla, y en
**Seguimiento** vas a ver las columnas Link/Mensaje con sus botones de copiar.
