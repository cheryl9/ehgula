import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useClinicianStore } from '../../store/clinicianStore'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import clsx from 'clsx'

/**
 * Breadcrumb mapping for routes
 */
const getBreadcrumbs = (pathname) => {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = [{ name: 'Patients', path: '/patients' }]

  if (segments.length > 1) {
    const pageName = segments[0]
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    breadcrumbs.push({ name: pageName, path: `/${pageName.toLowerCase()}` })
  }

  return breadcrumbs
}

export default function MainLayout() {
  const location = useLocation()
  const sidebarOpen = useClinicianStore((state) => state.ui.sidebarOpen)
  const toggleSidebar = useClinicianStore((state) => state.actions.toggleSidebar)
  const breadcrumbs = getBreadcrumbs(location.pathname)

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar with animation */}
      <div
        className={clsx(
          'transition-all duration-300 ease-in-out overflow-hidden',
          sidebarOpen ? 'w-64' : 'w-0'
        )}
      >
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <div className="border-b border-slate-200 bg-white">
          <div className="flex items-center gap-4 px-6 py-4">
            {/* Sidebar Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Topbar Component */}
            <div className="flex-1">
              <Topbar />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
