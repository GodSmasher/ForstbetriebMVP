'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Vehicle {
  id: string
  license_plate: string
  manufacturer: string | null
  wkz_code: string | null
  power_kw: number | null
  first_registration: string | null
  status: string
  fleet_number: string | null
  fin: string | null
  vnr: string | null
  hsn: string | null
  tsn: string | null
  insurance_data: any
  notes: string | null
}

interface Maintenance {
  id: string
  vehicle_id: string
  maintenance_type: string
  due_date: string
  completed_date: string | null
  status: string
  cost: number | null
  notes: string | null
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editedVehicle, setEditedVehicle] = useState<Vehicle | null>(null)
  const [filter, setFilter] = useState('all')
  const [maintenanceHistory, setMaintenanceHistory] = useState<Maintenance[]>([])
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [savingVehicle, setSavingVehicle] = useState(false)
  const [deletingVehicle, setDeletingVehicle] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Maintenance form state
  const [newMaintenance, setNewMaintenance] = useState({
    maintenance_type: 'tuev',
    due_date: '',
    notes: '',
    cost: '',
  })

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    if (selectedVehicle) {
      loadMaintenanceHistory(selectedVehicle.id)
    }
  }, [selectedVehicle])

  async function loadVehicles() {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .order('license_plate')

    if (data) {
      setVehicles(data)
    }
    setLoading(false)
  }

  async function loadMaintenanceHistory(vehicleId: string) {
    const { data } = await supabase
      .from('vehicle_maintenance')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('due_date', { ascending: false })

    if (data) {
      setMaintenanceHistory(data)
    }
  }

  async function updateVehicle() {
    if (!editedVehicle) return
    setSavingVehicle(true)
    setErrorMessage(null)

    const { error } = await (supabase
      .from('vehicles')
      .update as any)({
        license_plate: editedVehicle.license_plate,
        manufacturer: editedVehicle.manufacturer,
        status: editedVehicle.status,
        power_kw: editedVehicle.power_kw,
        notes: editedVehicle.notes,
      })
      .eq('id', editedVehicle.id)

    setSavingVehicle(false)

    if (error) {
      setErrorMessage('Fehler beim Speichern: ' + error.message)
      return
    }

    setVehicles(vehicles.map(v => v.id === editedVehicle.id ? editedVehicle : v))
    setSelectedVehicle(editedVehicle)
    setEditMode(false)
    showSuccess('Fahrzeug erfolgreich aktualisiert!')
  }

  async function deleteVehicle() {
    if (!selectedVehicle) return
    
    const confirmed = confirm(
      `Fahrzeug "${selectedVehicle.license_plate}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`
    )
    
    if (!confirmed) return

    setDeletingVehicle(true)
    setErrorMessage(null)

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', selectedVehicle.id)

    setDeletingVehicle(false)

    if (error) {
      setErrorMessage('Fehler beim Löschen: ' + error.message)
      return
    }

    setVehicles(vehicles.filter(v => v.id !== selectedVehicle.id))
    setSelectedVehicle(null)
    setEditMode(false)
    showSuccess('Fahrzeug erfolgreich gelöscht!')
  }

  async function addMaintenance() {
    if (!selectedVehicle || !newMaintenance.due_date) {
      setErrorMessage('Bitte füllen Sie alle Pflichtfelder aus!')
      return
    }

    setErrorMessage(null)

    const { error } = await (supabase
      .from('vehicle_maintenance')
      .insert as any)({
        vehicle_id: selectedVehicle.id,
        maintenance_type: newMaintenance.maintenance_type,
        due_date: newMaintenance.due_date,
        notes: newMaintenance.notes || null,
        cost: newMaintenance.cost ? parseFloat(newMaintenance.cost) : null,
        status: 'geplant',
      })

    if (error) {
      setErrorMessage('Fehler beim Hinzufügen der Wartung: ' + error.message)
      return
    }

    // Reload maintenance history
    await loadMaintenanceHistory(selectedVehicle.id)
    
    // Reset form
    setNewMaintenance({
      maintenance_type: 'tuev',
      due_date: '',
      notes: '',
      cost: '',
    })
    
    setShowMaintenanceModal(false)
    showSuccess('Wartung erfolgreich geplant!')
  }

  function showSuccess(message: string) {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    if (filter === 'all') return true
    if (filter === 'aktiv') return vehicle.status === 'aktiv'
    if (filter === 'wartung') return vehicle.status === 'wartung'
    return true
  })

  const stats = {
    total: vehicles.length,
    mercedes: vehicles.filter(v => v.manufacturer === 'MERCEDES-BENZ').length,
    vw: vehicles.filter(v => v.manufacturer === 'VW').length,
    totalPower: vehicles.reduce((sum, v) => sum + (v.power_kw || 0), 0),
    active: vehicles.filter(v => v.status === 'aktiv').length,
    maintenance: vehicles.filter(v => v.status === 'wartung').length,
  }

  const maintenanceTypeLabels: Record<string, string> = {
    tuev: 'TÜV/HU',
    oil_change: 'Ölwechsel',
    tire_change: 'Reifenwechsel',
    insurance: 'Versicherung',
    general_service: 'Inspektion',
    custom: 'Sonstiges'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 font-medium">Lade Fahrzeuge...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slideIn">
          <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 animate-slideIn">
          <div className="bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-start space-x-3 max-w-md">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">Fehler</p>
              <p className="text-sm text-red-100">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="ml-auto">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fuhrparkverwaltung</h1>
          <p className="text-gray-600 mt-1">{vehicles.length} Fahrzeuge gesamt</p>
        </div>
        <button className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Neues Fahrzeug</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gray-100 p-3 rounded-xl">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">Gesamt</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-blue-100">Mercedes-Benz</p>
          <p className="text-3xl font-bold mt-2">{stats.mercedes}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-green-100">VW</p>
          <p className="text-3xl font-bold mt-2">{stats.vw}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-purple-100">Gesamt-Leistung</p>
          <p className="text-3xl font-bold mt-2">{stats.totalPower}</p>
          <p className="text-xs text-purple-100 mt-1">kW</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-orange-100">In Wartung</p>
          <p className="text-3xl font-bold mt-2">{stats.maintenance}</p>
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
          onClick={() => setFilter('aktiv')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            filter === 'aktiv' ? 'bg-green-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Aktiv <span className="ml-1 opacity-70">({stats.active})</span>
        </button>
        <button
          onClick={() => setFilter('wartung')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            filter === 'wartung' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Wartung <span className="ml-1 opacity-70">({stats.maintenance})</span>
        </button>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Kennzeichen
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Hersteller
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                WKZ
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Leistung
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Erstzulassung
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-600 font-medium">Keine Fahrzeuge gefunden</p>
                    <p className="text-gray-500 text-sm mt-1">Passen Sie die Filter an oder fügen Sie ein neues Fahrzeug hinzu</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{vehicle.license_plate}</div>
                        {vehicle.fleet_number && (
                          <div className="text-xs text-gray-500">Flottenr. {vehicle.fleet_number}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{vehicle.manufacturer || '-'}</div>
                    {vehicle.fin && (
                      <div className="text-xs text-gray-500 font-mono">FIN: ...{vehicle.fin.slice(-6)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-lg">
                      {vehicle.wkz_code || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {vehicle.power_kw ? `${vehicle.power_kw} kW` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {vehicle.first_registration
                      ? new Date(vehicle.first_registration).toLocaleDateString('de-DE')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                        vehicle.status === 'aktiv'
                          ? 'bg-green-100 text-green-800'
                          : vehicle.status === 'wartung'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {vehicle.status === 'aktiv' ? 'Aktiv' : vehicle.status === 'wartung' ? 'Wartung' : vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => {
                        setSelectedVehicle(vehicle)
                        setEditMode(false)
                      }}
                      className="text-blue-600 hover:text-blue-900 font-semibold hover:underline"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-3xl z-10">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div className="text-white">
                    {editMode ? (
                      <input
                        type="text"
                        value={editedVehicle?.license_plate || ''}
                        onChange={(e) => setEditedVehicle(editedVehicle ? { ...editedVehicle, license_plate: e.target.value } : null)}
                        className="text-2xl font-bold bg-white/20 border-b-2 border-white/50 outline-none px-2 py-1 rounded text-white placeholder-white/60"
                      />
                    ) : (
                      <h2 className="text-2xl font-bold">{selectedVehicle.license_plate}</h2>
                    )}
                    {editMode ? (
                      <input
                        type="text"
                        value={editedVehicle?.manufacturer || ''}
                        onChange={(e) => setEditedVehicle(editedVehicle ? { ...editedVehicle, manufacturer: e.target.value } : null)}
                        className="text-sm bg-white/20 border-b border-white/30 outline-none px-2 py-1 rounded text-blue-100 placeholder-blue-200 mt-1"
                        placeholder="Hersteller"
                      />
                    ) : (
                      <p className="text-blue-100 text-sm mt-1">{selectedVehicle.manufacturer || 'Unbekannt'}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedVehicle(null)
                    setEditMode(false)
                    setEditedVehicle(null)
                  }}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status and WKZ Badges */}
              <div className="flex items-center space-x-3">
                {editMode ? (
                  <select
                    value={editedVehicle?.status || ''}
                    onChange={(e) => setEditedVehicle(editedVehicle ? { ...editedVehicle, status: e.target.value } : null)}
                    className="px-4 py-2 text-sm font-semibold text-gray-900 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="aktiv">Aktiv</option>
                    <option value="wartung">Wartung</option>
                    <option value="inaktiv">Inaktiv</option>
                  </select>
                ) : (
                  <span
                    className={`px-4 py-2 text-sm font-semibold rounded-xl ${
                      selectedVehicle.status === 'aktiv'
                        ? 'bg-green-100 text-green-800'
                        : selectedVehicle.status === 'wartung'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedVehicle.status}
                  </span>
                )}
                {selectedVehicle.wkz_code && (
                  <span className="px-4 py-2 text-sm font-semibold bg-blue-100 text-blue-800 rounded-xl">
                    WKZ: {selectedVehicle.wkz_code}
                  </span>
                )}
              </div>

              {/* Vehicle Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Basic Data */}
                <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Fahrzeugdaten
                  </h3>
                  
                  <DetailRow label="VNR" value={selectedVehicle.vnr} />
                  <DetailRow label="Flottennummer" value={selectedVehicle.fleet_number} />
                  <DetailRow label="FIN" value={selectedVehicle.fin} mono />
                  <DetailRow 
                    label="HSN / TSN" 
                    value={`${selectedVehicle.hsn || '-'} / ${selectedVehicle.tsn || '-'}`} 
                  />
                  
                  {editMode ? (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">Leistung (kW)</span>
                      <input
                        type="number"
                        value={editedVehicle?.power_kw || ''}
                        onChange={(e) => setEditedVehicle(editedVehicle ? { ...editedVehicle, power_kw: parseFloat(e.target.value) || null } : null)}
                        className="text-sm font-semibold text-gray-900 px-3 py-2 border-2 border-gray-300 rounded-lg w-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  ) : (
                    <DetailRow label="Leistung" value={selectedVehicle.power_kw ? `${selectedVehicle.power_kw} kW` : '-'} />
                  )}
                  
                  <DetailRow
                    label="Erstzulassung"
                    value={
                      selectedVehicle.first_registration
                        ? new Date(selectedVehicle.first_registration).toLocaleDateString('de-DE')
                        : '-'
                    }
                  />
                </div>

                {/* Right Column - Insurance Data */}
                <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Versicherungsdaten
                  </h3>
                  
                  {selectedVehicle.insurance_data && typeof selectedVehicle.insurance_data === 'object' ? (
                    <>
                      <DetailRow 
                        label="KH-Deckung" 
                        value={(selectedVehicle.insurance_data as any).kh_deckung} 
                      />
                      <DetailRow 
                        label="SF-Klasse KH" 
                        value={(selectedVehicle.insurance_data as any).sf_klasse_kh} 
                      />
                      <DetailRow
                        label="Jahresbeitrag KH"
                        value={
                          (selectedVehicle.insurance_data as any).jahresbeitrag_kh
                            ? `${(selectedVehicle.insurance_data as any).jahresbeitrag_kh.toFixed(2)} €`
                            : '-'
                        }
                      />
                      <DetailRow 
                        label="SF-Klasse VK" 
                        value={(selectedVehicle.insurance_data as any).sf_klasse_vk} 
                      />
                      <DetailRow
                        label="Jahresbeitrag VK"
                        value={
                          (selectedVehicle.insurance_data as any).jahresbeitrag_vk
                            ? `${(selectedVehicle.insurance_data as any).jahresbeitrag_vk.toFixed(2)} €`
                            : '-'
                        }
                      />
                      <DetailRow 
                        label="Selbstbehalt KF" 
                        value={(selectedVehicle.insurance_data as any).selbstbehalt_kf} 
                      />
                      <div className="pt-3 border-t border-gray-300">
                        <DetailRow
                          label="Gesamtbeitrag (mtl.)"
                          value={
                            (selectedVehicle.insurance_data as any).gesamtbeitrag
                              ? `${(selectedVehicle.insurance_data as any).gesamtbeitrag.toFixed(2)} €`
                              : '-'
                          }
                          highlight
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-gray-500 italic">Keine Versicherungsdaten verfügbar</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance History Section */}
              {!editMode && (
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center">
                      <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Wartungshistorie
                    </h3>
                    <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-lg">
                      {maintenanceHistory.length} Einträge
                    </span>
                  </div>
                  
                  {maintenanceHistory.length > 0 ? (
                    <div className="space-y-3">
                      {maintenanceHistory.map((maintenance) => (
                        <div key={maintenance.id} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-semibold text-gray-900">
                                  {maintenanceTypeLabels[maintenance.maintenance_type] || maintenance.maintenance_type}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                  maintenance.status === 'abgeschlossen' 
                                    ? 'bg-green-100 text-green-800'
                                    : maintenance.status === 'geplant'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {maintenance.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p className="flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  Fällig: {new Date(maintenance.due_date).toLocaleDateString('de-DE')}
                                </p>
                                {maintenance.completed_date && (
                                  <p className="flex items-center text-green-600">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Erledigt: {new Date(maintenance.completed_date).toLocaleDateString('de-DE')}
                                  </p>
                                )}
                                {maintenance.notes && (
                                  <p className="text-xs text-gray-500 mt-2 italic">{maintenance.notes}</p>
                                )}
                              </div>
                            </div>
                            {maintenance.cost && (
                              <div className="text-right ml-4">
                                <p className="text-lg font-bold text-gray-900">{maintenance.cost.toFixed(2)} €</p>
                                <p className="text-xs text-gray-500">Kosten</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm text-gray-500">Keine Wartungen geplant</p>
                      <p className="text-xs text-gray-400 mt-1">Klicken Sie auf &quot;Wartung planen&quot; um eine hinzuzufügen</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes Section */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Notizen
                </h3>
                {editMode ? (
                  <textarea
                    value={editedVehicle?.notes || ''}
                    onChange={(e) => setEditedVehicle(editedVehicle ? { ...editedVehicle, notes: e.target.value } : null)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    rows={4}
                    placeholder="Notizen zum Fahrzeug..."
                  />
                ) : (
                  <div className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-200">
                    {selectedVehicle.notes || (
                      <span className="text-gray-400 italic">Keine Notizen vorhanden</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {editMode ? (
                  <>
                    <button
                      onClick={updateVehicle}
                      disabled={savingVehicle}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                    >
                      {savingVehicle ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Speichern...
                        </>
                      ) : (
                        'Speichern'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false)
                        setEditedVehicle(null)
                      }}
                      disabled={savingVehicle}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                    >
                      Abbrechen
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditMode(true)
                        setEditedVehicle(selectedVehicle)
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                    >
                      Bearbeiten
                    </button>
                    <button 
                      onClick={() => setShowMaintenanceModal(true)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                    >
                      Wartung planen
                    </button>
                    <button 
                      onClick={deleteVehicle}
                      disabled={deletingVehicle}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
                    >
                      {deletingVehicle ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Löschen...
                        </>
                      ) : (
                        'Löschen'
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Maintenance Modal */}
      {showMaintenanceModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-white">
                    <h2 className="text-xl font-bold">Wartung planen</h2>
                    <p className="text-orange-100 text-sm">{selectedVehicle.license_plate}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMaintenanceModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Maintenance Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Wartungsart *
                </label>
                <select
                  value={newMaintenance.maintenance_type}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, maintenance_type: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="tuev">TÜV/HU</option>
                  <option value="oil_change">Ölwechsel</option>
                  <option value="tire_change">Reifenwechsel</option>
                  <option value="insurance">Versicherung</option>
                  <option value="general_service">Inspektion</option>
                  <option value="custom">Sonstiges</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Fälligkeitsdatum *
                </label>
                <input
                  type="date"
                  value={newMaintenance.due_date}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, due_date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Geschätzte Kosten (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newMaintenance.cost}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, cost: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notizen
                </label>
                <textarea
                  value={newMaintenance.notes}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="Zusätzliche Informationen..."
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={addMaintenance}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                  Wartung hinzufügen
                </button>
                <button
                  onClick={() => {
                    setShowMaintenanceModal(false)
                    setNewMaintenance({ maintenance_type: 'tuev', due_date: '', notes: '', cost: '' })
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value, mono = false, highlight = false }: { 
  label: string; 
  value?: string | null; 
  mono?: boolean; 
  highlight?: boolean 
}) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className={`text-sm text-right ${highlight ? 'font-bold text-blue-600 text-base' : 'font-semibold text-gray-900'} ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '-'}
      </span>
    </div>
  )
}
