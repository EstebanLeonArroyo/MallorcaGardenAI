# 🔧 Guía de Diagnóstico - Problema de Carga de Imágenes

## Cambios Realizados

### 1. CSS Fix
- **Archivo**: `styles.css`
- **Cambio**: Agregado `z-index: 10` al input de archivo
- **Razón**: Asegura que el input esté encima de otros elementos y sea clickable

### 2. Debug Logging
- **Archivo**: `app.js`  
- **Agregado**: Logs extensivos en consola para diagnosticar el problema

## Cómo Diagnosticar el Problema

### Paso 1: Abrir la Consola del Navegador
1. Abre tu aplicación en el navegador
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **"Console"**

### Paso 2: Verificar Logs al Cargar la Página
Deberías ver:
```
✅ Elemento terrain-photos encontrado: [input element]
```

Si ves esto, significa que el elemento se encontró correctamente.

❌ **Si ves**: `ERROR: elemento terrain-photos no encontrado`
- El problema es que el script se carga antes del HTML
- **Solución**: Asegúrate de que el archivo se sirve con un servidor HTTP local

### Paso 3: Intentar Subir una Imagen
1. Click en el área "📸 Arrastra o selecciona fotos"
2. Selecciona una o más imágenes

**Logs esperados:**
```
📸 Change event disparado!
Número de archivos seleccionados: 1
Archivos procesados: 1
Procesando archivo 1: imagen.jpg image/jpeg
✅ Imagen 1 cargada. Total: 1
```

### Paso 4: Verificar la Galería de Previsualizaciones
- Deberías ver las imágenes aparecer debajo del área de carga
- Cada imagen debe tener un botón "×" para eliminarla

## Problemas Comunes y Soluciones

### Problema 1: No se ve "Change event disparado!" en consola

**Causa**: El input no está recibiendo clicks
**Soluciones**:
1. Verifica que estés usando un servidor HTTP local (no `file://`)
2. Prueba con `test-upload.html` para verificar funcionalidad básica
3. Intenta hacer click directamente en el borde del área de carga

### Problema 2: Se ve "Change event" pero no "Imagen cargada"

**Causa**: El archivo no es una imagen válida o hay error en FileReader
**Soluciones**:
1. Verifica el tipo de archivo (debe empezar con `image/`)
2. Revisa si hay errores adicionales en la consola
3. Prueba con diferentes archivos de imagen (JPG, PNG)

###Problema 3: CORS o Module Loading Errors

**Error típico**: `Failed to load module script: Expected a JavaScript module script...`

**Causa**: Los módulos ES6 requieren servidor HTTP
**Solución**: Ejecutar con servidor local

```bash
# Opción 1: Python
python -m http.server 8000

# Opción 2: Node.js
npx http-server -p 8000
```

Luego abre: `http://localhost:8000`

### Problema 4: Las imágenes no se muestran en la previsualización

**Causa**: Problema con renderImagePreviews()
**Solución**: Revisa la consola para errores adicionales

## Archivo de Test

Se creó `test-upload.html` con 3 tests diferentes:
1. **Test 1**: Input simple sin wrapper
2. **Test 2**: Input con wrapper (mismo patrón que la app)
3. **Test 3**: Mismo ID que usa la app (`terrain-photos`)

Abre `test-upload.html` en tu navegador para verificar que el upload funciona en general.

## Verificación Paso a Paso

### ✅ Checklist
- [ ] Servidor HTTP local está corriendo
- [ ] Abro la aplicación con `http://localhost:8000` (NO con `file://`)
- [ ] La consola muestra "✅ Elemento terrain-photos encontrado"
- [ ] Al hacer click sale el diálogo de selección de archivos
- [ ] Al seleccionar imagen veo "📸 Change event disparado!"
- [ ] Veo "✅ Imagen cargada. Total: 1"
- [ ] La imagen aparece en la galería de previsualizaciones

## Contacto de Soporte

Si después de seguir estos pasos el problema persiste:

1. **Captura de pantalla** de la consola del navegador
2. **Navegador y versión** que estás usando
3. **Sistema operativo**
4. **Todos los logs** que aparezcan en consola

Esta información ayudará a diagnosticar el problema específico.
