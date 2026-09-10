import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Menu } from 'lucide-react'
import { Popover, Transition } from '@headlessui/react'
import { initials } from '../lib/format'
import ThemeToggle from './ThemeToggle'
import LangToggle from './LangToggle'

import { useLang } from '../context/LangContext'
import { useNotifications } from '../context/NotificationsContext'

export default function Topbar({ onMenuClick, showSearch = true, searchValue, onSearchChange, profileName }) {
  const [q, setQ] = useState(searchValue || "")
  const { t } = useLang()
  const { items, unreadCount, readIds, markRead, markAllRead } = useNotifications()
  const navigate = useNavigate()

  const toneDot = { warn: 'bg-amber-500', due: 'bg-slate-900 dark:bg-amber-500', info: 'bg-slate-300 dark:bg-slate-600' }
  const toneBg = { warn: 'bg-amber-50/50 dark:bg-amber-950/30', due: 'bg-amber-50/50 dark:bg-amber-950/30', info: 'bg-slate-50/50 dark:bg-slate-700/20' }

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800">
      <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-8 py-3.5">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
          <Menu size={20} className="text-slate-600 dark:text-slate-400" />
        </button>

        {showSearch && (
          <div className="hidden sm:flex flex-1 max-w-md items-center gap-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-amber-300 dark:focus-within:border-amber-600 focus-within:ring-4 focus-within:ring-amber-100 dark:focus-within:ring-amber-900/30 transition-all">
            <Search size={16} className="text-slate-400" />
            <input
              value={q}
              onChange={e => { setQ(e.target.value); onSearchChange?.(e.target.value) }}
              placeholder={t('search_placeholder')}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400 dark:text-slate-200"
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          <Popover className="relative">
            <Popover.Button className="relative w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <Bell size={16} className="text-slate-600 dark:text-slate-400" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </Popover.Button>
            <Transition enter="transition duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="transition duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Popover.Panel className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-deep border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-sm font-semibold dark:text-slate-100">{t('notif_title')}</span>
                  <button onClick={markAllRead} className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 disabled:opacity-40" disabled={unreadCount === 0}>{t('notif_mark_all')}</button>
                </div>
                <div className="max-h-80 overflow-auto">
                  {items.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">{t('notif_empty')}</div>
                  ) : items.map(n => {
                    const unread = !readIds.includes(n.id)
                    return (
                      <button
                        key={n.id}
                        onClick={() => {
                          markRead(n.id)
                          if (n.to) navigate(n.to)
                        }}
                        className={`w-full text-left p-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-l-2 transition-colors ${unread ? `border-slate-900 ${toneBg[n.kind]}` : 'border-transparent'}`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${toneDot[n.kind] || 'bg-slate-300 dark:bg-slate-600'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium leading-snug dark:text-slate-200">{t(n.key, n.params)}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>

          <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-amber-500 flex items-center justify-center text-white dark:text-slate-900 text-xs font-bold">
            {initials(profileName || 'U').slice(0,2)}
          </div>
        </div>
      </div>
    </header>
  )
}