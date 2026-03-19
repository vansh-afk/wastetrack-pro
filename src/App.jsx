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

  const [editCompany, setEditCompany] = useState({ ...companyData })

  // Load data on component mount
  useEffect(() => {
    if (session) {
      loadCompanyData()
    }
  }, [session])

  const loadCompanyData = async () => {
    setLoading(true)
    
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

    if (!error && data) {
      setTransfers(data)
    }
  }

  const fetchDrivers = async (companyId) => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('company_id', companyId)

    if (!error && data) {
      setDrivers(data)
    }
  }

  const fetchCustomers = async (companyId) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId)

    if (!error && data) {
      setCustomers(data)
    }
  }

  const fetchReports = async (companyId) => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('company_id', companyId)

    if (!error && data) {
      setReports(data)
    }
  }

  // ========== MODAL OPEN FUNCTIONS ==========
  const openAddModal = (type) => {
    setModalType(type)
    setShowAddModal(true)
    
    // Reset forms
    if (type === 'transfer') {
      setNewTransfer({
        customer: '',
        driver: '',
        waste_type: '',
        ewc_code: '17.01.01',
        quantity: '',
        unit: 'tonnes',
        status: 'pending'
      })
    } else if (type === 'driver') {
      setNewDriver({
        name: '',
        email: '',
        phone: '',
        vehicle: '',
        status: 'online'
      })
    } else if (type === 'customer') {
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: ''
      })
    } else if (type === 'report') {
      setNewReport({
        name: '',
        date: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        status: 'pending',
        type: 'PDF'
      })
    }
  }

  // ========== HANDLE ADD NEW TRANSFER ==========
  const handleAddTransfer = async () => {
    try {
      if (!companyId) throw new Error('Company not found')

      const now = new Date()
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      const dateString = now.toISOString().split('T')[0]
      
      // Generate WTN number
      let lastNum = 4781
      if (transfers.length > 0) {
        const numbers = transfers.map(t => {
          const parts = t.wtn_number?.split('-')
          return parts?.length === 3 ? parseInt(parts[2]) : 0
        })
        lastNum = Math.max(...numbers, 4781)
      }
      
      const transfer = {
        company_id: companyId,
        wtn_number: `MTN-2026-${(lastNum + 1).toString().padStart(6, '0')}`,
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
      alert('❌ Error: ' + error.message)
    }
  }

  // ========== HANDLE ADD NEW DRIVER ==========
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
      alert('❌ Error: ' + error.message)
    }
  }

  // ========== HANDLE ADD NEW CUSTOMER ==========
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
      alert('❌ Error: ' + error.message)
    }
  }

  // ========== HANDLE ADD NEW REPORT ==========
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
      alert('❌ Error: ' + error.message)
    }
  }

  // ========== HANDLE DELETE ==========
  const handleDelete = async (type, id) => {
    if (!window.confirm(`Delete this ${type}?`)) return

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

      if (type === 'transfer') setTransfers(transfers.filter(t => t.id !== id))
      else if (type === 'driver') setDrivers(drivers.filter(d => d.id !== id))
      else if (type === 'customer') setCustomers(customers.filter(c => c.id !== id))
      else if (type === 'report') setReports(reports.filter(r => r.id !== id))

      alert(`✅ ${type} deleted!`)
    } catch (error) {
      alert('❌ Error: ' + error.message)
    }
  }

  // Stats calculations
  const todayTransfers = transfers.filter(t => {
    const today = new Date().toDateString()
    return new Date(t.date || t.created_at).toDateString() === today
  }).length

  const totalTonnage = transfers.reduce((sum, t) => sum + (t.quantity || 0), 0).toFixed(0)
  const onlineDrivers = drivers.filter(d => d.status === 'online').length

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
          <div className="company-info">
            <h2 className="company-name">{companyData.name}</h2>
            <p className="user-email">{session?.user?.email}</p>
          </div>
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
            transfers={transfers}
            drivers={drivers}
            onAddNew={() => openAddModal('transfer')}
            onDelete={(id) => handleDelete('transfer', id)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab 
            reports={reports}
            onAddNew={() => openAddModal('report')}
            onDelete={(id) => handleDelete('report', id)}
          />
        )}

        {activeTab === 'drivers' && (
          <DriversTab 
            drivers={drivers}
            onAddNew={() => openAddModal('driver')}
            onDelete={(id) => handleDelete('driver', id)}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersTab 
            customers={customers}
            onAddNew={() => openAddModal('customer')}
            onDelete={(id) => handleDelete('customer', id)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab 
            companyData={companyData}
            onEdit={() => {}}
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
                    />
                  </div>
                  <div className="form-group">
                    <label>Driver Name *</label>
                    <input 
                      type="text" 
                      value={newTransfer.driver}
                      onChange={(e) => setNewTransfer({...newTransfer, driver: e.target.value})}
                      placeholder="e.g., John Smith"
                    />
                  </div>
                  <div className="form-group">
                    <label>Waste Type *</label>
                    <select 
                      value={newTransfer.waste_type}
                      onChange={(e) => setNewTransfer({...newTransfer, waste_type: e.target.value})}
                    >
                      <option value="">Select</option>
                      <option value="17.01.01 - Concrete">17.01.01 - Concrete</option>
                      <option value="17.09.04 - Construction Waste">17.09.04 - Construction Waste</option>
                      <option value="20.03.01 - Mixed Waste">20.03.01 - Mixed Waste</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group half">
                      <label>Quantity *</label>
                      <input 
                        type="number" 
                        value={newTransfer.quantity}
                        onChange={(e) => setNewTransfer({...newTransfer, quantity: e.target.value})}
                        placeholder="8"
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
                      placeholder="John Smith"
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
                      placeholder="Truck 01"
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
                      placeholder="ABC Construction Ltd"
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
                      placeholder="Monthly Compliance Report"
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
    </div>
  )
}

// ========== OVERVIEW TAB ==========
function OverviewTab({ todayTransfers, totalTonnage, onlineDrivers, transfers, drivers, onAddNew, onDelete }) {
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
          <div className="stat-sub">{drivers.length} total</div>
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
            <span className="stat-label">Compliance</span>
          </div>
          <div className="stat-value status-ready">Ready</div>
          <div className="stat-sub">100%</div>
        </div>
      </div>

      <div className="compliance-banner">
        <div className="banner-content">
          <h3>October 2026 Ready</h3>
          <p>All WTNs digitally submitted to EA API. Fully compliant.</p>
        </div>
        <div className="compliance-checks">
          <div className="check-item"><span className="check-icon">✓</span>API Connected</div>
          <div className="check-item"><span className="check-icon">✓</span>Auto-Submission</div>
          <div className="check-item"><span className="check-icon">✓</span>2-Year Records</div>
        </div>
      </div>

      <div className="transfers-section">
        <div className="section-header">
          <h3>Today's Waste Transfer Notes</h3>
          <div className="section-actions">
            <button className="filter-btn">📊 Filter</button>
            <button className="export-btn">📎 Export</button>
          </div>
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
              {transfers.map(t => (
                <tr key={t.id}>
                  <td><span className="wtn-number">{t.wtn_number}</span></td>
                  <td>{t.customer}</td>
                  <td>{t.driver}</td>
                  <td>{t.waste_type}</td>
                  <td>{t.quantity} {t.unit}</td>
                  <td>{t.time}</td>
                  <td>
                    <span className={`status-badge ${t.status}`}>
                      {t.status === 'completed' ? '✓' : '⏳'} {t.status}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn" onClick={() => onDelete(t.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ========== REPORTS TAB ==========
function ReportsTab({ reports, onAddNew, onDelete }) {
  return (
    <div className="tab-content">
      <div className="content-header">
        <h2>Reports</h2>
        <button className="primary-btn" onClick={onAddNew}>+ Generate New Report</button>
      </div>
      <div className="reports-grid">
        {reports.map(r => (
          <div key={r.id} className="report-card">
            <div className="report-icon">📄</div>
            <div className="report-details">
              <h3>{r.name}</h3>
              <p>{r.date}</p>
              <span className={`report-status ${r.status}`}>{r.status}</span>
            </div>
            <div className="report-actions">
              <button className="icon-btn">📥</button>
              <button className="icon-btn" onClick={() => onDelete(r.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ========== DRIVERS TAB ==========
function DriversTab({ drivers, onAddNew, onDelete }) {
  return (
    <div className="tab-content">
      <div className="content-header">
        <h2>Drivers</h2>
        <button className="primary-btn" onClick={onAddNew}>+ Add New Driver</button>
      </div>
      <div className="drivers-stats">
        <div className="mini-stat">
          <span className="mini-label">Total Drivers</span>
          <span className="mini-value">{drivers.length}</span>
        </div>
        <div className="mini-stat">
          <span className="mini-label">Online</span>
          <span className="mini-value success">{drivers.filter(d => d.status === 'online').length}</span>
        </div>
        <div className="mini-stat">
          <span className="mini-label">Offline</span>
          <span className="mini-value warning">{drivers.filter(d => d.status === 'offline').length}</span>
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Vehicle</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map(d => (
            <tr key={d.id}>
              <td><strong>{d.name}</strong></td>
              <td>{d.email}</td>
              <td>{d.phone}</td>
              <td>{d.vehicle}</td>
              <td><span className={`status-indicator ${d.status}`}>{d.status}</span></td>
              <td><button className="action-btn" onClick={() => onDelete(d.id)}>🗑️</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ========== CUSTOMERS TAB ==========
function CustomersTab({ customers, onAddNew, onDelete }) {
  return (
    <div className="tab-content">
      <div className="content-header">
        <h2>Customers</h2>
        <button className="primary-btn" onClick={onAddNew}>+ Add New Customer</button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Transfers</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id}>
              <td><strong>{c.name}</strong></td>
              <td>{c.email}</td>
              <td>{c.phone}</td>
              <td>{c.address}</td>
              <td>{c.total_transfers}</td>
              <td><button className="action-btn" onClick={() => onDelete(c.id)}>🗑️</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ========== SETTINGS TAB ==========
function SettingsTab({ companyData }) {
  return (
    <div className="tab-content">
      <h2>Settings</h2>
      <div className="settings-section">
        <h3>Company Profile</h3>
        <div className="settings-form view-mode">
          <div className="form-row"><label>Company</label><div className="value-display">{companyData.name}</div></div>
          <div className="form-row"><label>Email</label><div className="value-display">{companyData.email}</div></div>
          <div className="form-row"><label>Phone</label><div className="value-display">{companyData.phone}</div></div>
          <div className="form-row"><label>Address</label><div className="value-display">{companyData.address}</div></div>
        </div>
      </div>
    </div>
  )
}

export default App