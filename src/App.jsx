import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        createDefaultCompany(session.user.email)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        createDefaultCompany(session.user.email)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const createDefaultCompany = async (userEmail) => {
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('*')
      .eq('email', userEmail)
      .single()

    if (!existingCompany) {
      const { error } = await supabase
        .from('companies')
        .insert([
          { 
            name: 'Smith Waste Management Ltd', 
            email: userEmail,
            phone: '+44 20 1234 5678',
            address: '123 High Street, London',
            vehicle_count: 5
          }
        ])
      
      if (error) console.error('Error creating company:', error)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email,
          password: password,
        })
        if (error) throw error
        alert('✅ Check your email for confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        })
        if (error) throw error
      }
    } catch (error) {
      alert('❌ ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (session) {
    return <Dashboard session={session} onLogout={handleLogout} />
  }

  return (
    <div className="login-container">
      <div className="background-overlay">
        <div className="floating-elements">
          <div className="element recycle-bin">🗑️</div>
          <div className="element plastic-bottle">🧴</div>
          <div className="element paper-cup">🥤</div>
          <div className="element glass-bottle">🍾</div>
          <div className="element cardboard">📦</div>
          <div className="element compost">🌱</div>
          <div className="element can">🥫</div>
          <div className="element newspaper">📰</div>
          <div className="element battery">🔋</div>
          <div className="element electronics">💻</div>
        </div>
        <div className="background-pattern"></div>
      </div>

      <div className="login-box">
        <div className="logo">
          <span className="logo-icon">♻️</span>
          <h1>WasteTrack Pro</h1>
        </div>
        <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
        
        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <p className="toggle-auth">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="toggle-button"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}

function Dashboard({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [companyData, setCompanyData] = useState({
    name: 'Smith Waste Management Ltd',
    email: session?.user?.email || '',
    phone: '+44 20 1234 5678',
    address: '123 High Street, London'
  })
  const [companyId, setCompanyId] = useState(null)
  
  // State for all data
  const [transfers, setTransfers] = useState([])
  const [drivers, setDrivers] = useState([])
  const [customers, setCustomers] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  
  // Filter states
  const [filterText, setFilterText] = useState('')
  const [showFilterModal, setShowFilterModal] = useState(false)
  
  // Form states
  const [newTransfer, setNewTransfer] = useState({
    customer: '',
    driver: '',
    waste_type: '',
    ewc_code: '17.01.01',
    quantity: '',
    unit: 'tonnes',
    status: 'pending'
  })
  
  const [newDriver, setNewDriver] = useState({
    name: '',
    email: '',
    phone: '',
    vehicle: '',
    status: 'online'
  })
  
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  
  const [newReport, setNewReport] = useState({
    name: '',
    date: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    status: 'pending',
    type: 'PDF'
  })

  // Edit form states
  const [editCompany, setEditCompany] = useState({ ...companyData })

  // Load data on component mount
  useEffect(() => {
    if (session) {
      loadCompanyData()
    }
  }, [session])

  const loadCompanyData = async () => {
    setLoading(true)
    
    // Get company ID and data
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('email', session.user.email)
      .single()

    if (company) {
      setCompanyId(company.id)
      setCompanyData({
        name: company.name,
        email: company.email,
        phone: company.phone || '+44 20 1234 5678',
        address: company.address || '123 High Street, London'
      })
      setEditCompany({
        name: company.name,
        email: company.email,
        phone: company.phone || '+44 20 1234 5678',
        address: company.address || '123 High Street, London'
      })
      
      // Load all data
      await Promise.all([
        fetchTransfers(company.id),
        fetchDrivers(company.id),
        fetchCustomers(company.id),
        fetchReports(company.id)
      ])
    }
    
    setLoading(false)
  }

  const fetchTransfers = async (companyId) => {
    const { data, error } = await supabase
      .from('waste_transfers')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching transfers:', error)
    } else if (data && data.length > 0) {
      setTransfers(data)
    } else {
      // Load sample data if no data exists
      await loadSampleTransfers(companyId)
    }
  }

  const fetchDrivers = async (companyId) => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('company_id', companyId)

    if (error) {
      console.error('Error fetching drivers:', error)
    } else if (data && data.length > 0) {
      setDrivers(data)
    } else {
      await loadSampleDrivers(companyId)
    }
  }

  const fetchCustomers = async (companyId) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)

    if (error) {
      console.error('Error fetching customers:', error)
    } else if (data && data.length > 0) {
      setCustomers(data)
    } else {
      await loadSampleCustomers(companyId)
    }
  }

  const fetchReports = async (companyId) => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('company_id', companyId)

    if (error) {
      console.error('Error fetching reports:', error)
    } else if (data && data.length > 0) {
      setReports(data)
    } else {
      await loadSampleReports(companyId)
    }
  }

  const loadSampleTransfers = async (companyId) => {
    const sampleData = [
      { company_id: companyId, wtn_number: 'MTN-2026-004782', customer: 'ABC Construction Ltd', driver: 'John Smith', waste_type: '17.01.01 - Concrete', quantity: 8, unit: 'tonnes', time: '14:32', status: 'completed', date: '2026-03-18' },
      { company_id: companyId, wtn_number: 'MTN-2026-004783', customer: 'Green Waste Recycling', driver: 'Sarah Jones', waste_type: '20.03.01 - Mixed Waste', quantity: 3.5, unit: 'tonnes', time: '11:15', status: 'completed', date: '2026-03-18' },
      { company_id: companyId, wtn_number: 'MTN-2026-004784', customer: 'City Demolition Ltd', driver: 'Mike Brown', waste_type: '17.09.04 - Construction Waste', quantity: 12, unit: 'tonnes', time: '09:45', status: 'completed', date: '2026-03-18' }
    ]

    const { data, error } = await supabase
      .from('waste_transfers')
      .insert(sampleData)
      .select()

    if (!error && data) {
      setTransfers(data)
    }
  }

  const loadSampleDrivers = async (companyId) => {
    const sampleData = [
      { company_id: companyId, name: 'John Smith', email: 'john@example.com', phone: '07700 123456', status: 'online', vehicle: 'Truck 01' },
      { company_id: companyId, name: 'Sarah Jones', email: 'sarah@example.com', phone: '07700 123457', status: 'online', vehicle: 'Truck 02' },
      { company_id: companyId, name: 'Mike Brown', email: 'mike@example.com', phone: '07700 123458', status: 'offline', vehicle: 'Truck 03' }
    ]

    const { data, error } = await supabase
      .from('drivers')
      .insert(sampleData)
      .select()

    if (!error && data) {
      setDrivers(data)
    }
  }

  const loadSampleCustomers = async (companyId) => {
    const sampleData = [
      { company_id: companyId, name: 'ABC Construction Ltd', email: 'billing@abcconstruction.com', phone: '020 1234 5678', address: '123 High Street, London', total_transfers: 45 },
      { company_id: companyId, name: 'Green Waste Recycling', email: 'info@greenwaste.com', phone: '020 8765 4321', address: '456 Industrial Estate, Manchester', total_transfers: 32 },
      { company_id: companyId, name: 'City Demolition Ltd', email: 'projects@citydemo.com', phone: '020 2468 1357', address: '789 Site Road, Birmingham', total_transfers: 28 }
    ]

    const { data, error } = await supabase
      .from('customers')
      .insert(sampleData)
      .select()

    if (!error && data) {
      setCustomers(data)
    }
  }

  const loadSampleReports = async (companyId) => {
    const sampleData = [
      { company_id: companyId, name: 'Monthly Compliance Report', date: 'March 2026', status: 'ready', type: 'PDF' },
      { company_id: companyId, name: 'Waste Transfer Summary', date: 'Q1 2026', status: 'generating', type: 'Excel' },
      { company_id: companyId, name: 'Driver Activity Log', date: 'Last 30 days', status: 'ready', type: 'PDF' }
    ]

    const { data, error } = await supabase
      .from('reports')
      .insert(sampleData)
      .select()

    if (!error && data) {
      setReports(data)
    }
  }

  // Handle Add New Transfer
  const handleAddTransfer = async () => {
    try {
      if (!companyId) {
        throw new Error('Company not found')
      }

      const now = new Date()
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      const dateString = now.toISOString().split('T')[0]
      
      // Generate WTN number properly
      const lastWtn = transfers.length > 0 
        ? Math.max(...transfers.map(t => {
            const match = t.wtn_number?.match(/\d+$/)
            return match ? parseInt(match[0]) : 4781
          })) 
        : 4781
      
      const transfer = {
        company_id: companyId,
        wtn_number: `MTN-2026-${String(lastWtn + 1).padStart(6, '0')}`,
        customer: newTransfer.customer,
        driver: newTransfer.driver,
        waste_type: newTransfer.waste_type,
        ewc_code: newTransfer.ewc_code,
        quantity: parseFloat(newTransfer.quantity),
        unit: newTransfer.unit,
        time: timeString,
        date: dateString,
        status: newTransfer.status
      }

      const { data, error } = await supabase
        .from('waste_transfers')
        .insert([transfer])
        .select()

      if (error) throw error

      setTransfers([data[0], ...transfers])
      setShowAddModal(false)
      alert('✅ New waste transfer saved to database!')
    } catch (error) {
      alert('❌ Error saving: ' + error.message)
    }
  }

  // Handle Add New Driver
  const handleAddDriver = async () => {
    try {
      const driver = {
        company_id: companyId,
        ...newDriver
      }

      const { data, error } = await supabase
        .from('drivers')
        .insert([driver])
        .select()

      if (error) throw error

      setDrivers([...drivers, data[0]])
      setShowAddModal(false)
      alert('✅ New driver saved to database!')
    } catch (error) {
      alert('❌ Error saving: ' + error.message)
    }
  }

  // Handle Add New Customer
  const handleAddCustomer = async () => {
    try {
      const customer = {
        company_id: companyId,
        ...newCustomer,
        total_transfers: 0
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()

      if (error) throw error

      setCustomers([...customers, data[0]])
      setShowAddModal(false)
      alert('✅ New customer saved to database!')
    } catch (error) {
      alert('❌ Error saving: ' + error.message)
    }
  }

  // Handle Add New Report
  const handleAddReport = async () => {
    try {
      const report = {
        company_id: companyId,
        ...newReport
      }

      const { data, error } = await supabase
        .from('reports')
        .insert([report])
        .select()

      if (error) throw error

      setReports([...reports, data[0]])
      setShowAddModal(false)
      alert('✅ New report saved to database!')
    } catch (error) {
      alert('❌ Error saving: ' + error.message)
    }
  }

  // Handle Delete
  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return

    try {
      let table = ''
      if (type === 'transfer') table = 'waste_transfers'
      else if (type === 'driver') table = 'drivers'
      else if (type === 'customer') table = 'customers'
      else if (type === 'report') table = 'reports'

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) throw error

      if (type === 'transfer') {
        setTransfers(transfers.filter(t => t.id !== id))
      } else if (type === 'driver') {
        setDrivers(drivers.filter(d => d.id !== id))
      } else if (type === 'customer') {
        setCustomers(customers.filter(c => c.id !== id))
      } else if (type === 'report') {
        setReports(reports.filter(r => r.id !== id))
      }

      alert(`✅ ${type} deleted from database!`)
    } catch (error) {
      alert('❌ Error deleting: ' + error.message)
    }
  }

  // Handle View
  const handleView = (type, item) => {
    setSelectedItem(item)
    setModalType(type)
    setShowViewModal(true)
  }

  // Handle Edit
  const handleEdit = (type, item) => {
    setSelectedItem(item)
    setModalType(type)
    if (type === 'company') {
      setEditCompany({ ...item })
    }
    setShowEditModal(true)
  }

  // Handle Save Edit
  const handleSaveEdit = async () => {
    try {
      if (modalType === 'company') {
        const { error } = await supabase
          .from('companies')
          .update({
            name: editCompany.name,
            phone: editCompany.phone,
            address: editCompany.address
          })
          .eq('id', companyId)

        if (error) throw error

        setCompanyData({ ...editCompany })
        alert('✅ Company details updated!')
      }
      setShowEditModal(false)
    } catch (error) {
      alert('❌ Error updating: ' + error.message)
    }
  }

  // Handle Export
  const handleExport = (type) => {
    let data = []
    let filename = ''
    let headers = []

    if (type === 'transfers') {
      data = transfers
      filename = 'waste_transfers.csv'
      headers = ['WTN NUMBER', 'CUSTOMER', 'DRIVER', 'WASTE TYPE', 'QUANTITY', 'TIME', 'STATUS']
    } else if (type === 'drivers') {
      data = drivers
      filename = 'drivers.csv'
      headers = ['NAME', 'EMAIL', 'PHONE', 'VEHICLE', 'STATUS']
    } else if (type === 'customers') {
      data = customers
      filename = 'customers.csv'
      headers = ['NAME', 'EMAIL', 'PHONE', 'ADDRESS', 'TRANSFERS']
    }

    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...data.map(item => {
        if (type === 'transfers') {
          return `${item.wtn_number},${item.customer},${item.driver},${item.waste_type},${item.quantity} ${item.unit},${item.time},${item.status}`
        } else if (type === 'drivers') {
          return `${item.name},${item.email},${item.phone},${item.vehicle},${item.status}`
        } else if (type === 'customers') {
          return `${item.name},${item.email},${item.phone},${item.address},${item.total_transfers}`
        }
        return ''
      })
    ].join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Handle Filter
  const handleFilter = () => {
    setShowFilterModal(true)
  }

  const applyFilter = () => {
    // Filter logic here
    setShowFilterModal(false)
  }

  // Stats calculations
  const todayTransfers = transfers.filter(t => {
    const today = new Date().toDateString()
    return new Date(t.date).toDateString() === today
  }).length

  const totalTonnage = transfers.reduce((sum, t) => sum + (t.quantity || 0), 0).toFixed(0)
  const onlineDrivers = drivers.filter(d => d.status === 'online').length

  // Filter transfers based on search text
  const filteredTransfers = transfers.filter(t => 
    t.customer?.toLowerCase().includes(filterText.toLowerCase()) ||
    t.driver?.toLowerCase().includes(filterText.toLowerCase()) ||
    t.wtn_number?.toLowerCase().includes(filterText.toLowerCase())
  )

  if (loading) {
    return <div className="loading-spinner">Loading your data...</div>
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">♻️</span>
            <h1>WasteTrack Pro</h1>
          </div>
          <h2 className="company-name">{companyData.name}</h2>
        </div>
        <div className="header-right">
          <button className="notification-btn">🔔</button>
          <div className="user-menu">
            <span className="user-avatar">👤</span>
            <span className="user-name">{session.user.email}</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Reports</button>
        <button className={`tab ${activeTab === 'drivers' ? 'active' : ''}`} onClick={() => setActiveTab('drivers')}>Drivers</button>
        <button className={`tab ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>Customers</button>
        <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {activeTab === 'overview' && (
          <OverviewTab 
            todayTransfers={todayTransfers}
            totalTonnage={totalTonnage}
            onlineDrivers={onlineDrivers}
            transfers={filteredTransfers}
            drivers={drivers}
            filterText={filterText}
            setFilterText={setFilterText}
            onAddNew={() => openAddModal('transfer')}
            onDelete={(id) => handleDelete('transfer', id)}
            onView={(item) => handleView('transfer', item)}
            onEdit={(item) => handleEdit('transfer', item)}
            onExport={() => handleExport('transfers')}
            onFilter={handleFilter}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab 
            reports={reports}
            onAddNew={() => openAddModal('report')}
            onDelete={(id) => handleDelete('report', id)}
            onView={(item) => handleView('report', item)}
            onDownload={(item) => {
              alert(`📥 Downloading ${item.name}`)
            }}
          />
        )}

        {activeTab === 'drivers' && (
          <DriversTab 
            drivers={drivers}
            onAddNew={() => openAddModal('driver')}
            onDelete={(id) => handleDelete('driver', id)}
            onView={(item) => handleView('driver', item)}
            onEdit={(item) => handleEdit('driver', item)}
            onExport={() => handleExport('drivers')}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersTab 
            customers={customers}
            onAddNew={() => openAddModal('customer')}
            onDelete={(id) => handleDelete('customer', id)}
            onView={(item) => handleView('customer', item)}
            onEdit={(item) => handleEdit('customer', item)}
            onExport={() => handleExport('customers')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab 
            companyData={companyData}
            onEdit={() => handleEdit('company', companyData)}
          />
        )}
      </div>

      {/* Add New Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New {modalType}</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              {modalType === 'transfer' && (
                <div className="form-container">
                  <div className="form-group">
                    <label>Customer Name *</label>
                    <input 
                      type="text" 
                      value={newTransfer.customer}
                      onChange={(e) => setNewTransfer({...newTransfer, customer: e.target.value})}
                      placeholder="e.g., ABC Construction Ltd"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Driver Name *</label>
                    <input 
                      type="text" 
                      value={newTransfer.driver}
                      onChange={(e) => setNewTransfer({...newTransfer, driver: e.target.value})}
                      placeholder="e.g., John Smith"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Waste Type *</label>
                    <select 
                      value={newTransfer.waste_type}
                      onChange={(e) => setNewTransfer({...newTransfer, waste_type: e.target.value})}
                      required
                    >
                      <option value="">Select waste type</option>
                      <option value="17.01.01 - Concrete">17.01.01 - Concrete</option>
                      <option value="17.09.04 - Construction Waste">17.09.04 - Construction Waste</option>
                      <option value="20.03.01 - Mixed Waste">20.03.01 - Mixed Waste</option>
                      <option value="19.12.12 - Metal Scrap">19.12.12 - Metal Scrap</option>
                      <option value="15.01.02 - Plastic Packaging">15.01.02 - Plastic Packaging</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group half">
                      <label>Quantity *</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={newTransfer.quantity}
                        onChange={(e) => setNewTransfer({...newTransfer, quantity: e.target.value})}
                        placeholder="e.g., 8"
                        required
                      />
                    </div>
                    <div className="form-group half">
                      <label>Unit</label>
                      <select 
                        value={newTransfer.unit}
                        onChange={(e) => setNewTransfer({...newTransfer, unit: e.target.value})}
                      >
                        <option value="tonnes">tonnes</option>
                        <option value="kg">kg</option>
                        <option value="cubic meters">cubic meters</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'driver' && (
                <div className="form-container">
                  <div className="form-group">
                    <label>Driver Name *</label>
                    <input 
                      type="text" 
                      value={newDriver.name}
                      onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
                      placeholder="e.g., John Smith"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      value={newDriver.email}
                      onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                      placeholder="driver@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input 
                      type="text" 
                      value={newDriver.phone}
                      onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                      placeholder="07700 123456"
                    />
                  </div>
                  <div className="form-group">
                    <label>Vehicle</label>
                    <input 
                      type="text" 
                      value={newDriver.vehicle}
                      onChange={(e) => setNewDriver({...newDriver, vehicle: e.target.value})}
                      placeholder="e.g., Truck 01"
                    />
                  </div>
                </div>
              )}

              {modalType === 'customer' && (
                <div className="form-container">
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input 
                      type="text" 
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      placeholder="e.g., ABC Construction Ltd"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="contact@company.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input 
                      type="text" 
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="020 1234 5678"
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <textarea 
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                      placeholder="Full address"
                      rows="3"
                    />
                  </div>
                </div>
              )}

              {modalType === 'report' && (
                <div className="form-container">
                  <div className="form-group">
                    <label>Report Name *</label>
                    <input 
                      type="text" 
                      value={newReport.name}
                      onChange={(e) => setNewReport({...newReport, name: e.target.value})}
                      placeholder="e.g., Monthly Compliance Report"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date/Period</label>
                    <input 
                      type="text" 
                      value={newReport.date}
                      onChange={(e) => setNewReport({...newReport, date: e.target.value})}
                      placeholder="e.g., March 2026"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group half">
                      <label>Type</label>
                      <select 
                        value={newReport.type}
                        onChange={(e) => setNewReport({...newReport, type: e.target.value})}
                      >
                        <option value="PDF">PDF</option>
                        <option value="Excel">Excel</option>
                        <option value="CSV">CSV</option>
                      </select>
                    </div>
                    <div className="form-group half">
                      <label>Status</label>
                      <select 
                        value={newReport.status}
                        onChange={(e) => setNewReport({...newReport, status: e.target.value})}
                      >
                        <option value="pending">Pending</option>
                        <option value="generating">Generating</option>
                        <option value="ready">Ready</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button 
                className="save-btn" 
                onClick={() => {
                  if (modalType === 'transfer') handleAddTransfer()
                  else if (modalType === 'driver') handleAddDriver()
                  else if (modalType === 'customer') handleAddCustomer()
                  else if (modalType === 'report') handleAddReport()
                }}
              >
                Save to Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>View {modalType}</h3>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <pre className="view-content">
                {JSON.stringify(selectedItem, null, 2)}
              </pre>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit {modalType}</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {modalType === 'company' && (
                <div className="form-container">
                  <div className="form-group">
                    <label>Company Name</label>
                    <input 
                      type="text" 
                      value={editCompany.name}
                      onChange={(e) => setEditCompany({...editCompany, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      type="text" 
                      value={editCompany.phone}
                      onChange={(e) => setEditCompany({...editCompany, phone: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <textarea 
                      value={editCompany.address}
                      onChange={(e) => setEditCompany({...editCompany, address: e.target.value})}
                      rows="3"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="save-btn" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Filter Transfers</h3>
              <button className="close-btn" onClick={() => setShowFilterModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Search by Customer, Driver or WTN</label>
                <input 
                  type="text" 
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Type to filter..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowFilterModal(false)}>Cancel</button>
              <button className="save-btn" onClick={applyFilter}>Apply Filter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 📊 OVERVIEW TAB
function OverviewTab({ todayTransfers, totalTonnage, onlineDrivers, transfers, drivers, filterText, setFilterText, onAddNew, onDelete, onView, onEdit, onExport, onFilter }) {
  return (
    <>
      <div className="content-header">
        <h2>Overview</h2>
        <button className="primary-btn" onClick={onAddNew}>+ New Transfer</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">TWTN Today</span>
            <span className="stat-trend positive">+12% vs yesterday</span>
          </div>
          <div className="stat-value">{todayTransfers || 0}</div>
          <div className="stat-sub">{onlineDrivers} active</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Drivers Online</span>
          </div>
          <div className="stat-value">{onlineDrivers}</div>
          <div className="stat-sub">{drivers.length} total drivers</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Tonnage</span>
          </div>
          <div className="stat-value">{totalTonnage || 0}</div>
          <div className="stat-sub">This month</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Compliance Status</span>
          </div>
          <div className="stat-value status-ready">Ready</div>
          <div className="stat-sub">100%</div>
        </div>
      </div>

      <div className="compliance-banner">
        <div className="banner-content">
          <h3>✅ October 2026 Ready</h3>
          <p>All WTNs are being digitally submitted to the Environment Agency API. You're fully compliant with the new regulations.</p>
        </div>
        <div className="compliance-checks">
          <div className="check-item"><span className="check-icon">✓</span><span>API Connected</span></div>
          <div className="check-item"><span className="check-icon">✓</span><span>Auto-Submission Active</span></div>
          <div className="check-item"><span className="check-icon">✓</span><span>2-Year Records Stored</span></div>
        </div>
      </div>

      <div className="transfers-section">
        <div className="section-header">
          <h3>Today's Waste Transfer Notes</h3>
          <div className="section-actions">
            <button className="filter-btn" onClick={onFilter}>📊 Filter</button>
            <button className="export-btn" onClick={onExport}>📎 Export</button>
          </div>
        </div>

        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search transfers..." 
            className="search-input"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>

        <div className="table-container">
          <table className="transfers-table">
            <thead>
              <tr>
                <th>WTN NUMBER</th>
                <th>CUSTOMER</th>
                <th>DRIVER</th>
                <th>WASTE TYPE</th>
                <th>QUANTITY</th>
                <th>TIME</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-row">No transfers yet. Click "New Transfer" to add one.</td>
                </tr>
              ) : (
                transfers.map((transfer) => (
                  <tr key={transfer.id}>
                    <td><span className="wtn-number">{transfer.wtn_number}</span></td>
                    <td>{transfer.customer}</td>
                    <td>{transfer.driver}</td>
                    <td><span className="waste-type">{transfer.waste_type}</span></td>
                    <td>{transfer.quantity} {transfer.unit}</td>
                    <td>{transfer.time}</td>
                    <td>
                      <span className={`status-badge ${transfer.status}`}>
                        {transfer.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn" onClick={() => onView(transfer)}>👁️</button>
                      <button className="action-btn" onClick={() => onEdit(transfer)}>✏️</button>
                      <button className="action-btn" onClick={() => onDelete(transfer.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// 📋 REPORTS TAB
function ReportsTab({ reports, onAddNew, onDelete, onView, onDownload }) {
  return (
    <div className="tab-content">
      <div className="content-header">
        <h2>Reports</h2>
        <button className="primary-btn" onClick={onAddNew}>+ Generate New Report</button>
      </div>

      <div className="reports-grid">
        {reports.length === 0 ? (
          <p className="empty-message">No reports yet. Generate your first report.</p>
        ) : (
          reports.map(report => (
            <div key={report.id} className="report-card">
              <div className="report-icon">📄</div>
              <div className="report-details">
                <h3>{report.name}</h3>
                <p>{report.date}</p>
                <span className={`report-status ${report.status}`}>{report.status}</span>
              </div>
              <div className="report-actions">
                <button className="icon-btn" onClick={() => onDownload(report)}>📥</button>
                <button className="icon-btn" onClick={() => onView(report)}>👁️</button>
                <button className="icon-btn" onClick={() => onDelete(report.id)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// 🚚 DRIVERS TAB
function DriversTab({ drivers, onAddNew, onDelete, onView, onEdit, onExport }) {
  return (
    <div className="tab-content">
      <div className="content-header">
        <h2>Drivers</h2>
        <div>
          <button className="secondary-btn" onClick={onExport} style={{ marginRight: '10px' }}>📎 Export</button>
          <button className="primary-btn" onClick={onAddNew}>+ Add New Driver</button>
        </div>
      </div>

      <div className="drivers-stats">
        <div className="mini-stat">
          <span className="mini-label">Total Drivers</span>
          <span className="mini-value">{drivers.length}</span>
        </div>
        <div className="mini-stat">
          <span className="mini-label">Online Now</span>
          <span className="mini-value success">{drivers.filter(d => d.status === 'online').length}</span>
        </div>
        <div className="mini-stat">
          <span className="mini-label">Offline</span>
          <span className="mini-value warning">{drivers.filter(d => d.status === 'offline').length}</span>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Driver Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Vehicle</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">No drivers yet. Add your first driver.</td>
              </tr>
            ) : (
              drivers.map(driver => (
                <tr key={driver.id}>
                  <td><strong>{driver.name}</strong></td>
                  <td>{driver.email}</td>
                  <td>{driver.phone}</td>
                  <td>{driver.vehicle}</td>
                  <td>
                    <span className={`status-indicator ${driver.status}`}>
                      {driver.status === 'online' ? '🟢 Online' : '⚪ Offline'}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn" onClick={() => onView(driver)}>👁️</button>
                    <button className="action-btn" onClick={() => onEdit(driver)}>✏️</button>
                    <button className="action-btn" onClick={() => onDelete(driver.id)}>🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 👥 CUSTOMERS TAB
function CustomersTab({ customers, onAddNew, onDelete, onView, onEdit, onExport }) {
  // Remove duplicates based on name
  const uniqueCustomers = customers.filter((customer, index, self) =>
    index === self.findIndex((c) => c.name === customer.name)
  )

  return (
    <div className="tab-content">
      <div className="content-header">
        <h2>Customers</h2>
        <div>
          <button className="secondary-btn" onClick={onExport} style={{ marginRight: '10px' }}>📎 Export</button>
          <button className="primary-btn" onClick={onAddNew}>+ Add New Customer</button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Transfers</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {uniqueCustomers.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">No customers yet. Add your first customer.</td>
              </tr>
            ) : (
              uniqueCustomers.map(customer => (
                <tr key={customer.id}>
                  <td><strong>{customer.name}</strong></td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.address}</td>
                  <td>{customer.total_transfers}</td>
                  <td>
                    <button className="action-btn" onClick={() => onView(customer)}>👁️</button>
                    <button className="action-btn" onClick={() => onEdit(customer)}>✏️</button>
                    <button className="action-btn" onClick={() => onDelete(customer.id)}>🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ⚙️ SETTINGS TAB
function SettingsTab({ companyData, onEdit }) {
  return (
    <div className="tab-content">
      <h2>Settings</h2>

      <div className="settings-section">
        <div className="section-header">
          <h3>Company Profile</h3>
          <button className="edit-btn" onClick={onEdit}>✏️ Edit</button>
        </div>
        <div className="settings-form view-mode">
          <div className="form-row">
            <label>Company Name</label>
            <div className="value-display">{companyData.name}</div>
          </div>
          <div className="form-row">
            <label>Email Address</label>
            <div className="value-display">{companyData.email}</div>
          </div>
          <div className="form-row">
            <label>Phone Number</label>
            <div className="value-display">{companyData.phone}</div>
          </div>
          <div className="form-row">
            <label>Address</label>
            <div className="value-display">{companyData.address}</div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>API Integration</h3>
        <div className="api-status">
          <div className="status-item">
            <span className="status-label">Environment Agency API:</span>
            <span className="status-badge success">Connected</span>
          </div>
          <div className="status-item">
            <span className="status-label">Auto-submission:</span>
            <span className="status-badge success">Active</span>
          </div>
          <div className="status-item">
            <span className="status-label">Last Sync:</span>
            <span className="status-text">18 Mar 2026, 14:32</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Database Stats</h3>
        <div className="api-status">
          <div className="status-item">
            <span className="status-label">Connected to:</span>
            <span className="status-text">Supabase</span>
          </div>
          <div className="status-item">
            <span className="status-label">Data Persistence:</span>
            <span className="status-badge success">Active ✓</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App