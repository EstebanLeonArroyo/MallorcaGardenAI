# Limpieza del Proyecto - Archivos a Eliminar/Mantener

## ❌ Archivos que PUEDES ELIMINAR (Testing/Desarrollo)

### Archivos de Testing
Estos son útiles solo durante desarrollo. Puedes eliminarlos si todo funciona bien:

```
test-supabase.html      # Tests de Supabase - útil solo para debugging
test-upload.html        # Test de subida de imágenes (si existe)
debug.html              # Archivo de debugging (si existe)
list-models.html        # Listar modelos de Gemini - solo para consulta
```

**Recomendación**: Guárdalos en una carpeta `_tests/` o `_dev/` en lugar de eliminarlos completamente, por si necesitas debugging en el futuro.

### Archivos de Documentación Opcionales
Puedes eliminar si ya no necesitas referencia:

```
CONFIGURAR_AHORA.md     # Guía rápida - ya configuraste Supabase
implementation_plan.md  # Plan de implementación - ya completado
```

**Recomendación**: Mantener al menos `SUPABASE_SETUP.md` por si necesitas reconfigurar en el futuro.

## ✅ Archivos que DEBES MANTENER

### Aplicación Principal
```
index.html              # ⚠️ CRÍTICO - Aplicación principal
app.js                  # ⚠️ CRÍTICO - Lógica principal
styles.css              # ⚠️ CRÍTICO - Estilos
```

### Servicios y Funcionalidades
```
gemini-service.js       # ⚠️ CRÍTICO - Servicio de AI
supabase-service.js     # ⚠️ CRÍTICO - Base de datos
history-functions.js    # ⚠️ CRÍTICO - Sistema de historial
data/plants.js          # ⚠️ CRÍTICO - Base de datos de plantas
```

### Configuración
```
config.js               # Template de configuración Gemini
config.local.js         # ⚠️ CRÍTICO - Tu API key de Gemini
supabase-config.js      # Template de configuración Supabase
supabase-config.local.js # ⚠️ CRÍTICO - Tus credenciales de Supabase
.gitignore              # ⚠️ IMPORTANTE - Protege tus credenciales
```

### Documentación Recomendada
```
README.md               # Introducción del proyecto
SETUP.md                # Guía de instalación
SUPABASE_SETUP.md       # Guía de Supabase (útil para el futuro)
HISTORY_FEATURE.md      # Documentación de funcionalidad historial
walkthrough.md          # Documentación completa de lo implementado
```

## 📁 Estructura Recomendada Final

```
mallorca_garden_app/
├── index.html
├── app.js
├── styles.css
├── gemini-service.js
├── supabase-service.js
├── history-functions.js
├── config.js
├── config.local.js          (en .gitignore)
├── supabase-config.js
├── supabase-config.local.js (en .gitignore)
├── .gitignore
├── data/
│   └── plants.js
├── docs/                    (opcional: mover aquí toda la documentación)
│   ├── README.md
│   ├── SETUP.md
│   ├── SUPABASE_SETUP.md
│   └── HISTORY_FEATURE.md
└── _dev/                    (opcional: mover aquí archivos de testing)
    ├── test-supabase.html
    ├── list-models.html
    └── debug.html
```

## 🎯 Comando para Limpiar (Opcional)

Si decides eliminar los archivos de testing, puedes hacerlo con:

```powershell
# Crear carpeta de desarrollo (opcional)
New-Item -ItemType Directory -Path "_dev" -ErrorAction SilentlyContinue

# Mover archivos de testing a carpeta _dev
Move-Item "test-supabase.html" "_dev/" -ErrorAction SilentlyContinue
Move-Item "list-models.html" "_dev/" -ErrorAction SilentlyContinue
Move-Item "debug.html" "_dev/" -ErrorAction SilentlyContinue
Move-Item "test-upload.html" "_dev/" -ErrorAction SilentlyContinue

# O eliminarlos directamente
# Remove-Item "test-supabase.html", "list-models.html", "debug.html" -ErrorAction SilentlyContinue
```

## ⚠️ NO ELIMINES NUNCA

```
config.local.js              # Contiene tu API key de Gemini
supabase-config.local.js     # Contiene tus credenciales de Supabase
.gitignore                   # Protege que no subas credenciales a Git
data/plants.js               # Base de datos de plantas
```

## 💡 Recomendación Final

**Para producción limpia:**
1. Crea carpeta `_dev/` y mueve archivos de testing ahí
2. Mantén `SUPABASE_SETUP.md` para futuras referencias
3. Elimina `CONFIGURAR_AHORA.md` y `implementation_plan.md` si ya no los necesitas
4. Mantén el resto tal como está

**Espacio ahorrado**: ~50-100 KB (los archivos HTML de testing son pequeños)
