# Migración a TypeScript — progreso

Migración incremental de la base JS/JSX a TypeScript. Next.js permite que `.ts`
y `.js` convivan (`allowJs: true`), así que cada fase es **deployable por sí
sola**. Prisma ya genera tipos (`@prisma/client`), lo que da tipado de la base
gratis.

> **Restricción del entorno:** este asistente no puede correr `tsc` / `next build`
> en su sandbox (no hay Node). El tipado se escribe con cuidado y **la
> verificación la corre el usuario localmente** con `npm run typecheck` /
> `npm run build`, reportando los errores que TS encuentre.

**Estado general:** ✅ Completo — no queda ningún `.js`/`.jsx` en `app/`, `components/`, `lib/`

| Fase | Descripción | Estado |
|------|-------------|--------|
| 0 | Tooling (tsconfig, deps, scripts) | ✅ Hecho · verificado en Vercel |
| 1 | Capa de datos: `lib/*` + `lib/types.ts` | ✅ Hecho · verificado en Vercel |
| 2 | API routes (`app/api/**`) | ✅ Hecho · verificado en Vercel |
| 3 | Admin: `AdminContext` + componentes + `app/admin/lib/*` | ✅ Hecho |
| 4 | Componentes de landing + páginas + `middleware` | ✅ Hecho |

Leyenda: ✅ hecho · 🟡 en progreso · ⏳ pendiente

---

## Cómo verificar (correr localmente tras cada fase)

```bash
npm install          # instala typescript + @types (primera vez)
npm run typecheck    # tsc --noEmit — debe pasar sin errores
npm run build        # build completo de Next (incluye type-check)
```

Si `typecheck` tira errores, pegámelos y los resuelvo.

---

## Fase 0 — Tooling ✅

Sin cambios de comportamiento. Habilita TypeScript en el proyecto.

- [x] `package.json`: devDeps `typescript`, `@types/node`, `@types/react`, `@types/react-dom`
- [x] `package.json`: script `"typecheck": "tsc --noEmit"`
- [x] `tsconfig.json` (preset Next.js: `allowJs`, `strict`, paths `@/*`)
- [x] `next-env.d.ts`
- [x] Eliminar `jsconfig.json` (reemplazado por `tsconfig.json`)

**Notas:** `allowJs: true` + `checkJs` apagado ⇒ los `.js` existentes **no** se
type-checkean, así que nada se rompe. Solo los archivos que renombramos a `.ts`
pasan por el checker. `strict: true` queda activo para el código nuevo tipado.

---

## Fase 1 — Capa de datos ✅

El mayor retorno con el menor riesgo: lógica pura + contratos de dominio.

- [x] `lib/types.ts` (nuevo) — tipos de dominio compartidos (`Locale`,
      `RsvpFormData`, `CompanionFood`, `GuestSeed`)
- [x] `lib/guests.js` → `lib/guests.ts` (`parseJson` genérico, `normalizeName`,
      `splitName`, `buildGuestsFromRsvp`)
- [x] `lib/prisma.js` → `lib/prisma.ts` (singleton tipado)
- [x] `lib/adminAuth.js` → `lib/adminAuth.ts` (HMAC + cookies)
- [x] `lib/calendar.js` → `lib/calendar.ts`
- [x] `lib/email.js` → `lib/email.ts` (`EmailCopy`, `Record<Locale, EmailCopy>`)

**Notas:** las API routes (todavía `.js`) importan estos módulos sin extensión
(`@/lib/...`), así que la resolución sigue funcionando. Los `.js` no se
type-checkean contra los `.ts`, por eso no aparecen errores cruzados en esta
fase — empiezan a aparecer cuando migremos las routes (Fase 2).

> ⚠️ **Caveat:** `scripts/backfill-guests.mjs` (script one-off, `npm run
> db:backfill-guests`) importa `../lib/guests.js` y `../lib/prisma.js` con
> extensión `.js` explícita y se corre con `node` directo. Como esos módulos
> ahora son `.ts`, ese script quedó roto: Node no importa TypeScript sin loader.
> Es un backfill que ya se usó una vez; si hiciera falta de nuevo, hay que
> reescribirlo (p. ej. correrlo con `tsx`/`ts-node`) o restaurar shims `.js`.
> No afecta al build ni a la app en producción.

---

## Fase 2 — API routes ✅

Tipar `request.json()` y las respuestas. 11 archivos.

- [x] `app/api/rsvp/route.js` → `.ts`
- [x] `app/api/calendar/route.js` → `.ts`
- [x] `app/api/admin/login/route.js` → `.ts`
- [x] `app/api/admin/logout/route.js` → `.ts`
- [x] `app/api/admin/guests/route.js` → `.ts`
- [x] `app/api/admin/guests/assign-table/route.js` → `.ts`
- [x] `app/api/admin/guests/tags/route.js` → `.ts`
- [x] `app/api/admin/rsvps/route.js` → `.ts`
- [x] `app/api/admin/tables/route.js` → `.ts`
- [x] `app/api/admin/invitees/route.js` → `.ts`
- [x] `app/api/admin/invitees/import/route.js` → `.ts`

**Notas / decisiones:**
- `request.json()` queda como `any` (es JSON no confiable); el RSVP se castea a
  `RsvpFormData`. Los accesos a propiedades siguen compilando sin fricción.
- Bajo `strict`, `catch (error)` da `error: unknown`. Donde se lee
  `error.code` (Prisma `P2025`/`P2002`) se usa `(error as { code?: string }).code`.
- Handlers tipados como `(request: Request)`.
- `import`: guard `typeof file === "string"` para estrechar `FormDataEntryValue`;
  filas del Excel tipadas como `unknown[][]`; insert como `Prisma.InviteeCreateManyInput[]`.
- `guests` PATCH: `guestData` tipado con campos opcionales (`food`/`needsBus`/
  `tableId`) para poder construirlo incremental.

---

## Fase 3 — Admin (UI + estado) 🟡

Lo más pesado. Se hace en sub-pasos verificables.

**3a — Tipos del dominio + helpers** ✅
- [x] `app/admin/types.ts` (nuevo): `SerializedGuest/Submission/Table/Invitee`,
      `Row`, `GuestEdit`, `ReconcileItem/Result`, `MatchConfidence`, etc.
      (`Serialized<T>` mapea los `Date` de Prisma a `string`.)
- [x] `app/admin/lib/csv.js`, `format.js`, `rows.js`, `match.js` → `.ts`
      (en `match.ts` se reescribió el armado de índices con un helper `pushTo`
      type-safe en vez del `map.get() || map.set()`).

**3b — Estado + datos del server** ⏳
- [ ] `app/admin/AdminContext.js` → `.tsx` (tipar el value del context)
- [ ] `app/admin/page.js` → `.tsx` (helpers `serialize*`)

**3c — Componentes** ✅
- [x] `app/admin/AdminDashboard.js` → `.tsx` (props tipadas)
- [x] `app/admin/components/*` (12 componentes) → `.tsx`
- [x] `app/admin/login/page.js` → `.tsx` (`searchParams` como `Promise`)

Notas 3c: `StatCard` con interfaz de props; `Sidebar` con `counts:
Record<string, number|null>`; custom property CSS (`--value`) casteada a
`CSSProperties`; `GuestDrawer` con estado `form: DrawerForm | null` + helper
`updateForm` y guardas de no-null; `FollowUpView` con `useRef<HTMLInputElement>`.
El resto (Guests/Table/Messages/BulkBar) son renombrados directos: los handlers
y `.map` ya quedan tipados por el contexto.

---

## Fase 4 — Landing + páginas + middleware ✅

- [x] `components/*` (`WeddingLanding`, `RsvpForm`, `Countdown`, `PhotoGallery`,
      `Botanical`, `Reveal`) → `.tsx`
- [x] `app/page.js`, `app/en/page.js`, `app/layout.js` → `.tsx` (`metadata`/
      `viewport` tipados con `Metadata`/`Viewport` de `next`)
- [x] `middleware.js` → `middleware.ts` (`request: NextRequest`)
- [ ] Eliminar `allowJs` del `tsconfig`: se deja en `true` a propósito —
      `next.config.mjs` y `scripts/backfill-guests.mjs` siguen en JS (fuera del
      `include` de tsc, pero sin costo dejarlo).

Notas 4: `Reveal` (polimórfico con `as`) usa un bag de props permisivo para que
el `ref` + passthrough compilen con cualquier tag; `Botanical` con
`icons: Record<string, ReactNode>`; `Countdown`/`PhotoGallery` con `useRef`
tipado y tuplas explícitas; `RsvpForm` con `copy: Record<string, Record<…>>`.

---

## ✅ Migración terminada

Toda la base de la app es TypeScript. Quedan en JS sólo cosas fuera del alcance
de `tsc`: `next.config.mjs` y el script one-off `scripts/backfill-guests.mjs`
(ver caveat en Fase 1). Verificación continua: `npm run typecheck` en local y el
type-check de `next build` en cada deploy de Vercel.
