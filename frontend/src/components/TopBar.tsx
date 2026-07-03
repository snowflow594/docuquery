import { NavLink } from 'react-router-dom'

export default function TopBar() {
  return (
    <header className="fixed top-0 right-0 left-[280px] h-16 bg-white flex justify-between items-center px-4 border-b border-[#c6c6cd] z-40">
      <div className="flex items-center gap-8">
        <span className="text-[20px] font-bold text-[#0b1c30]">DocuQuery Professional</span>
        <nav className="hidden lg:flex items-center gap-6">
          {[
            { label: 'Dashboard', to: '/', end: true },
            { label: 'Workspaces', to: '/documents', end: false },
            { label: 'Analytic Logs', to: '/history', end: false },
          ].map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `text-[11px] font-bold uppercase tracking-widest pb-1 transition-colors ${
                  isActive ? 'text-black border-b-2 border-black' : 'text-[#45464d] hover:text-black'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] text-[20px]">search</span>
          <input
            className="pl-10 pr-4 py-1.5 bg-[#eff4ff] border border-[#c6c6cd] rounded-full text-[13px] w-64 focus:ring-2 focus:ring-black focus:outline-none"
            placeholder="Search across documents..."
            type="text"
          />
        </div>
        <NavLink
          to="/"
          className="bg-black text-white px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest"
        >
          New Query
        </NavLink>
        <button className="w-10 h-10 flex items-center justify-center text-[#45464d] hover:bg-[#eff4ff] rounded-full transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-[#45464d] hover:bg-[#eff4ff] rounded-full transition-colors">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  )
}
