# Bolsillo

Gestor personal de finanzas con estética clara, modo oscuro y todos los datos guardados en el navegador.

## Puesta en marcha

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (por defecto `http://localhost:5173`).

Otros comandos:

```bash
npm run typecheck   # comprobación de tipos
npm run build       # compilación de producción en dist/
npm run preview     # servir la compilación
```

## Funcionalidades

- **Inicio**: balance total, ingresos y gastos del mes, ahorro, flujo de caja de 6 meses, gastos por categoría, movimientos recientes, billeteras y próximos fijos.
- **Movimientos**: alta, edición y borrado de gastos e ingresos con categoría, subcategoría, billetera, fecha y nota. Búsqueda y filtros por tipo, categoría, billetera y periodo.
- **Fijos programados**: ingresos y gastos recurrentes (semanal, mensual, trimestral, semestral o anual). Los automáticos se registran al abrir la app; los manuales quedan pendientes y se pueden registrar desde el aviso.
- **Billeteras**: varias cuentas (efectivo, banco, ahorros…) con saldo inicial, saldo actual e ingresos/gastos del mes.
- **Categorías**: categorías y subcategorías con icono y color propios; se pueden crear, editar y reordenar.
- **Estadísticas**: análisis por categoría y subcategoría para gastos e ingresos, filtros por mes/año/todo y por billetera, evolución de 6 meses y subcategorías destacadas.
- **Ajustes**: tema claro/oscuro/sistema, moneda, exportación e importación JSON, datos de ejemplo y restablecimiento.

## Datos

Todo se guarda en `localStorage` bajo la clave `bolsillo.v1`; no hay servidor ni cuentas. Usa **Ajustes → Exportar copia de seguridad** para guardar un JSON y **Importar copia** para restaurarlo en otro navegador.

## Tecnología

React 19, TypeScript, Vite, Tailwind CSS 4, Zustand (persistencia), Recharts y Lucide.
