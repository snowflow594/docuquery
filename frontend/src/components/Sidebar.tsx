import { NavLink } from 'react-router-dom'

interface SidebarProps {
  onUploadClick: () => void
}

export default function Sidebar({ onUploadClick }: SidebarProps) {
  return (
    <aside className="w-[280px] h-screen fixed left-0 top-0 bg-white flex flex-col border-r border-[#c6c6cd] py-4 z-50">
      <div className="px-6 mb-8">
        <h1 className="text-2xl font-bold text-[#0b1c30]">DocuQuery</h1>
        <p className="text-[13px] text-[#45464d]">Enterprise RAG</p>
      </div>

      <div className="px-4 mb-6">
        <button
          onClick={onUploadClick}
          data-tutorial="upload-btn"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-black text-white text-[11px] font-bold uppercase tracking-widest rounded-lg transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          Upload PDF
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {[
          { to: '/', icon: 'add_box', label: 'New Chat', end: true, tutorial: undefined },
          { to: '/documents', icon: 'description', label: 'Recent Documents', end: false, tutorial: 'nav-documents' },
          { to: '/history', icon: 'history', label: 'History', end: false, tutorial: 'nav-history' },
          { to: '/settings', icon: 'settings', label: 'Settings', end: false, tutorial: undefined },
        ].map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            data-tutorial={item.tutorial}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 cursor-pointer ${
                isActive ? 'bg-[#e5eeff] text-black font-semibold' : 'text-[#45464d] hover:bg-[#eff4ff]'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-[14px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>

    </aside>
  )
}
