'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventInput } from '@fullcalendar/core'
import type { DateSelectArg, EventClickArg, EventChangeArg } from '@fullcalendar/core'

interface Team {
  id: string
  name: string
  color: string | null
  active: boolean | null
}

interface Vehicle {
  id: string
  license_plate: string
  manufacturer: string | null
}

interface Tool {
  id: string
  name: string
  category: string
}

interface Assignment {
  id: string
  title: string
  description: string | null
  location: string | null
  start_datetime: string
  end_datetime: string | null
  estimated_duration: number | null
  status: string
  priority: string
  notes: string | null
  team_id: string | null
  vehicle_id: string | null
  required_tools: string[] | null
  created_by: string | null
  updated_by: string | null
  metadata: any
  weather_warning: boolean | null
  teams?: Team | null
  vehicles?: Vehicle | null
  profiles?: {
    full_name: string
  }
}

export default function PlanningPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const calendarRef = useRef<FullCalendar>(null)

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    location: '',
    start_datetime: '',
    end_datetime: '',
    estimated_duration: '',
    team_id: '',
    vehicle_id: '',
    required_tools: [] as string[],
    priority: 'normal',
    notes: '',
  })

  useEffect(() => {
    loadUser()
    loadTeams()
    loadVehicles()
    loadTools()
  }, [])

  useEffect(() => {
    loadAssignments()
  }, [filterTeam, filterStatus])

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUser(user.id)
    }
  }

  async function loadAssignments() {
    setLoading(true)
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 3)

    let query = supabase
      .from('assignments')
      .select(`
        *,
        teams(id, name, color),
        vehicles(id, license_plate, manufacturer),
        profiles:created_by(full_name)
      `)
      .gte('start_datetime', startDate.toISOString())
      .lte('start_datetime', endDate.toISOString())
      .order('start_datetime', { ascending: true })

    if (filterTeam !== 'all') {
      query = query.eq('team_id', filterTeam)
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'aktiv') {
        query = query.in('status', ['offen', 'in_arbeit'])
      } else {
        query = query.eq('status', filterStatus)
      }
    }

    const { data, error } = await query

    if (error) {
      showError('Fehler beim Laden: ' + error.message)
    } else {
      setAssignments(data as any)
    }
    setLoading(false)
  }

  async function loadTeams() {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .eq('active', true)
      .order('name')

    if (data) {
      setTeams(data)
    }
  }

  async function loadVehicles() {
    const { data } = await supabase
      .from('vehicles')
      .select('id, license_plate, manufacturer')
      .eq('status', 'aktiv')
      .order('license_plate')

    if (data) {
      setVehicles(data)
    }
  }

  async function loadTools() {
    const { data } = await supabase
      .from('tools')
      .select('id, name, category')
      .order('name')

    if (data) {
      setTools(data)
    }
  }

  function showSuccess(message: string) {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  function showError(message: string) {
    setErrorMessage(message)
    setTimeout(() => setErrorMessage(null), 5000)
  }

  async function createAssignment() {
    if (!newAssignment.title || !newAssignment.start_datetime || !newAssignment.team_id) {
      showError('Bitte füllen Sie alle Pflichtfelder aus!')
      return
    }

    if (!currentUser) {
      showError('Benutzer nicht gefunden!')
      return
    }

    setSaving(true)
    setErrorMessage(null)

    const { error } = await supabase
      .from('assignments')
      .insert({
        title: newAssignment.title,
        description: newAssignment.description || null,
        location: newAssignment.location || null,
        start_datetime: newAssignment.start_datetime,
        end_datetime: newAssignment.end_datetime || null,
        estimated_duration: newAssignment.estimated_duration ? parseFloat(newAssignment.estimated_duration) : null,
        team_id: newAssignment.team_id,
        vehicle_id: newAssignment.vehicle_id || null,
        required_tools: newAssignment.required_tools.length > 0 ? newAssignment.required_tools : null,
        status: 'offen',
        priority: newAssignment.priority,
        notes: newAssignment.notes || null,
        created_by: currentUser,
        metadata: {},
        weather_warning: false,
      })

    setSaving(false)

    if (error) {
      showError('Fehler beim Erstellen: ' + error.message)
      return
    }

    setNewAssignment({
      title: '',
      description: '',
      location: '',
      start_datetime: '',
      end_datetime: '',
      estimated_duration: '',
      team_id: '',
      vehicle_id: '',
      required_tools: [],
      priority: 'normal',
      notes: '',
    })
    setShowCreateModal(false)
    await loadAssignments()
    showSuccess('Einsatz erfolgreich erstellt!')
  }

  async function updateAssignment() {
    if (!selectedAssignment) return

    if (!newAssignment.title || !newAssignment.start_datetime || !newAssignment.team_id) {
      showError('Bitte füllen Sie alle Pflichtfelder aus!')
      return
    }

    if (!currentUser) {
      showError('Benutzer nicht gefunden!')
      return
    }

    setSaving(true)
    setErrorMessage(null)

    const { error } = await supabase
      .from('assignments')
      .update({
        title: newAssignment.title,
        description: newAssignment.description || null,
        location: newAssignment.location || null,
        start_datetime: newAssignment.start_datetime,
        end_datetime: newAssignment.end_datetime || null,
        estimated_duration: newAssignment.estimated_duration ? parseFloat(newAssignment.estimated_duration) : null,
        team_id: newAssignment.team_id,
        vehicle_id: newAssignment.vehicle_id || null,
        required_tools: newAssignment.required_tools.length > 0 ? newAssignment.required_tools : null,
        priority: newAssignment.priority,
        notes: newAssignment.notes || null,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedAssignment.id)

    setSaving(false)

    if (error) {
      showError('Fehler beim Aktualisieren: ' + error.message)
      return
    }

    setShowEditModal(false)
    await loadAssignments()
    showSuccess('Einsatz erfolgreich aktualisiert!')
  }

  async function updateStatus(assignmentId: string, newStatus: string) {
    if (!currentUser) return

    const { error } = await supabase
      .from('assignments')
      .update({
        status: newStatus,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)

    if (error) {
      showError('Fehler beim Status-Update: ' + error.message)
      return
    }

    await loadAssignments()
    if (selectedAssignment?.id === assignmentId) {
      setSelectedAssignment({ ...selectedAssignment, status: newStatus })
    }
    showSuccess('Status aktualisiert!')
  }

  async function deleteAssignment() {
    if (!selectedAssignment) return

    if (selectedAssignment.status !== 'offen') {
      showError('Nur Einsätze mit Status "Offen" können gelöscht werden!')
      return
    }

    const confirmed = confirm(`Einsatz "${selectedAssignment.title}" wirklich löschen?`)
    if (!confirmed) return

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', selectedAssignment.id)

    if (error) {
      showError('Fehler beim Löschen: ' + error.message)
      return
    }

    setShowDetailsModal(false)
    setSelectedAssignment(null)
    await loadAssignments()
    showSuccess('Einsatz erfolgreich gelöscht!')
  }

  async function handleEventDrop(arg: EventChangeArg) {
    const assignment = assignments.find(a => a.id === arg.event.id)
    if (!assignment || !currentUser) return

    const { error } = await supabase
      .from('assignments')
      .update({
        start_datetime: arg.event.start?.toISOString() || assignment.start_datetime,
        end_datetime: arg.event.end?.toISOString() || assignment.end_datetime,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignment.id)

    if (error) {
      showError('Fehler beim Verschieben: ' + error.message)
      arg.revert()
      return
    }

    await loadAssignments()
    showSuccess('Einsatz verschoben!')
  }

  function handleDateSelect(selectInfo: DateSelectArg) {
    setNewAssignment({
      ...newAssignment,
      start_datetime: selectInfo.startStr,
      end_datetime: selectInfo.endStr,
    })
    setShowCreateModal(true)
    calendarRef.current?.getApi().unselect()
  }

  function handleEventClick(clickInfo: EventClickArg) {
    const assignment = assignments.find(a => a.id === clickInfo.event.id)
    if (assignment) {
      setSelectedAssignment(assignment)
      setShowDetailsModal(true)
    }
  }

  function openEditModal() {
    if (!selectedAssignment) return
    setNewAssignment({
      title: selectedAssignment.title,
      description: selectedAssignment.description || '',
      location: selectedAssignment.location || '',
      start_datetime: selectedAssignment.start_datetime,
      end_datetime: selectedAssignment.end_datetime || '',
      estimated_duration: selectedAssignment.estimated_duration?.toString() || '',
      team_id: selectedAssignment.team_id || '',
      vehicle_id: selectedAssignment.vehicle_id || '',
      required_tools: selectedAssignment.required_tools || [],
      priority: selectedAssignment.priority,
      notes: selectedAssignment.notes || '',
    })
    setShowDetailsModal(false)
    setShowEditModal(true)
  }

  const filteredAssignments = assignments.filter(assignment => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        assignment.title.toLowerCase().includes(query) ||
        assignment.location?.toLowerCase().includes(query) ||
        assignment.description?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const calendarEvents: EventInput[] = filteredAssignments.map(assignment => ({
    id: assignment.id,
    title: assignment.title,
    start: assignment.start_datetime,
    end: assignment.end_datetime || undefined,
    backgroundColor: assignment.teams?.color || '#475569',
    borderColor: assignment.teams?.color || '#475569',
    extendedProps: {
      team: assignment.teams?.name,
      vehicle: assignment.vehicles?.license_plate,
      status: assignment.status,
    },
  }))

  const stats = {
    today: assignments.filter(a => {
      const today = new Date().toDateString()
      return new Date(a.start_datetime).toDateString() === today
    }).length,
    active: assignments.filter(a => ['offen', 'in_arbeit'].includes(a.status)).length,
    thisWeek: assignments.filter(a => {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const assignmentDate = new Date(a.start_datetime)
      return assignmentDate >= weekStart && assignmentDate <= weekEnd
    }).length,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'offen':
        return 'bg-emerald-100 text-emerald-800'
      case 'in_arbeit':
        return 'bg-slate-100 text-slate-800'
      case 'fertig':
        return 'bg-slate-200 text-slate-700'
      case 'abgebrochen':
        return 'bg-rose-100 text-rose-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'offen':
        return 'Offen'
      case 'in_arbeit':
        return 'In Arbeit'
      case 'fertig':
        return 'Fertig'
      case 'abgebrochen':
        return 'Abgebrochen'
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'dringend':
        return 'bg-rose-100 text-rose-800'
      case 'hoch':
        return 'bg-amber-100 text-amber-800'
      case 'normal':
        return 'bg-slate-100 text-slate-800'
      case 'niedrig':
        return 'bg-slate-50 text-slate-600'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-slate-700" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-rose-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-start space-x-3 max-w-md">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">Fehler</p>
              <p className="text-sm text-rose-100">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="ml-auto">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 leading-relaxed">Einsatzplanung</h1>
          <p className="text-slate-600 mt-1 leading-relaxed">Verwalten Sie Einsätze und Teams</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Neuer Einsatz</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="all">Alle Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              <div className="flex space-x-2 bg-slate-50 p-1 rounded-lg">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                    filterStatus === 'all' ? 'bg-slate-700 text-white' : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Alle
                </button>
                <button
                  onClick={() => setFilterStatus('offen')}
                  className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                    filterStatus === 'offen' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Offen
                </button>
                <button
                  onClick={() => setFilterStatus('aktiv')}
                  className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                    filterStatus === 'aktiv' ? 'bg-slate-700 text-white' : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Aktiv
                </button>
                <button
                  onClick={() => setFilterStatus('fertig')}
                  className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                    filterStatus === 'fertig' ? 'bg-slate-600 text-white' : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Fertig
                </button>
              </div>
            </div>

            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              locale="de"
              firstDay={1}
              businessHours={{
                startTime: '06:00',
                endTime: '18:00',
              }}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={calendarEvents}
              editable={true}
              droppable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              height="auto"
              eventDisplay="block"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 leading-relaxed">Statistiken</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 leading-relaxed">Heute</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">{stats.today}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 leading-relaxed">Aktive Einsätze</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">{stats.active}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 leading-relaxed">Diese Woche</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">{stats.thisWeek}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <AssignmentModal
          title="Neuer Einsatz"
          assignment={newAssignment}
          setAssignment={setNewAssignment}
          teams={teams}
          vehicles={vehicles}
          tools={tools}
          onSave={createAssignment}
          onCancel={() => {
            setShowCreateModal(false)
            setNewAssignment({
              title: '',
              description: '',
              location: '',
              start_datetime: '',
              end_datetime: '',
              estimated_duration: '',
              team_id: '',
              vehicle_id: '',
              required_tools: [],
              priority: 'normal',
              notes: '',
            })
          }}
          saving={saving}
        />
      )}

      {showEditModal && (
        <AssignmentModal
          title="Einsatz bearbeiten"
          assignment={newAssignment}
          setAssignment={setNewAssignment}
          teams={teams}
          vehicles={vehicles}
          tools={tools}
          onSave={updateAssignment}
          onCancel={() => {
            setShowEditModal(false)
          }}
          saving={saving}
        />
      )}

      {showDetailsModal && selectedAssignment && (
        <DetailsModal
          assignment={selectedAssignment}
          teams={teams}
          vehicles={vehicles}
          tools={tools}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedAssignment(null)
          }}
          onEdit={openEditModal}
          onDelete={deleteAssignment}
          onStatusChange={(newStatus) => updateStatus(selectedAssignment.id, newStatus)}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
          getPriorityColor={getPriorityColor}
        />
      )}
    </div>
  )
}

function AssignmentModal({
  title,
  assignment,
  setAssignment,
  teams,
  vehicles,
  tools,
  onSave,
  onCancel,
  saving,
}: {
  title: string
  assignment: any
  setAssignment: (a: any) => void
  teams: Team[]
  vehicles: Vehicle[]
  tools: Tool[]
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-700 p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button
              onClick={onCancel}
              className="text-slate-300 hover:text-white hover:bg-slate-600 p-2 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Titel *
            </label>
            <input
              type="text"
              value={assignment.title}
              onChange={(e) => setAssignment({ ...assignment, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Beschreibung
            </label>
            <textarea
              value={assignment.description}
              onChange={(e) => setAssignment({ ...assignment, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Startdatum/-zeit *
              </label>
              <input
                type="datetime-local"
                value={assignment.start_datetime}
                onChange={(e) => setAssignment({ ...assignment, start_datetime: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Enddatum/-zeit
              </label>
              <input
                type="datetime-local"
                value={assignment.end_datetime}
                onChange={(e) => setAssignment({ ...assignment, end_datetime: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Team *
              </label>
              <select
                value={assignment.team_id}
                onChange={(e) => setAssignment({ ...assignment, team_id: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                required
              >
                <option value="">Bitte wählen</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Fahrzeug
              </label>
              <select
                value={assignment.vehicle_id}
                onChange={(e) => setAssignment({ ...assignment, vehicle_id: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="">Kein Fahrzeug</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate} {vehicle.manufacturer ? `(${vehicle.manufacturer})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Geschätzte Dauer (Stunden)
              </label>
              <input
                type="number"
                step="0.5"
                value={assignment.estimated_duration}
                onChange={(e) => setAssignment({ ...assignment, estimated_duration: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Priorität
              </label>
              <select
                value={assignment.priority}
                onChange={(e) => setAssignment({ ...assignment, priority: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="niedrig">Niedrig</option>
                <option value="normal">Normal</option>
                <option value="hoch">Hoch</option>
                <option value="dringend">Dringend</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Standort
            </label>
            <input
              type="text"
              value={assignment.location}
              onChange={(e) => setAssignment({ ...assignment, location: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Benötigte Werkzeuge
            </label>
            <div className="max-h-48 overflow-y-auto bg-slate-50 border-2 border-slate-300 rounded-lg p-4">
              {tools.map(tool => (
                <label key={tool.id} className="flex items-center space-x-2 py-2">
                  <input
                    type="checkbox"
                    checked={assignment.required_tools.includes(tool.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAssignment({ ...assignment, required_tools: [...assignment.required_tools, tool.id] })
                      } else {
                        setAssignment({ ...assignment, required_tools: assignment.required_tools.filter((id: string) => id !== tool.id) })
                      }
                    }}
                    className="w-4 h-4 text-slate-700 border-slate-300 rounded focus:ring-slate-500"
                  />
                  <span className="text-sm font-semibold text-slate-900">{tool.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Notizen
            </label>
            <textarea
              value={assignment.notes}
              onChange={(e) => setAssignment({ ...assignment, notes: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 bg-slate-700 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {saving ? (
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
              onClick={onCancel}
              disabled={saving}
              className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailsModal({
  assignment,
  teams,
  vehicles,
  tools,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
}: {
  assignment: Assignment
  teams: Team[]
  vehicles: Vehicle[]
  tools: Tool[]
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: string) => void
  getStatusColor: (status: string) => string
  getStatusLabel: (status: string) => string
  getPriorityColor: (priority: string) => string
}) {
  const requiredTools = tools.filter(t => assignment.required_tools?.includes(t.id))
  const assignedTeam = teams.find(t => t.id === assignment.team_id)
  const assignedVehicle = vehicles.find(v => v.id === assignment.vehicle_id)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-700 p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white">{assignment.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded ${getStatusColor(assignment.status)}`}>
                  {getStatusLabel(assignment.status)}
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded ${getPriorityColor(assignment.priority)}`}>
                  {assignment.priority}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white hover:bg-slate-600 p-2 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {assignment.description && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Beschreibung</h3>
              <p className="text-slate-900 leading-relaxed">{assignment.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Start</h3>
              <p className="text-slate-900">
                {new Date(assignment.start_datetime).toLocaleString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {assignment.end_datetime && (
              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Ende</h3>
                <p className="text-slate-900">
                  {new Date(assignment.end_datetime).toLocaleString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>

          {assignment.location && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Standort</h3>
              <p className="text-slate-900">{assignment.location}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedTeam && (
              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Team</h3>
                <div className="flex items-center space-x-2">
                  {assignedTeam.color && (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: assignedTeam.color }}
                    />
                  )}
                  <span className="text-slate-900 font-semibold">{assignedTeam.name}</span>
                </div>
              </div>
            )}

            {assignedVehicle && (
              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Fahrzeug</h3>
                <p className="text-slate-900 font-semibold">
                  {assignedVehicle.license_plate}
                  {assignedVehicle.manufacturer && ` (${assignedVehicle.manufacturer})`}
                </p>
              </div>
            )}
          </div>

          {requiredTools.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Benötigte Werkzeuge</h3>
              <div className="flex flex-wrap gap-2">
                {requiredTools.map(tool => (
                  <span
                    key={tool.id}
                    className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-sm font-semibold"
                  >
                    {tool.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {assignment.notes && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Notizen</h3>
              <p className="text-slate-900 leading-relaxed">{assignment.notes}</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Status ändern</label>
              <select
                value={assignment.status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="offen">Offen</option>
                <option value="in_arbeit">In Arbeit</option>
                <option value="fertig">Fertig</option>
                <option value="abgebrochen">Abgebrochen</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onEdit}
                className="flex-1 bg-slate-700 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-lg shadow-sm transition-colors"
              >
                Bearbeiten
              </button>
              {assignment.status === 'offen' && (
                <button
                  onClick={onDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors"
                >
                  Löschen
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

