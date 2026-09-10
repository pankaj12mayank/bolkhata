import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Mic,
  Users,
  Wallet,
  CreditCard,
  User,
  LogOut,
  ChevronLeft,
  Store,
  BarChart3,
  FileText,
  Settings,
  SlidersHorizontal,
  Crown,
  Layers,
  Receipt,
} from 'lucide-react'
import Logo from './Logo'
import { initials } from '../lib/format'
import { useLang } from '../context/LangContext'

const iconMap = {
  Home: LayoutDashboard,
  'Naya Entry': Mic,
  'Grahak List': Users,
  Grahak: Users,
  'Cash Counter': Wallet,
  Cash: Wallet,
  Billing: CreditCard,
  'Plan & Billing': CreditCard,
  Plan: Layers,
  Plans: Layers,
  Profile: User,
  Overview: BarChart3,
  Shops: Store,
  Subscriptions: Crown,
  'Entries & Logs': FileText,
  Settings: Settings,
  Configuration: SlidersHorizontal,
  'My Profile': User,
  Payments: Receipt,
}

const labelKey = {
  Home: 'nav_home',
  'Naya Entry': 'nav_entry',
  'Grahak List': 'nav_customers',
  Grahak: 'nav_customers',
  'Cash Counter': 'nav_cash',
  Cash: 'nav_cash',
  Plan: 'nav_billing',
  'Plan & Billing': 'nav_billing',
  Plans: 'nav_plans',
  Profile: 'nav_profile',
  Overview: 'nav_overview',
  Shops: 'nav_shops',
  Subscriptions: 'nav_subs',
  'Entries & Logs': 'nav_logs',
  Settings: 'nav_settings',
  Configuration: 'nav_config',
  'My Profile': 'nav_admin_profile',
  Payments: 'nav_payments',
}

export default function Sidebar({
  roleLabel,
  navGroups,
  profileName,
  profileSub,
  onLogout,
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}) {
  const { t } = useLang()
  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 264 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col sticky top-0 h-screen z-30 overflow-hidden"
      >
        <div
          className={`flex items-center border-b border-slate-100 dark:border-slate-800 h-[64px] shrink-0 ${
            collapsed ? 'justify-between px-3' : 'justify-between px-4'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {!collapsed ? (
              <motion.div
                key="logo"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="flex items-center"
              >
                <Logo size={26} />
              </motion.div>
            ) : (
              <motion.div
                key="mic"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.18 }}
                className="w-7 h-7 rounded-xl bg-slate-900 dark:bg-amber-500 flex items-center justify-center flex-shrink-0"
              >
                <Mic size={14} className="text-white dark:text-slate-900" />
              </motion.div>
            )}
          </AnimatePresence>
          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? t('aria_expand') : t('aria_collapse')}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shrink-0"
            >
              <ChevronLeft
                size={16}
                className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
              />
            </button>
          ) : null}
        </div>

        {!collapsed && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 text-xs font-semibold text-amber-700 dark:text-amber-300 text-center">
            {roleLabel}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {!collapsed && group.label && (
                <div className="text-[11px] font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500 px-2 mb-1">
                  {t(group.label)}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = iconMap[item.label] || LayoutDashboard
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                          collapsed ? 'justify-center' : ''
                        } ${
                          isActive
                            ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                        }`
                      }
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      {!collapsed && (
                        <span>
                          {labelKey[item.label] ? t(labelKey[item.label]) : item.label}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-amber-500 flex items-center justify-center text-white dark:text-slate-900 text-xs font-bold flex-shrink-0">
              {initials(profileName).slice(0, 2)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate dark:text-slate-100">
                  {profileName}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {profileSub}
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onLogout}
              className="mt-3 w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <LogOut size={16} /> {t('logout')}
            </button>
          )}
        </div>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <Logo size={26} />
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
                  ✕
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-4">
                {navGroups.map((group, gi) => (
                  <div key={gi}>
                    <div className="text-[11px] font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500 px-2 mb-1">
                      {t(group.label)}
                    </div>
                    {group.items.map((item) => {
                      const Icon = iconMap[item.label] || LayoutDashboard
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                              isActive
                                ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`
                          }
                        >
                          <Icon size={18} />{' '}
                          {labelKey[item.label] ? t(labelKey[item.label]) : item.label}
                        </NavLink>
                      )
                    })}
                  </div>
                ))}
              </nav>
              <div className="p-3 border-t border-slate-100">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} /> {t('logout')}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
