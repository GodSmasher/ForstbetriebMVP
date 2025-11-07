'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Tool {
  id: string
  name: string
  category: string
  qr_code: string | null
  status: string
  wear_count: number
  wear_limit: number | null
  purchase_date: string | null
  purchase_price: number | null
  current_team_id: string | null
  current_user_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface ToolUsage {
  id: string
  tool_id: string
  user_id: string
  scanned_at: string
  returned_at: string | null
  wear_increment: number
  notes: string | null
  profiles?: {
    full_name: string
    email: string
  }
}

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [showScanner, setShowScanner] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [toolUsage, setToolUsage] = useState<ToolUsage[]>([])
  const [editMode, setEditMode] = useState(false)
  const [editedTool, setEditedTool] = useState<Tool | null>(null)

  useEffect(() => {
    loadTools()
  }, [])

  useEffect(() => {
    if (selectedTool) {
      loadToolUsage(selectedTool.id)
    }
  }, [selectedTool])

  async function loadTools() {
    const { data } = await supabase
      .from('tools')
      .select('*')
      .order('name')

    if (data) {
      setTools(data)
    }
    setLoading(false)
  }

  async function loadToolUsage(toolId: string) {
    const { data } = await supabase
      .from('tool_usage')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq('tool_id', toolId)
      .order('scanned_at', { ascending: false })
      .limit(10)

    if (data) {
      setToolUsage(data as any)
    }
  }

  async function updateTool() {
    if (!editedTool) return

    const { error } = await (supabase
      .from('tools')
      .update as any)({
        name: editedTool.name,
        category: editedTool.category,
        status: editedTool.status,
        wear_limit: editedTool.wear_limit,
        purchase_price: editedTool.purchase_price,
        notes: editedTool.notes,
      })
      .eq('id', editedTool.id)

    if (!error) {
      setTools(tools.map(t => t.id === editedTool.id ? editedTool : t))
      setSelectedTool(editedTool)
      setEditMode(false)
    }
  }

  async function incrementWear(toolId: string) {
    const tool = tools.find(t => t.id === toolId)
    if (!tool) return

    const { error } = await (supabase
      .from('tools')
      .update as any)({ wear_count: tool.wear_count + 1 })
      .eq('id', toolId)

    if (!error) {
      loadTools()
      if (selectedTool?.id === toolId) {
        setSelectedTool({ ...selectedTool, wear_count: selectedTool.wear_count + 1 })
      }
    }
  }

  async function resetWear(toolId: string) {
    const confirmed = confirm('Verschleißzähler wirklich zurücksetzen?')
    if (!confirmed) return

    const { error } = await (supabase
      .from('tools')
      .update as any)({ wear_count: 0 })
      .eq('id', toolId)

    if (!error) {
      loadTools()
      if (selectedTool?.id === toolId) {
        setSelectedTool({ ...selectedTool, wear_count: 0 })
      }
    }
  }

  async function deleteTool(toolId: string) {
    const confirmed = confirm('Werkzeug wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')
    if (!confirmed) return

    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', toolId)

    if (!error) {
      setTools(tools.filter(t => t.id !== toolId))
      setSelectedTool(null)
    }
  }

  const filteredTools = tools.filter(tool => {
    if (filter === 'all') return true
    if (filter === 'available') return tool.status === 'verfuegbar'
    if (filter === 'in_use') return tool.status === 'im_einsatz'
    if (filter === 'maintenance') return tool.status === 'wartung'
    if (filter === 'critical') {
      if (!tool.wear_limit) return false
      return tool.wear_count >= tool.wear_limit * 0.8
    }
    return true
  })

  const stats = {
    total: tools.length,
    available: tools.filter(t => t.status === 'verfuegbar').length,
    inUse: tools.filter(t => t.status === 'im_einsatz').length,
    maintenance: tools.filter(t => t.status === 'wartung').length,
    critical: tools.filter(t => t.wear_limit && t.wear_count >= t.wear_limit * 0.8).length,
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      saege: 'bg-red-100 text-red-800',
      kette: 'bg-orange-100 text-orange-800',
      schutz: 'bg-green-100 text-green-800',
      werkzeug: 'bg-blue-100 text-blue-800',
      sonstiges: 'bg-gray-100 text-gray-800',
    }
    return colors[category] || colors.sonstiges
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      saege: 'Säge',
      kette: 'Kette',
      schutz: 'Schutz',
      werkzeug: 'Werkzeug',
      sonstiges: 'Sonstiges',
    }
    return labels[category] || category
  }

  const getWearPercentage = (tool: Tool) => {
    if (!tool.wear_limit) return null
    return Math.round((tool.wear_count / tool.wear_limit) * 100)
  }

  const getWearColor = (percentage: number | null) => {
    if (percentage === null) return 'bg-gray-200'
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-orange-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 font-medium">Lade Werkzeuge...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Werkzeugverwaltung</h1>
          <p className="text-gray-600 mt-1">{tools.length} Werkzeuge gesamt</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center space-x-2 px-5 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl border-2 border-gray-300 shadow-sm hover:shadow-md transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>QR Scannen</span>
          </button>
          <button className="flex items-center space-x-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Neues Werkzeug</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gray-100 p-3 rounded-xl">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Gesamt</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-green-100">Verfügbar</p>
          <p className="text-3xl font-bold mt-2">{stats.available}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-blue-100">Im Einsatz</p>
          <p className="text-3xl font-bold mt-2">{stats.inUse}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-orange-100">Wartung</p>
          <p className="text-3xl font-bold mt-2">{stats.maintenance}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-red-100">Kritisch</p>
          <p className="text-3xl font-bold mt-2">{stats.critical}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 bg-white p-2 rounded-xl border border-gray-200 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            filter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Alle
        </button>
        <button
          onClick={() => setFilter('available')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            filter === 'available' ? 'bg-green-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Verfügbar <span className="ml-1 opacity-70">({stats.available})</span>
        </button>
        <button
          onClick={() => setFilter('in_use')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            filter === 'in_use' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Im Einsatz <span className="ml-1 opacity-70">({stats.inUse})</span>
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            filter === 'critical' ? 'bg-red-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Kritisch <span className="ml-1 opacity-70">({stats.critical})</span>
        </button>
      </div>

      {/* Tools Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Werkzeug
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Kategorie
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                QR-Code
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Verschleiß
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTools.map((tool) => {
              const wearPercentage = getWearPercentage(tool)
              return (
                <tr key={tool.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{tool.name}</div>
                    {tool.purchase_date && (
                      <div className="text-xs text-gray-500">
                        Gekauft: {new Date(tool.purchase_date).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(tool.category)}`}>
                      {getCategoryLabel(tool.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {tool.qr_code || '-'}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      tool.status === 'verfuegbar'
                        ? 'bg-green-100 text-green-800'
                        : tool.status === 'im_einsatz'
                        ? 'bg-blue-100 text-blue-800'
                        : tool.status === 'wartung'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tool.status === 'verfuegbar' ? 'Verfügbar' :
                       tool.status === 'im_einsatz' ? 'Im Einsatz' :
                       tool.status === 'wartung' ? 'Wartung' : tool.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {wearPercentage !== null ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full ${getWearColor(wearPercentage)}`}
                              style={{ width: `${Math.min(wearPercentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{wearPercentage}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {tool.wear_count}/{tool.wear_limit}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        setSelectedTool(tool)
                        setEditMode(false)
                      }}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      {selectedTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {editMode ? (
                    <input
                      type="text"
                      value={editedTool?.name || ''}
                      onChange={(e) => setEditedTool(editedTool ? { ...editedTool, name: e.target.value } : null)}
                      className="text-2xl font-bold border-b-2 border-blue-500 outline-none w-full"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold">{selectedTool.name}</h2>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(selectedTool.category)}`}>
                      {getCategoryLabel(selectedTool.category)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      selectedTool.status === 'verfuegbar' ? 'bg-green-100 text-green-800' :
                      selectedTool.status === 'im_einsatz' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedTool.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedTool(null)
                    setEditMode(false)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Basisdaten</h3>
                  
                  <div>
                    <label className="text-sm text-gray-500">QR-Code</label>
                    <div className="mt-1">
                      <code className="text-sm bg-gray-100 px-3 py-2 rounded block">
                        {selectedTool.qr_code || 'Nicht vergeben'}
                      </code>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    {editMode ? (
                      <select
                        value={editedTool?.status || ''}
                        onChange={(e) => setEditedTool(editedTool ? { ...editedTool, status: e.target.value } : null)}
                        className="mt-1 w-full px-3 py-2 border rounded"
                      >
                        <option value="verfuegbar">Verfügbar</option>
                        <option value="im_einsatz">Im Einsatz</option>
                        <option value="wartung">Wartung</option>
                        <option value="defekt">Defekt</option>
                      </select>
                    ) : (
                      <div className="mt-1 text-sm font-medium">{selectedTool.status}</div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Kategorie</label>
                    {editMode ? (
                      <select
                        value={editedTool?.category || ''}
                        onChange={(e) => setEditedTool(editedTool ? { ...editedTool, category: e.target.value } : null)}
                        className="mt-1 w-full px-3 py-2 border rounded"
                      >
                        <option value="saege">Säge</option>
                        <option value="kette">Kette</option>
                        <option value="schutz">Schutz</option>
                        <option value="werkzeug">Werkzeug</option>
                        <option value="sonstiges">Sonstiges</option>
                      </select>
                    ) : (
                      <div className="mt-1 text-sm font-medium">{getCategoryLabel(selectedTool.category)}</div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Kaufdatum</label>
                    <div className="mt-1 text-sm">
                      {selectedTool.purchase_date 
                        ? new Date(selectedTool.purchase_date).toLocaleDateString('de-DE')
                        : '-'}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Kaufpreis</label>
                    {editMode ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editedTool?.purchase_price || ''}
                        onChange={(e) => setEditedTool(editedTool ? { ...editedTool, purchase_price: parseFloat(e.target.value) || null } : null)}
                        className="mt-1 w-full px-3 py-2 border rounded"
                        placeholder="0.00"
                      />
                    ) : (
                      <div className="mt-1 text-sm">
                        {selectedTool.purchase_price ? `${selectedTool.purchase_price.toFixed(2)} €` : '-'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Verschleiß</h3>
                  
                  {selectedTool.wear_limit ? (
                    <>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-500">Aktueller Verschleiß</span>
                          <span className="text-2xl font-bold">
                            {getWearPercentage(selectedTool)}%
                          </span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-3 mb-2">
                          <div
                            className={`h-3 rounded-full ${getWearColor(getWearPercentage(selectedTool))}`}
                            style={{ width: `${Math.min(getWearPercentage(selectedTool) || 0, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedTool.wear_count} von {selectedTool.wear_limit} Einsätzen
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-gray-500">Verschleißlimit</label>
                        {editMode ? (
                          <input
                            type="number"
                            value={editedTool?.wear_limit || ''}
                            onChange={(e) => setEditedTool(editedTool ? { ...editedTool, wear_limit: parseInt(e.target.value) || null } : null)}
                            className="mt-1 w-full px-3 py-2 border rounded"
                          />
                        ) : (
                          <div className="mt-1 text-sm font-medium">{selectedTool.wear_limit} Einsätze</div>
                        )}
                      </div>

                      {!editMode && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => incrementWear(selectedTool.id)}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                          >
                            + Verschleiß
                          </button>
                          <button
                            onClick={() => resetWear(selectedTool.id)}
                            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
                          >
                            Zurücksetzen
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Kein Verschleißlimit definiert
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Notizen</h3>
                {editMode ? (
                  <textarea
                    value={editedTool?.notes || ''}
                    onChange={(e) => setEditedTool(editedTool ? { ...editedTool, notes: e.target.value } : null)}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                    placeholder="Notizen zum Werkzeug..."
                  />
                ) : (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedTool.notes || 'Keine Notizen'}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Verwendungshistorie</h3>
                {toolUsage.length > 0 ? (
                  <div className="space-y-2">
                    {toolUsage.map((usage) => (
                      <div key={usage.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="text-sm font-medium">
                            {usage.profiles?.full_name || usage.profiles?.email || 'Unbekannt'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(usage.scanned_at).toLocaleString('de-DE')}
                            {usage.returned_at && (
                              <> bis {new Date(usage.returned_at).toLocaleString('de-DE')}</>
                            )}
                          </div>
                        </div>
                        <div className="text-sm">
                          {usage.returned_at ? (
                            <span className="text-green-600">Zurückgegeben</span>
                          ) : (
                            <span className="text-blue-600">In Verwendung</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    Noch keine Verwendungen
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                {editMode ? (
                  <>
                    <button
                      onClick={updateTool}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false)
                        setEditedTool(null)
                      }}
                      className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                      Abbrechen
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditMode(true)
                        setEditedTool(selectedTool)
                      }}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => deleteTool(selectedTool.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Löschen
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCANNER MODAL */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">QR-Code Scanner</h2>
              <button
                onClick={() => setShowScanner(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-gray-100 h-64 flex items-center justify-center rounded">
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <p>Scanner wird aktiviert...</p>
                <p className="text-xs mt-2">Kamera-Zugriff erforderlich</p>
              </div>
            </div>
            <div className="mt-4">
              <input
                type="text"
                placeholder="Oder QR-Code manuell eingeben"
                className="w-full px-4 py-2 border rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}