# DocuQuery — Especificación del Tutorial de Onboarding

Este documento define el contenido, estructura y pasos del tutorial interactivo que se mostrará
la primera vez que un usuario accede a la aplicación. Está pensado para ser implementado como
un componente React de tipo "spotlight tour" (overlay con resaltado del elemento + tooltip).

---

## 1. Concepto general de la aplicación

**¿Qué es DocuQuery?**
DocuQuery es un asistente de preguntas y respuestas sobre documentos PDF. Funciona con un
pipeline RAG (Retrieval-Augmented Generation):

1. Subes un PDF → el sistema extrae el texto y lo divide en fragmentos (_chunks_).
2. Cada fragmento se convierte en un vector numérico (_embedding_) que captura su significado.
3. Cuando haces una pregunta, el sistema busca los fragmentos más relevantes por similitud
   semántica y se los pasa a Claude (el LLM) como contexto.
4. Claude genera una respuesta basada **únicamente** en esos fragmentos y cita las fuentes.

**Lo que el usuario puede hacer:**
- Subir sus propios PDFs y hacerles preguntas en lenguaje natural.
- Ver exactamente qué fragmento del documento usó la IA para responder.
- Revisar el historial de todas sus conversaciones anteriores.
- Gestionar (ver y borrar) los documentos indexados.

---

## 2. Estructura de la interfaz

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR (fijo, izquierda, 280 px)                              │
│  ┌──────────────────┐                                           │
│  │  DocuQuery       │  ← Título / marca                        │
│  │  Enterprise RAG  │                                           │
│  ├──────────────────┤                                           │
│  │  [ Upload PDF ]  │  ← Botón principal de carga              │
│  ├──────────────────┤                                           │
│  │  New Chat        │  ← Ruta: /                               │
│  │  Recent Docs     │  ← Ruta: /documents                      │
│  │  History         │  ← Ruta: /history                        │
│  │  Settings        │  ← Ruta: /settings                       │
│  ├──────────────────┤                                           │
│  │  System Status   │                                           │
│  │  Help            │                                           │
│  │  Admin User      │                                           │
│  └──────────────────┘                                           │
│                                                                 │
│  ÁREA PRINCIPAL (resto de la pantalla, margen-izq: 280 px)     │
│  ┌─────────────────────────────┐  ┌──────────────────────────┐ │
│  │  CHAT (flex-1)              │  │  VISTA PREVIA (340 px)   │ │
│  │  - Lista de mensajes        │  │  Solo visible ≥ xl       │ │
│  │  - Input de pregunta        │  │  Muestra el fragmento    │ │
│  └─────────────────────────────┘  │  del PDF fuente          │ │
│                                    └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Pasos del tutorial (Tour interactivo)

Cada paso contiene:
- **target**: selector CSS / ID del elemento a resaltar
- **título**: texto corto del tooltip
- **descripción**: explicación visible al usuario
- **posición**: dónde aparece el tooltip relativo al elemento (`right`, `bottom`, `left`, `top`)
- **acción requerida**: si el usuario debe hacer algo antes de continuar (o solo click "Siguiente")

---

### Paso 1 — Bienvenida (modal centrado, sin spotlight)

**target:** `none` (modal flotante centrado)

**título:** Bienvenido a DocuQuery

**descripción:**
> DocuQuery te permite hacer preguntas en lenguaje natural sobre tus documentos PDF.
> La IA analiza el contenido y responde citando exactamente los fragmentos que usó.
>
> Este tutorial te llevará por las funciones principales en menos de 2 minutos.

**Botones:** `Omitir tutorial` | `Comenzar →`

---

### Paso 2 — Botón "Upload PDF" en el sidebar

**target:** `button[data-tutorial="upload-btn"]`
_(añadir este atributo al botón en `Sidebar.tsx`)_

**título:** Sube tu primer documento

**descripción:**
> Haz clic aquí para subir un PDF. El sistema lo procesa automáticamente:
> extrae el texto, lo divide en fragmentos y genera los vectores de búsqueda.
> Solo se aceptan archivos PDF de hasta 50 MB.

**posición:** `right`

**acción requerida:** ninguna — solo "Siguiente"

---

### Paso 3 — Área de chat (estado vacío)

**target:** `div[data-tutorial="chat-empty-state"]`
_(añadir este atributo al div del estado vacío en `ChatPage.tsx`)_

**título:** Aquí aparecerán tus conversaciones

**descripción:**
> Una vez que hayas subido un documento, escribe tu pregunta en el campo de abajo
> y presiona **Enter** (o el botón de enviar).
> La IA responderá basándose exclusivamente en el contenido del PDF.

**posición:** `bottom`

**acción requerida:** ninguna — solo "Siguiente"

---

### Paso 4 — Input de pregunta

**target:** `textarea[data-tutorial="chat-input"]`
_(añadir este atributo al textarea en `ChatPage.tsx`)_

**título:** Escribe tu pregunta aquí

**descripción:**
> Puedes hacer preguntas como:
> - *"¿Cuáles son las conclusiones principales?"*
> - *"¿Qué dice el documento sobre X?"*
> - *"Resume la sección 3"*
>
> Presiona **Enter** para enviar o **Shift + Enter** para nueva línea.

**posición:** `top`

**acción requerida:** ninguna — solo "Siguiente"

---

### Paso 5 — Panel de fuentes (Vista Previa)

**target:** `aside[data-tutorial="preview-panel"]`
_(añadir este atributo al aside en `ChatPage.tsx`, solo visible en pantallas ≥ xl)_

**título:** Ve exactamente de dónde viene cada respuesta

**descripción:**
> Después de recibir una respuesta, aparecerán botones de **fuentes** debajo del mensaje.
> Al hacer clic en una fuente, este panel mostrará el fragmento exacto del PDF
> que la IA usó para generar esa respuesta, junto con su porcentaje de similitud.

**posición:** `left`

**nota de implementación:** Si la pantalla es menor a `xl`, omitir este paso o mostrar
el tooltip en el área de chat con una descripción adaptada.

---

### Paso 6 — Navegación: "Recent Documents"

**target:** `a[href="/documents"][data-tutorial="nav-documents"]`
_(añadir este atributo al NavLink en `Sidebar.tsx`)_

**título:** Gestiona tus documentos

**descripción:**
> En esta sección puedes ver todos los PDFs indexados, su estado de procesamiento
> y cuántos fragmentos generó cada uno. También puedes eliminar documentos
> que ya no necesites.

**posición:** `right`

**acción requerida:** ninguna — solo "Siguiente"

---

### Paso 7 — Navegación: "History"

**target:** `a[href="/history"][data-tutorial="nav-history"]`
_(añadir este atributo al NavLink en `Sidebar.tsx`)_

**título:** Revisa conversaciones anteriores

**descripción:**
> El historial guarda todas tus conversaciones pasadas.
> Puedes buscar por texto y abrir cualquier conversación para
> releer las preguntas y respuestas completas.

**posición:** `right`

**acción requerida:** ninguna — solo "Siguiente"

---

### Paso 8 — Cierre (modal centrado, sin spotlight)

**target:** `none` (modal flotante centrado)

**título:** ¡Ya estás listo!

**descripción:**
> Eso es todo. Para empezar:
>
> 1. Haz clic en **Upload PDF** en el menú lateral
> 2. Selecciona tu documento
> 3. Escribe una pregunta en el chat
>
> ¿Quieres explorar un documento de ejemplo ya cargado?
> Simplemente escribe una pregunta en el chat y prueba la aplicación ahora mismo.

**Botones:** `Volver a ver el tutorial` | `Empezar a usar DocuQuery ✓`

---

## 4. Comportamiento y persistencia

| Aspecto | Decisión recomendada |
|---|---|
| **Cuándo mostrar** | Solo la primera vez que el usuario abre la app (o hasta que lo complete) |
| **Persistencia** | `localStorage` con clave `docuquery_tutorial_completed = true` |
| **Navegación del tour** | Botones "Anterior" / "Siguiente" + indicador de paso (ej. `2 / 8`) |
| **Saltar** | Botón "Omitir tutorial" visible en todos los pasos |
| **Al saltar** | Guardar también en localStorage como completado |
| **Re-activar** | Agregar opción "Ver tutorial de nuevo" en la página Settings |
| **Overlay** | Fondo semitransparente oscuro (`rgba(0,0,0,0.5)`) con recorte (_cutout_) sobre el elemento resaltado |
| **Tooltip** | Tarjeta blanca con bordes redondeados, flecha apuntando al elemento |
| **Animación** | Transición suave entre pasos (`fade` o `slide`) |

---

## 5. Atributos `data-tutorial` a añadir en el código

Lista completa de los atributos que hay que agregar a los elementos existentes:

| Archivo | Elemento | Atributo a añadir |
|---|---|---|
| `Sidebar.tsx` | Botón Upload PDF | `data-tutorial="upload-btn"` |
| `Sidebar.tsx` | NavLink `/documents` | `data-tutorial="nav-documents"` |
| `Sidebar.tsx` | NavLink `/history` | `data-tutorial="nav-history"` |
| `ChatPage.tsx` | Div del empty state | `data-tutorial="chat-empty-state"` |
| `ChatPage.tsx` | Textarea del input | `data-tutorial="chat-input"` |
| `ChatPage.tsx` | Aside (Vista Previa) | `data-tutorial="preview-panel"` |

---

## 6. Librerías recomendadas para implementar el tour

Opciones ordenadas por simplicidad de integración con React + Vite:

1. **[Intro.js](https://introjs.com/)** + `introjs-react` — la más conocida, sin dependencias pesadas
2. **[react-joyride](https://react-joyride.com/)** — nativa React, muy configurable, bien mantenida ✅ _Recomendada_
3. **[driver.js](https://driverjs.com/)** — sin dependencias, funciona con cualquier framework
4. **Implementación custom** — un componente propio con `getBoundingClientRect()` si se quiere control total del diseño

### Ejemplo de integración con `react-joyride`

```tsx
// src/components/Tutorial.tsx
import Joyride, { CallBackProps, STATUS } from 'react-joyride'

const steps = [
  {
    target: 'body',
    placement: 'center',
    title: 'Bienvenido a DocuQuery',
    content: 'DocuQuery te permite hacer preguntas en lenguaje natural sobre tus documentos PDF...',
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="upload-btn"]',
    placement: 'right',
    title: 'Sube tu primer documento',
    content: 'Haz clic aquí para subir un PDF. El sistema lo procesa automáticamente...',
  },
  {
    target: '[data-tutorial="chat-empty-state"]',
    placement: 'bottom',
    title: 'Aquí aparecerán tus conversaciones',
    content: 'Una vez que hayas subido un documento, escribe tu pregunta en el campo de abajo...',
  },
  {
    target: '[data-tutorial="chat-input"]',
    placement: 'top',
    title: 'Escribe tu pregunta aquí',
    content: 'Puedes preguntar: "¿Cuáles son las conclusiones?" Presiona Enter para enviar.',
  },
  {
    target: '[data-tutorial="preview-panel"]',
    placement: 'left',
    title: 'Ve de dónde viene cada respuesta',
    content: 'Al hacer clic en una fuente, este panel muestra el fragmento exacto del PDF usado.',
  },
  {
    target: '[data-tutorial="nav-documents"]',
    placement: 'right',
    title: 'Gestiona tus documentos',
    content: 'Aquí puedes ver todos los PDFs indexados y eliminar los que ya no necesites.',
  },
  {
    target: '[data-tutorial="nav-history"]',
    placement: 'right',
    title: 'Revisa conversaciones anteriores',
    content: 'El historial guarda todas tus conversaciones pasadas con sus respuestas.',
  },
  {
    target: 'body',
    placement: 'center',
    title: '¡Ya estás listo!',
    content: 'Haz clic en Upload PDF, sube tu documento y empieza a hacer preguntas.',
  },
]

export default function Tutorial() {
  const [run, setRun] = useState(
    () => localStorage.getItem('docuquery_tutorial_completed') !== 'true'
  )

  const handleCallback = (data: CallBackProps) => {
    const { status } = data
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem('docuquery_tutorial_completed', 'true')
      setRun(false)
    }
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleCallback}
      locale={{
        back: 'Anterior',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Omitir tutorial',
      }}
      styles={{
        options: {
          primaryColor: '#131b2e',
          zIndex: 10000,
        },
      }}
    />
  )
}
```

```tsx
// src/App.tsx — agregar <Tutorial /> dentro del BrowserRouter
import Tutorial from './components/Tutorial'

export default function App() {
  const [showUpload, setShowUpload] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <BrowserRouter>
      <Tutorial />                    {/* ← añadir aquí */}
      <Sidebar onUploadClick={() => setShowUpload(true)} />
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => setRefreshKey(k => k + 1)}
        />
      )}
      <Routes>
        <Route path="/" element={<ChatPage key={refreshKey} />} />
        <Route path="/documents" element={<DocumentsPage key={refreshKey} />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## 7. Checklist de implementación

- [ ] Instalar `react-joyride`: `npm install react-joyride`
- [ ] Crear `src/components/Tutorial.tsx` con los 8 pasos definidos en la sección 3
- [ ] Añadir los 6 atributos `data-tutorial="..."` a los elementos listados en la sección 5
- [ ] Integrar `<Tutorial />` en `App.tsx` dentro del `<BrowserRouter>`
- [ ] Verificar comportamiento en pantallas pequeñas (omitir paso 5 si `window.innerWidth < 1280`)
- [ ] Agregar botón "Ver tutorial de nuevo" en `SettingsPage.tsx` que limpie la clave de localStorage
- [ ] Probar flujo completo: primera visita → tour → completar → segunda visita sin tour
