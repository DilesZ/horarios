# Horarios — Dashboard de Planificación de Turnos 2026

Dashboard web interactivo para la planificación de turnos y vacaciones del equipo de Sistemas (junio–septiembre 2026).

## Stack tecnológico

- **React 18** (vía CDN, sin bundler en producción)
- **Tailwind CSS 3** (compilado con CLI)
- **Babel** (transpilación JSX → JS)
- **Jest + Testing Library** (tests unitarios)
- **ESLint + Prettier** (calidad de código)
- **SheetJS (XLSX)** (exportación a Excel)

## Estructura del proyecto

```
horarios/
├── src/
│   ├── app.jsx          # Fuente React principal (lógica + UI)
│   └── styles.css       # Entrada de Tailwind CSS
├── __tests__/
│   ├── basic.test.js            # Smoke test básico
│   ├── coverageLogic.test.js    # Tests de cobertura y equidad
│   └── dataValidation.test.js   # Tests de validación de exportación
├── app.js               # Salida compilada (no editar manualmente)
├── index.html           # Entrada HTML (carga CDN React + app.js)
├── package.json
├── babel.config.json
├── jest.config.cjs
├── eslint.config.js
├── tailwind.config.js
├── vercel.json          # Configuración de despliegue Vercel
└── explicacion_calendario_2026.txt  # Documentación técnica detallada
```

## Instalación y uso

```bash
npm install
npm run build      # Transpila JSX + CSS → dist/
```

Abrir `dist/index.html` en el navegador, o servir con:

```bash
npx serve dist
```

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run build` | Compila CSS + JSX y copia assets a `dist/` |
| `npm test` | Ejecuta la suite de tests con Jest |
| `npm run test:watch` | Tests en modo watch |
| `npm run lint` | Linting con ESLint |
| `npm run format` | Formato con Prettier |
| `npm run validate` | Tests + lint |

## Tipos de turno

| Código | Descripción | Color |
|---|---|---|
| `O40` | 40h — entrada 9:00, salida 17:00 | Azul |
| `O42` | 42h — entrada 9:00, salida 18:00 (V: 14:00) | Violeta |
| `O30` | Intensiva 30h — entrada 8:00, salida 14:00 | Verde |
| `T30` | Teletrabajo 30h | Cian |
| `V`   | Vacaciones | Rojo |

## Equipo

| Nombre | Rol | Días en oficina | Grupo |
|---|---|---|---|
| Kike | SysAdmin | L, M, X, V | B |
| Jose | DevOps | L, X, J, V | B |
| Enrique | Manager | X, J | B |
| David | Backend | J, V | A |
| Luis | Frontend | L, M | A |
| Ariel | FullStack | L, M, J, V | B |

## Reglas de planificación

- **Cobertura 18h (L–J):** al menos un `O42` en oficina cada día.
- **Viernes:** al menos un `O40` en oficina; `O42` termina a las 14:00.
- **Intensiva:** máximo 3 personas en `O30` por día.
- **Equidad:** objetivo mínimo de **6 semanas** intensivas por integrante; ideal **7 semanas**.
- **Integridad semanal (reglas estrictas):**
  - `O30` solo en semana operativa completa (sin días sueltos).
  - No mezclar `O40` y `O42` en la misma semana para un mismo integrante.
  - No combinar más de un tipo de jornada por semana por integrante.
- **Presencia por grupos:** al menos 1 de {Enrique, Luis, David} y 1 de {Jose, Ariel, Kike} en oficina cada día.
- **Vacaciones:** los integrantes no reciben semana intensiva en semanas con vacaciones.
- **Oficina forzada (`OF`):** si la cobertura falla por vacaciones, se asigna presencia en oficina obligatoria al candidato con menor carga forzada acumulada.

## Vistas disponibles

- **Vista matriz:** tabla clásica por integrante × día con resaltado de fila/columna activa, iconos de oficina y teletrabajo por celda.
- **Vista calendario:** 4 tarjetas mensuales (Jun–Sep), cada día muestra el estado compacto de todos los integrantes visibles.

## Tests

```bash
npm test
```

La suite cubre:
- Cobertura presencial O42 en días L–J.
- Tope de 3 intensivas diarias.
- Integridad semanal estricta (sin O30 sueltos, sin mezcla O40/O42).
- Registro de equidad distributiva con auditoría semanal.
- Validación y construcción de payload de exportación Excel.

## Despliegue

El proyecto está configurado para Vercel (`vercel.json`). Cada push a `main` puede desplegar automáticamente si el repositorio está conectado.

---

*Creado y mantenido por David Ramos — Dept. Sistemas*
