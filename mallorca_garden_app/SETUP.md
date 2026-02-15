# 🚀 Guía de Configuración - Mallorca Garden AI

## Requisitos

- Navegador web moderno con soporte para ES6 modules
- Servidor HTTP local (recomendado para evitar problemas con CORS)
- API key de Google Gemini (opcional, para usar IA)

## Instalación y Configuración

### 1. Ejecutar con Servidor Local

Los módulos ES6 funcionan mejor con un servidor HTTP. Elige uno:

**Opción A: Python (si lo tienes instalado)**
```bash
cd "c:\Users\leona\OneDrive\Escritorio\Habilidades_agente\mallorca_garden_app"
python -m http.server 8000
```

Luego abre: `http://localhost:8000`

**Opción B: Node.js con http-server**
```bash
npm install -g http-server
cd "c:\Users\leona\OneDrive\Escritorio\Habilidades_agente\mallorca_garden_app"
http-server -p 8000
```

**Opción C: VS Code Live Server**
- Instala la extensión "Live Server"
- Click derecho en `index.html` → "Open with Live Server"

### 2. Configurar API de Gemini (Opcional)

Si quieres usar IA para generar propuestas:

1. **Obtén una API key**:
   - Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Inicia sesión con tu cuenta de Google
   - Crea una nueva API key

2. **Crea el archivo de configuración local**:
   
   Crea un archivo llamado `config.local.js` en la raíz del proyecto:
   
   ```javascript
   export const config = {
       GEMINI_API_KEY: 'TU_API_KEY_AQUI',
       GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
       USE_AI: true
   };
   ```

3. **¡Listo!** La aplicación detectará automáticamente tu API key.

> **Nota de seguridad**: `config.local.js` está en `.gitignore` para proteger tu API key. Nunca compartas este archivo públicamente.

## Uso de la Aplicación

### Modo Local (Sin IA)

1. Selecciona tipo de suelo
2. Elige estilo de jardín
3. Introduce presupuesto (mínimo 200€)
4. Opcionalmente, agrega medidas del jardín
5. Click en "✨ Generar Propuestas"

La aplicación usa un algoritmo local para seleccionar plantas compatibles.

### Modo IA (Con Gemini)

1. **Sube fotos** de tu terreno (1-5 imágenes)
2. **Completa los datos** del jardín:
   - Tipo de suelo
   - Medidas (largo × ancho) - opcional
   - Estilo deseado
   - Presupuesto
3. Click en "✨ Generar Propuestas"

Gemini analizará las imágenes y generará propuestas personalizadas basadas en tu terreno específico.

## Funcionalidades

### ✨ Nuevas características

- **Presupuesto mínimo reducido**: Ahora desde 200€ (antes 500€)
- **Medidas del jardín**: Especifica largo × ancho para cálculo automático de área
- **Integración con IA**: Análisis de imágenes con Gemini API
- **Fallback inteligente**: Si falla la IA, se genera propuesta local automáticamente
- **Mensajes dinámicos**: Loading adaptado según el modo (IA vs Local)

### Características existentes

- **Tooltips informativos**: Hover sobre el icono "i" para ver detalles de cada planta
- **Modo comparación**: Compara lado a lado ambas propuestas
- **Propuestas duales**:
  - **Sostenible**: Bajo consumo de agua y mantenimiento mínimo
  - **Estética**: Enfocada en el estilo seleccionado

## Estructura del Proyecto

```
mallorca_garden_app/
├── index.html          # Página principal
├── styles.css          # Estilos
├── app.js             # Lógica principal
├── gemini-service.js  # Servicio de IA
├── config.js          # Configuración por defecto (vacía)
├── config.local.js    # TU configuración (crear manualmente)
├── .env.example       # Documentación de configuración
├── .gitignore         # Protección de API keys
└── data/
    └── plants.js      # Base de datos de plantas
```

## Resolución de Problemas

### La aplicación no carga

- **Problema**: Error de CORS o módulos no cargan
- **Solución**: Usa un servidor HTTP local (ver paso 1)

### Gemini no funciona

- **Problema**: "API key no configurada"
- **Solución**: Verifica que `config.local.js` existe y tiene tu API key

### Error "fetch failed"

- **Problema**: La llamada a Gemini falla
- **Soluciones**:
  1. Verifica tu API key es válida
  2. Revisa la consola del navegador para errores específicos
  3. Acepta usar el modo local cuando se te pregunte

### Las propuestas están vacías

- **Modo local**: Es normal si la combinación suelo+estilo no tiene plantas coincidentes
- **Modo IA**: Revisa la consola para ver la respuesta de Gemini

## Soporte

- Revisa la consola del navegador (F12) para logs detallados
- Todos los errores se registran con emojis para fácil identificación:
  - 🤖 = Gemini AI en uso
  - ℹ️ = Información/modo local
  - ❌ = Error
  - ✅ = Éxito

## Próximos Pasos

1. Personaliza `data/plants.js` con más especies
2. Ajusta el prompt en `gemini-service.js` según tus necesidades
3. Despliega en un hosting web para compartir con otros
