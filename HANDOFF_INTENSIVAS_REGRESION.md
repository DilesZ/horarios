# Handoff: Regresion De Intensivas Minimas 2026

## Contexto

Este documento resume todo lo investigado sobre la regresion por la que el planificador deja de garantizar las 6 semanas minimas de intensivas por empleado en 2026.

La idea es poder reutilizar este contexto en otra sesion si se pierde la conversacion.

## Situacion Actual

- El repositorio local no incluye `.git`, asi que el historial local no se puede consultar con `git log`.
- El repo remoto analizado es `https://github.com/DilesZ/horarios`.
- El `index.html` carga `app.js`, asi que el comportamiento real del navegador depende de `app.js`, aunque la fuente principal sea `src/app.jsx`.
- La suite actual de tests pasa, pero no detecta el problema real de equidad minima para toda la plantilla.

## Commit Sospechoso

El ultimo commit remoto visible durante la investigacion fue:

- `07bc9d5198c7b1c2553b1e22a85f0ad8f133acc0`
- Mensaje: `Fix office coverage rebalance for Kike day off`

Ese commit anade:

- un cambio en la logica del viernes para exigir `O40` presencial, no `O42`
- una nueva funcion `repairConflictingWeekCoverage()`
- nuevas llamadas finales a esa funcion en `generateSchedule()`
- un test especifico para el caso de Kike libre el `2026-07-03`

## Hallazgo Principal

La regresion no esta en las constantes de objetivo ni en la auditoria. El problema aparece en el postprocesado final de `generateSchedule()` en `src/app.jsx`.

La secuencia conflictiva es esta:

- `ensureMinSixWeeksAllFinal(strictAudit.schedule);`
- `enforceEdgeWeekAlternation(strictAudit.schedule);`
- `applyUniversalHardening(strictAudit.schedule);`
- `repairConflictingWeekCoverage(strictAudit.schedule);`
- `ensureMinSixWeeksAllFinal(strictAudit.schedule);`
- `applyUniversalHardening(strictAudit.schedule);`
- `repairConflictingWeekCoverage(strictAudit.schedule);`

La nueva `repairConflictingWeekCoverage()` puede convertir semanas completas `O30` en `O40/O42` para arreglar cobertura de oficina. Como se ejecuta al final, despues vuelve a romper el minimo de 6 semanas en algunos empleados y ya no hay una fase suficientemente robusta que lo recupere sin volver a romper cobertura.

## Archivos Clave

- `src/app.jsx`
- `app.js`
- `__tests__/coverageLogic.test.js`
- `calendario_2026.html`
- `test_run.cjs`

## Funciones Clave En `src/app.jsx`

- `generateSchedule()`
- `buildEquityAudit()`
- `validateStrictWeeklyRules()`
- `enforceStrictWeeklyRules()`
- `ensureMinSixWeeksAllFinal()`
- `applyUniversalHardening()`
- `repairConflictingWeekCoverage()`

## Lo Que Se Verifico

### 1. La suite actual pasa

Comando ejecutado:

```bash
npm test -- --runInBand
```

Resultado en ese momento:

- `Test Suites: 3 passed, 3 total`
- `Tests: 28 passed, 28 total`

Conclusión:

- los tests actuales no blindan el requisito real de `>= 6` semanas para todos los empleados

### 2. El bug existe de verdad en la salida generada

Se ejecuto una comprobacion directa contra `generateSchedule(2026, DEFAULT_VACATION_PLAN_2026)` sobre `src/app.jsx` y `app.js`.

Conteos observados en ese estado:

- `Kike: 4`
- `Jose: 1`
- `Enrique: 5`
- `David: 3`
- `Luis: 6`
- `Ariel: 6`

Conclusión:

- el minimo de 6 semanas no se cumple para 4 empleados
- el problema afecta tanto a `src/app.jsx` como a `app.js`

### 3. El agujero de tests esta localizado

En `__tests__/coverageLogic.test.js` solo se estaba verificando:

- `Luis >= 6`
- `Ariel >= 6`

No habia test que exigiera `>= 6` para toda la plantilla.

### 4. `calendario_2026.html` no es fuente fiable

Ese archivo contiene una logica independiente y mas antigua, con compensaciones por dias sueltos `O30`. No debe usarse como referencia de verdad para arreglar `src/app.jsx`.

## Intentos Hechos Durante La Sesion

Todos estos intentos fueron revertidos antes de terminar la sesion para no dejar el repo en estado inconsistente.

### Intento 1. Convertir el minimo de 6 en restriccion dura dentro de `repairConflictingWeekCoverage()`

Idea:

- descartar cualquier combinacion de reparacion semanal que dejase a alguien por debajo de 6

Resultado:

- recuperaba la equidad
- pero dejaba sin reparar varios huecos reales de cobertura `O42` presencial y viernes `O40`

Sintoma observado:

- fallaban los tests de cobertura

### Intento 2. Mantener `repairConflictingWeekCoverage()` y ejecutar otra `ensureMinSixWeeksAllFinal()` al final

Idea:

- dejar que cobertura se arregle y despues recuperar las semanas minimas otra vez

Resultado:

- el recuperador final devolvia `O30` en semanas que volvian a dejar dias sin `O42` presencial
- se entraba en una oscilacion entre cobertura y equidad

### Intento 3. Proteger solo semanas `O30` de empleados justo en el minimo

Idea:

- permitir el reparador de cobertura, pero impedir tocar semanas intensivas de empleados ya justos en `6`

Resultado:

- no era suficiente
- seguian apareciendo huecos de cobertura o se quedaban empleados por debajo del minimo

### Intento 4. Endurecer `ensureMinSixWeeksAllFinal()` para validar cobertura de oficina, no solo integridad semanal

Idea:

- impedir que el recuperador final reintrodujera semanas `O30` que rompieran `O42` presencial o `O40` presencial en viernes

Resultado:

- se arreglaba parte de la cobertura
- pero ya no encontraba suficientes huecos para devolver a todos a `6`

### Intento 5. Portar parte del postprocesado experimental visto en `test_run.cjs`

Idea:

- usar una fase final mas parecida a la de `test_run.cjs`, con restauracion de semanas intensivas protegidas

Resultado:

- tampoco cerro las dos restricciones simultaneamente
- seguia apareciendo al menos uno de estos problemas:
  - viernes sin `O40` presencial
  - ausencia de `O42` presencial en dias concretos
  - empleados por debajo de `6`

## Conclusiones Tecnicas

### 1. El bug es estructural, no un ajuste pequeno

No parece que baste con:

- cambiar una comparacion
- mover una sola llamada
- tocar una penalizacion del score

El postprocesado final esta resolviendo un problema de optimizacion multi-restriccion con heuristicas locales que compiten entre si.

### 2. Las restricciones duras reales son estas

Hay que tratarlas como invariantes simultaneos:

- `>= 6` semanas intensivas completas por empleado
- maximo `3` personas en `O30` por dia
- `O30` solo en semana operativa completa
- al menos un `O42` presencial de lunes a jueves
- al menos un `O40` presencial los viernes
- no mezclar `O40` y `O42` en la misma semana por empleado

### 3. La fase final actual no garantiza simultaneamente esas restricciones

La secuencia actual de postprocesado:

- primero arregla unas restricciones
- luego rompe otras
- luego intenta compensar

Pero no trabaja con un modelo unico que evalúe todo a la vez.

## Lo Que Yo Haria En La Siguiente Sesion

### Enfoque recomendado

Refactorizar el postprocesado final de `generateSchedule()` en lugar de seguir parcheando heuristicas sueltas.

### Plan concreto

1. Introducir un test nuevo que falle de verdad

Anadir en `__tests__/coverageLogic.test.js` un test que exija:

- `>= 6` semanas intensivas para toda la plantilla

Ese test debe quedarse y no revertirse.

2. Crear una fase final unica de normalizacion semanal

La idea seria trabajar por semana y por empleado con un modelo explicito:

- modo semanal por empleado: `O30`, `O40`, `O42` o `V`
- no permitir asignaciones parciales de `O30`
- evaluar la semana completa, no dias aislados

3. Tratar cobertura y equidad como restricciones duras

La fase final debe aceptar un cambio solo si mantiene:

- `O42` presencial L-J
- `O40` presencial V
- `<= 3` O30 diarios
- `>= 6` semanas por empleado

4. Dejar las heuristicas actuales solo como generacion inicial

Es decir:

- usar la logica existente para construir un schedule base razonable
- aplicar luego un reconciliador final determinista y mas pequeno

5. Regenerar `app.js`

Cuando `src/app.jsx` quede bien:

```bash
npm run build:js
```

o si se prefiere:

```bash
npm run build
```

6. Validacion final

Ejecutar:

```bash
npm test -- --runInBand
```

Y, ademas, una comprobacion directa de conteos por empleado sobre la salida final.

## Sitios Donde Empezaria A Tocar

### Opcion A. Refactor minima pero seria

En `src/app.jsx`, dentro de `generateSchedule()`:

- mantener generacion inicial
- reemplazar el cierre actual por una sola fase final de reconciliacion

### Opcion B. Reutilizar ideas de `test_run.cjs`

`test_run.cjs` contiene ideas utiles:

- calculo final de semanas intensivas
- restauracion de semanas protegidas
- criterio de presencia alternativa en oficina

Pero no se debe copiar sin filtrar. Hay que portarlo con cuidado y reducirlo a lo necesario.

## Mensaje De Reanudacion Recomendado

Si en otra sesion necesitas retomar rapido, pega algo como esto:

```text
Lee HANDOFF_INTENSIVAS_REGRESION.md y continua desde ahi. El objetivo es arreglar generateSchedule para que cumpla simultaneamente:
- minimo 6 semanas intensivas por empleado
- O42 presencial L-J
- O40 presencial los viernes
- sin romper la integridad semanal

No quiero mas parches heurísticos pequenos; quiero una refactorizacion del postprocesado final con test nuevo para toda la plantilla.
```

## Estado En El Que Se Dejo El Repo

- No se dejaron cambios experimentales aplicados
- La suite actual vuelve a pasar
- El bug funcional sigue pendiente
- Este documento es el resumen fiel de la investigacion hecha

