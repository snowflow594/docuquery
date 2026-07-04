import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Tutorial from './components/Tutorial'
import UploadModal from './components/UploadModal'
import ChatPage from './pages/ChatPage'
import DocumentsPage from './pages/DocumentsPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const [showUpload, setShowUpload] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <BrowserRouter>
      <Tutorial />
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
