'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestConnectionPage() {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing')
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState<any>(null)

  useEffect(() => {
    testConnection()
  }, [])

  async function testConnection() {
    setStatus('testing')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('Supabase URL:', supabaseUrl)
    console.log('Supabase Key exists:', !!supabaseKey)
    console.log('Supabase Key length:', supabaseKey?.length)

    if (!supabaseUrl || !supabaseKey) {
      setStatus('error')
      setMessage('Umgebungsvariablen nicht gesetzt!')
      setDetails({
        url: supabaseUrl || 'FEHLT',
        key: supabaseKey ? 'Gesetzt' : 'FEHLT'
      })
      return
    }

    try {
      // Test 1: Check auth session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
      }

      // Test 2: Try to fetch vehicles
      const { data: vehicleData, error: vehicleError, count } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact' })
        .limit(1)

      console.log('Vehicle query result:', { data: vehicleData, error: vehicleError, count })

      if (vehicleError) {
        setStatus('error')
        setMessage('Fehler bei Datenbankabfrage: ' + vehicleError.message)
        setDetails({
          code: vehicleError.code,
          hint: vehicleError.hint,
          details: vehicleError.details
        })
        return
      }

      // Test 3: Try to update a vehicle (dry run - immediately rollback)
      if (vehicleData && vehicleData.length > 0) {
        const testVehicle = vehicleData[0] as any
        const { error: updateError } = await (supabase
          .from('vehicles')
          .update as any)({ notes: testVehicle.notes })
          .eq('id', testVehicle.id)

        if (updateError) {
          setStatus('error')
          setMessage('Update-Test fehlgeschlagen: ' + updateError.message)
          setDetails(updateError)
          return
        }
      }

      setStatus('success')
      setMessage('Supabase-Verbindung funktioniert!')
      setDetails({
        url: supabaseUrl,
        vehicleCount: count,
        session: sessionData.session ? 'Angemeldet' : 'Nicht angemeldet',
        testsPassed: '✓ Auth ✓ Read ✓ Update'
      })

    } catch (err: any) {
      setStatus('error')
      setMessage('Unerwarteter Fehler: ' + err.message)
      setDetails(err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supabase Connection Test</h1>
          <p className="text-gray-600 mb-8">Überprüfung der Datenbankverbindung</p>

          <div className={`p-6 rounded-xl border-2 ${
            status === 'testing' ? 'border-blue-500 bg-blue-50' :
            status === 'success' ? 'border-green-500 bg-green-50' :
            'border-red-500 bg-red-50'
          }`}>
            <div className="flex items-start space-x-4">
              {status === 'testing' && (
                <svg className="animate-spin h-8 w-8 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {status === 'success' && (
                <svg className="h-8 w-8 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {status === 'error' && (
                <svg className="h-8 w-8 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div className="flex-1">
                <h3 className={`text-lg font-bold ${
                  status === 'testing' ? 'text-blue-900' :
                  status === 'success' ? 'text-green-900' :
                  'text-red-900'
                }`}>
                  {status === 'testing' ? 'Teste Verbindung...' :
                   status === 'success' ? 'Verbindung erfolgreich!' :
                   'Verbindung fehlgeschlagen'}
                </h3>
                <p className={`mt-1 ${
                  status === 'testing' ? 'text-blue-700' :
                  status === 'success' ? 'text-green-700' :
                  'text-red-700'
                }`}>
                  {message || 'Bitte warten...'}
                </p>
              </div>
            </div>
          </div>

          {details && (
            <div className="mt-6 bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">Details:</h3>
              <pre className="text-sm bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <h3 className="font-bold text-gray-900">Konfiguration:</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Supabase URL:</span>
                <span className="text-sm font-mono text-gray-900">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ NICHT GESETZT'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Anon Key:</span>
                <span className="text-sm font-mono text-gray-900">
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Gesetzt' : '❌ NICHT GESETZT'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={testConnection}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all"
            >
              Erneut testen
            </button>
            <a
              href="/dashboard/vehicles"
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-xl transition-all"
            >
              Zurück zu Vehicles
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

