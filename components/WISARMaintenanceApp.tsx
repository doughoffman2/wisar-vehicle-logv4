'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, CheckCircle, AlertTriangle, Truck, Ship, Wrench, Users, FileText, Cross } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const vehicles = [
  { id: 'pump-truck', name: 'Large Pump Truck - BIG RED', type: 'fire', icon: Truck, status: 'operational', hasPump: true, lastTest: '2025-07-25' },
  { id: 'kubota-fire', name: 'Kubota Fire Truck', type: 'fire', icon: Truck, status: 'operational', hasPump: true, lastTest: '2025-07-25' },
  { id: 'gator-fire', name: 'Gator Fire Truck', type: 'fire', icon: Truck, status: 'operational', hasPump: true, lastTest: '2025-07-25' },
  { id: 'ambulance-2018', name: '2018 Kubota Ambulance', type: 'ems', icon: Cross, status: 'operational', hasPump: false, lastTest: '2025-07-25' },
  { id: 'ambulance-new', name: 'New Ambulance (2024)', type: 'ems', icon: Cross, status: 'operational', hasPump: false, lastTest: '2025-07-25' },
  { id: 'boat-rescue', name: 'Rescue Boat', type: 'marine', icon: Ship, status: 'operational', hasPump: false, lastTest: '2025-07-25' },
  { id: 'utv-rescue', name: 'UTV Rescue', type: 'rescue', icon: Truck, status: 'operational', hasPump: false, lastTest: '2025-07-25' },
]

const defaultDrivers = ['Scott', 'Kevin', 'Doug', 'Dale', 'Mark W', 'Mark S', 'Julia', 'Racheal']

type MaintenanceLog = {
  id?: string
  vehicle_id: string
  date: string
  type: string
  description: string
  technician: string
  mileage?: number
  next_service?: string
  created_at?: string
}

type InspectionLog = {
  id?: string
  vehicle_id: string
  date: string
  driver: string
  week: string
  notes?: string
  passed: boolean
  created_at?: string
}

export default function WISARMaintenanceApp() {
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0].id)
  const [currentWeek, setCurrentWeek] = useState(new Date().toISOString().split('T')[0])
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [inspectionLogs, setInspectionLogs] = useState<InspectionLog[]>([])
  const [dashboardView, setDashboardView] = useState('fleet')
  const [drivers, setDrivers] = useState<string[]>(defaultDrivers)
  const [newDriverName, setNewDriverName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [maintenanceForm, setMaintenanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'routine', description: '', technician: '', mileage: '', next_service: ''
  })
  const [inspectionForm, setInspectionForm] = useState({ driver: '', notes: '', passed: true })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [maintResult, inspResult, driversResult] = await Promise.all([
        supabase.from('maintenance_logs').select('*').order('date', { ascending: false }),
        supabase.from('inspection_logs').select('*').order('date', { ascending: false }),
        supabase.from('drivers').select('*').order('name')
      ])
      if (maintResult.data) setMaintenanceLogs(maintResult.data)
      if (inspResult.data) setInspectionLogs(inspResult.data)
      if (driversResult.data && driversResult.data.length > 0) {
        setDrivers(driversResult.data.map((d: { name: string }) => d.name))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addMaintenanceLog() {
    if (!maintenanceForm.description || !maintenanceForm.technician) return
    setSaving(true)
    const newLog: MaintenanceLog = {
      vehicle_id: selectedVehicle, date: maintenanceForm.date, type: maintenanceForm.type,
      description: maintenanceForm.description, technician: maintenanceForm.technician,
      mileage: maintenanceForm.mileage ? parseInt(maintenanceForm.mileage) : undefined,
      next_service: maintenanceForm.next_service || undefined
    }
    const { data, error } = await supabase.from('maintenance_logs').insert([newLog]).select()
    if (!error && data) {
      setMaintenanceLogs(prev => [data[0], ...prev])
      setMaintenanceForm({ date: new Date().toISOString().split('T')[0], type: 'routine', description: '', technician: '', mileage: '', next_service: '' })
    }
    setSaving(false)
  }

  async function addInspectionLog() {
    if (!inspectionForm.driver) return
    setSaving(true)
    const newLog: InspectionLog = {
      vehicle_id: selectedVehicle, date: new Date().toISOString().split('T')[0],
      driver: inspectionForm.driver, week: currentWeek,
      notes: inspectionForm.notes || undefined, passed: inspectionForm.passed
    }
    const { data, error } = await supabase.from('inspection_logs').insert([newLog]).select()
    if (!error && data) {
      setInspectionLogs(prev => [data[0], ...prev])
      setInspectionForm({ driver: '', notes: '', passed: true })
    }
    setSaving(false)
  }

  async function addDriver() {
    if (!newDriverName.trim()) return
    const { error } = await supabase.from('drivers').insert([{ name: newDriverName.trim() }])
    if (!error) { setDrivers(prev => [...prev, newDriverName.trim()]); setNewDriverName('') }
  }

  function getDaysOverdue(lastTest: string) {
    const diffTime = new Date().getTime() - new Date(lastTest).getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle)!

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading WISAR Vehicle Data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-900 text-white p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wrench className="h-6 w-6" />
          <h1 className="text-2xl font-bold">WISAR Vehicle Log</h1>
        </div>
        <p className="text-center text-blue-200 text-sm">Water Island S&R</p>
        <div className="flex justify-center gap-2 mt-3 flex-wrap">
          {['fleet', 'maintenance', 'inspection', 'drivers'].map(view => (
            <button key={view} onClick={() => setDashboardView(view)}
              className={`px-4 py-1 rounded text-sm font-medium ${dashboardView === view ? 'bg-white text-blue-900' : 'bg-blue-800 text-white'}`}>
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {dashboardView === 'fleet' && (
          <div>
            <h2 className="text-xl font-bold text-center mb-4 flex items-center justify-center gap-2">
              <Wrench className="h-5 w-5" /> WISAR Fleet Status
            </h2>
            <div className="grid gap-3">
              {vehicles.map(vehicle => {
                const VehicleIcon = vehicle.icon
                const daysOverdue = getDaysOverdue(vehicle.lastTest)
                const logs = maintenanceLogs.filter(l => l.vehicle_id === vehicle.id)
                const inspections = inspectionLogs.filter(l => l.vehicle_id === vehicle.id)
                return (
                  <div key={vehicle.id} className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition"
                    onClick={() => { setSelectedVehicle(vehicle.id); setDashboardView('maintenance') }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <VehicleIcon className="h-6 w-6 text-blue-800" />
                        <span className="font-semibold">{vehicle.name}</span>
                      </div>
                      <div className="text-right">
                        {daysOverdue > 180 ? (
                          <span className="text-red-600 font-bold flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />{daysOverdue}d OVERDUE
                          </span>
                        ) : (
                          <span className="text-green-600 font-bold flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />OK
                          </span>
                        )}
                        {vehicle.hasPump && <div className="text-xs text-gray-500">PUMP</div>}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <span>Last Test: {vehicle.lastTest}</span>
                      <span className="ml-4">{logs.length} maintenance records</span>
                      <span className="ml-4">{inspections.length} inspections</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {dashboardView === 'maintenance' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Wrench className="h-5 w-5" />Maintenance Log</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Vehicle</label>
              <select className="w-full p-2 border rounded" value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h3 className="font-semibold mb-3">Add Maintenance Record</h3>
              <div className="grid gap-3">
                <input type="date" value={maintenanceForm.date} onChange={e => setMaintenanceForm(p => ({...p, date: e.target.value}))} className="border rounded p-2" />
                <select value={maintenanceForm.type} onChange={e => setMaintenanceForm(p => ({...p, type: e.target.value}))} className="border rounded p-2">
                  <option value="routine">Routine Service</option>
                  <option value="repair">Repair</option>
                  <option value="inspection">Inspection</option>
                  <option value="pump-test">Pump Test</option>
                  <option value="oil">Oil Change</option>
                  <option value="tire">Tire Service</option>
                  <option value="other">Other</option>
                </select>
                <textarea placeholder="Description..." value={maintenanceForm.description}
                  onChange={e => setMaintenanceForm(p => ({...p, description: e.target.value}))}
                  className="border rounded p-2 h-20" />
                <select value={maintenanceForm.technician} onChange={e => setMaintenanceForm(p => ({...p, technician: e.target.value}))} className="border rounded p-2">
                  <option value="">Select Technician...</option>
                  {drivers.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input type="number" placeholder="Mileage/Hours (optional)" value={maintenanceForm.mileage}
                  onChange={e => setMaintenanceForm(p => ({...p, mileage: e.target.value}))} className="border rounded p-2" />
                <input type="date" value={maintenanceForm.next_service}
                  onChange={e => setMaintenanceForm(p => ({...p, next_service: e.target.value}))} className="border rounded p-2" />
                <button onClick={addMaintenanceLog} disabled={saving || !maintenanceForm.description || !maintenanceForm.technician}
                  className="bg-blue-900 text-white py-2 rounded disabled:opacity-50 font-semibold">
                  {saving ? 'Saving...' : 'Add Maintenance Record'}
                </button>
              </div>
            </div>
            <h3 className="font-semibold mb-2">History for {selectedVehicleData.name}</h3>
            {maintenanceLogs.filter(l => l.vehicle_id === selectedVehicle).length === 0 ? (
              <p className="text-gray-500 text-sm">No maintenance records yet.</p>
            ) : maintenanceLogs.filter(l => l.vehicle_id === selectedVehicle).map(log => (
              <div key={log.id} className="bg-white rounded shadow p-3 mb-2">
                <div className="flex justify-between">
                  <span className="font-medium capitalize">{log.type.replace('-', ' ')}</span>
                  <span className="text-sm text-gray-500">{log.date}</span>
                </div>
                <p className="text-sm mt-1">{log.description}</p>
                <p className="text-xs text-gray-400 mt-1">Tech: {log.technician}{log.mileage ? ' | ' + log.mileage + ' hrs/mi' : ''}</p>
              </div>
            ))}
          </div>
        )}

        {dashboardView === 'inspection' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText className="h-5 w-5" />Weekly Inspections</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Vehicle</label>
              <select className="w-full p-2 border rounded" value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Week of</label>
              <input type="date" value={currentWeek} onChange={e => setCurrentWeek(e.target.value)} className="border rounded p-2 w-full" />
            </div>
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h3 className="font-semibold mb-3">Log Weekly Inspection</h3>
              <div className="grid gap-3">
                <select value={inspectionForm.driver} onChange={e => setInspectionForm(p => ({...p, driver: e.target.value}))} className="border rounded p-2">
                  <option value="">Select Driver...</option>
                  {drivers.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <div className="flex items-center gap-3">
                  <label className="font-medium">Passed?</label>
                  <button onClick={() => setInspectionForm(p => ({...p, passed: !p.passed}))}
                    className={`px-4 py-1 rounded font-bold ${inspectionForm.passed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {inspectionForm.passed ? '✓ PASS' : '✗ FAIL'}
                  </button>
                </div>
                <textarea placeholder="Notes (optional)..." value={inspectionForm.notes}
                  onChange={e => setInspectionForm(p => ({...p, notes: e.target.value}))} className="border rounded p-2 h-16" />
                <button onClick={addInspectionLog} disabled={saving || !inspectionForm.driver}
                  className="bg-blue-900 text-white py-2 rounded disabled:opacity-50 font-semibold">
                  {saving ? 'Saving...' : 'Log Inspection'}
                </button>
              </div>
            </div>
            <h3 className="font-semibold mb-2">Inspection History for {selectedVehicleData.name}</h3>
            {inspectionLogs.filter(l => l.vehicle_id === selectedVehicle).length === 0 ? (
              <p className="text-gray-500 text-sm">No inspection records yet.</p>
            ) : inspectionLogs.filter(l => l.vehicle_id === selectedVehicle).map(log => (
              <div key={log.id} className="bg-white rounded shadow p-3 mb-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Week of {log.week}</span>
                  <span className={`text-sm font-bold ${log.passed ? 'text-green-600' : 'text-red-600'}`}>{log.passed ? '✓ PASS' : '✗ FAIL'}</span>
                </div>
                <p className="text-xs text-gray-500">Driver: {log.driver} | Date: {log.date}</p>
                {log.notes && <p className="text-sm mt-1">{log.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {dashboardView === 'drivers' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="h-5 w-5" />Driver Management</h2>
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h3 className="font-semibold mb-3">Add Driver</h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Driver name..." value={newDriverName}
                  onChange={e => setNewDriverName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addDriver()} className="flex-1 border rounded p-2" />
                <button onClick={addDriver} className="bg-blue-900 text-white px-4 rounded font-semibold">Add</button>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Current Drivers ({drivers.length})</h3>
              <div className="grid grid-cols-2 gap-2">
                {drivers.map(driver => (
                  <div key={driver} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Users className="h-4 w-4 text-blue-800" />
                    <span>{driver}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
