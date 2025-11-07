'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    vehicles: 0,
    activeAssignments: 0,
    availableTools: 0,
    pendingMaintenance: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const { count: vehicleCount } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })

    const { count: assignmentCount } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .in('status', ['offen', 'in_arbeit'])

    const { count: toolCount } = await supabase
      .from('tools')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verfuegbar')

    setStats({
      vehicles: vehicleCount || 0,
      activeAssignments: assignmentCount || 0,
      availableTools: toolCount || 0,
      pendingMaintenance: 0,
    })
    setLoading(false)
  }

  const statCards = [
    {
      name: 'Aktive Einsätze',
      value: stats.activeAssignments,
      change: null,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'blue',
      href: '/dashboard/planning'
    },
    {
      name: 'Verfügbare Werkzeuge',
      value: stats.availableTools,
      change: null,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'green',
      href: '/dashboard/tools'
    },
    {
      name: 'Fahrzeuge im Fuhrpark',
      value: stats.vehicles,
      change: null,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      color: 'purple',
      href: '/dashboard/vehicles'
    },
    {
      name: 'Wartungen Fällig',
      value: stats.pendingMaintenance,
      change: null,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'orange',
      href: '/dashboard/vehicles'
    },
  ]

  const quickLinks = [
    {
      name: 'Fuhrpark verwalten',
      description: 'Fahrzeuge und Wartungen',
      href: '/dashboard/vehicles',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      color: 'purple'
    },
    {
      name: 'Werkzeuge erfassen',
      description: 'QR-Codes und Verschleiß',
      href: '/dashboard/tools',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'green'
    },
    {
      name: 'Einsatz planen',
      description: 'Teams und Aufgaben',
      href: '/dashboard/planning',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'blue'
    },
    {
      name: 'Berichte ansehen',
      description: 'Analysen und Statistiken',
      href: '/dashboard/reports',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'orange'
    },
  ]

  const colorClasses = {
    blue: {
      bg: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      text: 'text-blue-600',
      hover: 'hover:bg-blue-100',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-500',
      lightBg: 'bg-green-50',
      text: 'text-green-600',
      hover: 'hover:bg-green-100',
      border: 'border-green-200'
    },
    purple: {
      bg: 'bg-purple-500',
      lightBg: 'bg-purple-50',
      text: 'text-purple-600',
      hover: 'hover:bg-purple-100',
      border: 'border-purple-200'
    },
    orange: {
      bg: 'bg-orange-500',
      lightBg: 'bg-orange-50',
      text: 'text-orange-600',
      hover: 'hover:bg-orange-100',
      border: 'border-orange-200'
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Willkommen zurück! Hier ist ein Überblick über Ihren Betrieb.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const colors = colorClasses[card.color as keyof typeof colorClasses]
          return (
            <Link
              key={card.name}
              href={card.href}
              className="group bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div className={`${colors.lightBg} p-3 rounded-xl ${colors.text} group-hover:scale-110 transition-transform`}>
                  {card.icon}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600">{card.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Links Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Schnellzugriff</h2>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              4 Module
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {quickLinks.map((link) => {
              const colors = colorClasses[link.color as keyof typeof colorClasses]
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`group p-4 rounded-xl border-2 ${colors.border} ${colors.lightBg} hover:shadow-md transition-all duration-200`}
                >
                  <div className={`${colors.text} mb-3 group-hover:scale-110 transition-transform inline-block`}>
                    {link.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{link.name}</h3>
                  <p className="text-xs text-gray-600">{link.description}</p>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Getting Started Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold">Erste Schritte</h2>
              <p className="text-blue-100 text-sm mt-1">Richten Sie Ihr System ein</p>
            </div>
            <span className="bg-blue-500 px-3 py-1 rounded-full text-xs font-semibold">
              {stats.vehicles > 0 ? '1/4' : '0/4'}
            </span>
          </div>
          <div className="space-y-3">
            <div className={`flex items-start p-3 rounded-xl ${stats.vehicles > 0 ? 'bg-white/20' : 'bg-white/10'}`}>
              {stats.vehicles > 0 ? (
                <svg className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-5 h-5 border-2 border-white/30 rounded-full mt-0.5 flex-shrink-0" />
              )}
              <div className="ml-3 flex-1">
                <p className="font-medium text-sm">Fahrzeuge importieren</p>
                <p className="text-xs text-blue-100 mt-0.5">{stats.vehicles} Fahrzeuge hinzugefügt</p>
              </div>
            </div>
            
            <div className="flex items-start p-3 rounded-xl bg-white/10">
              <div className="w-5 h-5 border-2 border-white/30 rounded-full mt-0.5 flex-shrink-0" />
              <div className="ml-3 flex-1">
                <p className="font-medium text-sm">Werkzeuge erfassen</p>
                <p className="text-xs text-blue-100 mt-0.5">QR-Codes generieren</p>
              </div>
            </div>
            
            <div className="flex items-start p-3 rounded-xl bg-white/10">
              <div className="w-5 h-5 border-2 border-white/30 rounded-full mt-0.5 flex-shrink-0" />
              <div className="ml-3 flex-1">
                <p className="font-medium text-sm">Teams einrichten</p>
                <p className="text-xs text-blue-100 mt-0.5">Mitarbeiter zuweisen</p>
              </div>
            </div>
            
            <div className="flex items-start p-3 rounded-xl bg-white/10">
              <div className="w-5 h-5 border-2 border-white/30 rounded-full mt-0.5 flex-shrink-0" />
              <div className="ml-3 flex-1">
                <p className="font-medium text-sm">Ersten Einsatz planen</p>
                <p className="text-xs text-blue-100 mt-0.5">Einsatzplanung starten</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Aktivitäten</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Hier werden zukünftig Ihre letzten Aktivitäten und wichtige Benachrichtigungen angezeigt.
        </p>
      </div>
    </div>
  )
}
