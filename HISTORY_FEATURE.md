# Mallorca Garden AI - Sistema de Historial de Diseños

Sistema completo de historial de diseños de jardín con almacenamiento en Supabase.

## ✨ Características Implementadas

### 1. Nombrar Diseños
- Campo obligatorio "Nombre del Diseño" en el formulario
- Validación antes de generar propuestas
- Nombre visible en resultados con badge "Nuevo"

### 2. Guardado Automático
- Cada diseño generado se guarda automáticamente en Supabase
- Se almacenan: datos del formulario, propuestas generadas, datos de comparación
- Soporte para imágenes del terreno en Supabase Storage

### 3. Historial de Diseños
- Botón "📚 Historial" en el header principal
- Vista de tarjetas responsive con información del diseño:
  - Nombre del diseño
  - Fecha y hora de creación
  - Estilo seleccionado
  - Presupuesto
  - Tipo de suelo
- Ordenamiento automático (más reciente primero)
- Estado vacío cuando no hay diseños guardados

### 4. Cargar Diseños Guardados
- Click en "Ver Diseño" para cargar propuestas guardadas
- Muestra ambas propuestas (Sostenible y Estética)
- Badge "Guardado" para distinguir de diseños nuevos
- Funcionalidad de comparación completamente operativa

### 5. Eliminación de Diseños
- Botón de eliminar en cada tarjeta de historial
- Confirmación antes de eliminar
- Eliminación en cascada (diseño + imágenes en Storage)
- Actualización automática del historial

## 📁 Archivos Creados/Modificados

### Nuevos Archivos
- `supabase-config.js` - Configuración template de Supabase
- `supabase-service.js` - Servicio completo para operaciones DB y Storage
- `history-functions.js` - Funciones del sistema de historial
- `SUPABASE_SETUP.md` - Guía de configuración paso a paso
- `test-supabase.html` - Página de pruebas de Supabase

### Modificados
- `index.html` - Agregado campo nombre, botón historial, sección historial
- `styles.css` - Estilos para historial, badges, notificaciones
- `app.js` - Integración completa: guardar, cargar, navegación
- `.gitignore` - Protección de credenciales de Supabase

## 🚀 Configuración

### 1. Configurar Supabase
Sigue las instrucciones en `SUPABASE_SETUP.md`:
1. Crear cuenta en Supabase
2. Crear proyecto
3. Obtener credenciales (URL + API Key)
4. Crear tabla `garden_designs`
5. Crear bucket `garden-photos`
6. Configurar políticas de acceso
7. Crear `supabase-config.local.js` con credenciales

### 2. Probar Configuración
Abre `test-supabase.html` en el navegador y ejecuta las pruebas:
- ✅ Test de conexión
- ✅ Guardar diseño de prueba
- ✅ Listar diseños
- ✅ Eliminar diseño

### 3. Usar la Aplicación
1. Completa el formulario de diseño
2. **Ingresa un nombre para el diseño**
3. Genera propuestas
4. El diseño se guardará automáticamente
5. Click en "📚 Historial" para ver diseños guardados
6. Click en "Ver Diseño" para cargar diseños anteriores
7. Click en "🗑️" para eliminar diseños

## 🎨 Funcionalidades de UI

### Notificaciones
- Notificación de éxito al guardar diseño
- Notificación de éxito al eliminar diseño
- Notificaciones de error cuando hay problemas

### Badges y Estados
- Badge "Nuevo" (morado, animado) para diseños recién creados
- Badge "Guardado" (verde) para diseños cargados desde historial

### Responsive Design
- Historial adaptado para móviles (columna única)
- Tarjetas de diseño optimizadas para pantallas pequeñas

## 🔒 Seguridad

- Archivo `supabase-config.local.js` en `.gitignore`
- No se suben credenciales al repositorio
- Políticas RLS configuradas en Supabase
- Modo público para prototipo (puede restringirse para producción)

## 📊 Esquema de Base de Datos

```sql
CREATE TABLE garden_designs (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  soil_type TEXT,
  style TEXT,
  budget NUMERIC,
  garden_length NUMERIC,
  garden_width NUMERIC,
  garden_area NUMERIC,
  proposal_sustainable JSONB,
  proposal_aesthetic JSONB,
  comparison_data JSONB
);
```

Storage: `garden-photos/{design-id}/original-{n}.jpg`

## 💡 Detalles Técnicos

### Supabase SDK
Se usa el SDK oficial de Supabase vía CDN (ESM):
```javascript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
```

### Funciones Principales

**supabase-service.js:**
- `saveDesign()` - Guarda diseño + imágenes
- `getAllDesigns()` - Obtiene lista de diseños
- `getDesignById()` - Carga diseño específico
- `deleteDesign()` - Elimina diseño + imágenes
- `isSupabaseConfigured()` - Verifica configuración

**history-functions.js:**
- `showHistory()` - Muestra historial
- `loadDesign()` - Carga diseño guardado
- `confirmDeleteDesign()` - Confirma eliminación
- `showNotification()` - Muestra notificaciones

**app.js:**
- Integración con formulario
- Guardado automático post-generación
- Event listeners para historial

## 🐛 Troubleshooting

### "Supabase no está configurado"
→ Crea `supabase-config.local.js` con tus credenciales

### "relation 'garden_designs' does not exist"
→ Ejecuta el script SQL en Supabase SQL Editor

### "new row violates row-level security policy"
→ Configura las políticas RLS del `SUPABASE_SETUP.md`

### Imágenes no se suben
→ Verifica que el bucket sea público y tenga las 3 políticas

## 📝 Próximas Mejoras (Opcional)

- [ ] Búsqueda/filtrado de diseños por nombre
- [ ] Exportar diseño a PDF
- [ ] Compartir diseño por URL
- [ ] Edición de diseños guardados
- [ ] Etiquetas/categorías para diseños
- [ ] Autenticación de usuarios

## 📄 Licencia

Este proyecto es parte de Mallorca Garden AI.
