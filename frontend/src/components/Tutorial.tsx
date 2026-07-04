import { useState } from 'react'
import { EVENTS, Joyride, STATUS, type EventData, type Step } from 'react-joyride'

export const TUTORIAL_STORAGE_KEY = 'docuquery_tutorial_completed'

const steps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Bienvenido a DocuQuery',
    content:
      'DocuQuery te permite hacer preguntas en lenguaje natural sobre tus documentos PDF. La IA analiza el contenido y responde citando exactamente los fragmentos que usó. Este tutorial te llevará por las funciones principales en menos de 2 minutos.',
  },
  {
    target: '[data-tutorial="upload-btn"]',
    placement: 'right',
    title: 'Sube tu primer documento',
    content:
      'Haz clic aquí para subir un PDF. El sistema lo procesa automáticamente: extrae el texto, lo divide en fragmentos y genera los vectores de búsqueda. Solo se aceptan archivos PDF de hasta 50 MB.',
  },
  {
    target: '[data-tutorial="chat-empty-state"]',
    placement: 'bottom',
    title: 'Aquí aparecerán tus conversaciones',
    content:
      'Una vez que hayas subido un documento, escribe tu pregunta en el campo de abajo y presiona Enter. La IA responderá basándose exclusivamente en el contenido del PDF.',
  },
  {
    target: '[data-tutorial="chat-input"]',
    placement: 'top',
    title: 'Escribe tu pregunta aquí',
    content:
      'Puedes preguntar cosas como: "¿Cuáles son las conclusiones principales?" o "Resume la sección 3". Presiona Enter para enviar o Shift + Enter para una nueva línea.',
  },
  {
    target: '[data-tutorial="preview-panel"]',
    placement: 'left',
    title: 'Ve exactamente de dónde viene cada respuesta',
    content:
      'Después de recibir una respuesta, aparecerán botones de fuentes debajo del mensaje. Al hacer clic en una fuente, este panel mostrará el fragmento exacto del PDF que la IA usó, junto con su porcentaje de similitud.',
  },
  {
    target: '[data-tutorial="nav-documents"]',
    placement: 'right',
    title: 'Gestiona tus documentos',
    content:
      'En esta sección puedes ver todos los PDFs indexados, su estado de procesamiento y cuántos fragmentos generó cada uno. También puedes eliminar documentos que ya no necesites.',
  },
  {
    target: '[data-tutorial="nav-history"]',
    placement: 'right',
    title: 'Revisa conversaciones anteriores',
    content:
      'El historial guarda todas tus conversaciones pasadas. Puedes buscar por texto y abrir cualquier conversación para releer las preguntas y respuestas completas.',
  },
  {
    target: 'body',
    placement: 'center',
    title: '¡Ya estás listo!',
    content:
      'Para empezar: haz clic en Upload PDF en el menú lateral, selecciona tu documento y escribe una pregunta en el chat. También puedes probar ahora mismo con los documentos de ejemplo ya cargados.',
  },
]

// El panel Vista Previa está oculto por debajo del breakpoint xl (1280px);
// si no es visible, joyride no encontraría el target y marcaría el paso como fallido.
const visibleSteps = () =>
  window.innerWidth >= 1280
    ? steps
    : steps.filter(s => s.target !== '[data-tutorial="preview-panel"]')

export default function Tutorial() {
  const [run, setRun] = useState(
    () => localStorage.getItem(TUTORIAL_STORAGE_KEY) !== 'true'
  )

  const handleEvent = (data: EventData) => {
    const finished =
      data.type === EVENTS.TOUR_END ||
      data.status === STATUS.FINISHED ||
      data.status === STATUS.SKIPPED
    if (finished) {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true')
      setRun(false)
    }
  }

  if (!run) return null

  return (
    <Joyride
      steps={visibleSteps()}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      locale={{
        back: 'Anterior',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        nextWithProgress: 'Siguiente ({current} de {total})',
        skip: 'Omitir tutorial',
      }}
      options={{
        skipBeacon: true,
        showProgress: true,
        buttons: ['back', 'close', 'primary', 'skip'],
        primaryColor: '#131b2e',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
      }}
    />
  )
}
