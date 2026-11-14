
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  loginUser,
  registerUser,
  logoutUser,
  apiRequest,
} from './api'
import './App.css'
import PondScene from './PondScene'

function WaterLily() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Flowstate water lily"
      role="img"
    >
      <path d="M32 48C23 48 13 43 9 35C18 35 25 38 32 44C39 38 46 35 55 35C51 43 41 48 32 48Z" fill="currentColor" opacity=".55" />
      <path d="M32 42C25 35 23 27 27 17C34 24 36 32 32 42Z" fill="currentColor" />
      <path d="M32 42C18 39 13 31 14 23C24 25 30 31 32 42Z" fill="currentColor" opacity=".85" />
      <path d="M32 42C46 39 51 31 50 23C40 25 34 31 32 42Z" fill="currentColor" opacity=".85" />
      <path d="M32 42C24 39 21 33 22 27C29 30 32 35 32 42Z" fill="currentColor" opacity=".7" />
      <path d="M32 42C40 39 43 33 42 27C35 30 32 35 32 42Z" fill="currentColor" opacity=".7" />
      <circle cx="32" cy="40" r="3" fill="#D69AA6" />
    </svg>
  )
}

function isPadBloomed(pad) {
  if (!pad.buds?.length) return pad.completed === true
  return pad.buds.every((bud) => bud.completed)
}

function getPadProgress(pad) {
  if (!pad.buds?.length) return pad.completed ? 100 : 0

  const completed = pad.buds.filter((bud) => bud.completed).length
  return (completed / pad.buds.length) * 100
}

function getTodayDate() {
  const today = new Date()

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function formatCompletionDate(date) {
  if (!date) return ''

  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDeadline(date) {
  if (!date) return ''

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getDeadlineStatus(pad) {
  if (!pad.deadline || isPadBloomed(pad)) return null

  const today = getTodayDate()

  if (pad.deadline < today) return 'overdue'
  if (pad.deadline === today) return 'today'

  return 'upcoming'
}

const PRIORITY_STYLES = {
  low: {
    label: 'Low',
    symbol: '🌱',
    className: 'priority-low',
  },
  medium: {
    label: 'Medium',
    symbol: '🍃',
    className: 'priority-medium',
  },
  high: {
    label: 'High',
    symbol: '🌺',
    className: 'priority-high',
  },
}

function Notification({ notification, onClose }) {
  if (!notification) return null

  return (
    <div
      className={`app-notification ${notification.type || 'success'}`}
      role="status"
    >
      <span>{notification.type === 'error' ? '⚠' : '✿'}</span>
      <p>{notification.message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  )
}

function Sidebar({ activeView, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-icon">
          <WaterLily />
        </span>
        <span>flowstate</span>
      </div>

      <nav className="navigation" aria-label="Main navigation">
        <button
          type="button"
          className={`nav-link ${activeView === 'pond' ? 'active' : ''}`}
          onClick={() => onNavigate('pond')}
        >
          <span>◉</span> My Pond
        </button>

        <button
          type="button"
          className={`nav-link ${activeView === 'garden' ? 'active' : ''}`}
          onClick={() => onNavigate('garden')}
        >
          <span>✿</span> Bloom Garden
        </button>

        <button
          type="button"
          className={`nav-link ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
        >
          <span>⚙</span> Settings
        </button>
      </nav>

      <div className="sidebar-footer">
        Find your calm. Find your flow.
      </div>
    </aside>
  )
}

function Statistics({ pads, activePads, bloomedPads }) {
  const totalItems = pads.reduce(
    (total, pad) => total + (pad.buds.length || 1),
    0
  )

  const completedItems = pads.reduce((total, pad) => {
    if (!pad.buds.length) {
      return total + (pad.completed ? 1 : 0)
    }

    return total + pad.buds.filter((bud) => bud.completed).length
  }, 0)

  const progress = totalItems
    ? Math.round((completedItems / totalItems) * 100)
    : 0

  return (
    <section className="statistics-section">
      <div className="statistics-grid">
        <article className="stat-card stat-total">
          <span className="stat-icon">◉</span>
          <span className="stat-label">Total Pads</span>
          <strong className="stat-value">{pads.length}</strong>
          <span className="stat-description">Your personal goals</span>
        </article>

        <article className="stat-card stat-active">
          <span className="stat-icon">🌱</span>
          <span className="stat-label">Active Pads</span>
          <strong className="stat-value">{activePads.length}</strong>
          <span className="stat-description">Still growing</span>
        </article>

        <article className="stat-card stat-bloomed">
          <span className="stat-icon">✿</span>
          <span className="stat-label">Bloomed Pads</span>
          <strong className="stat-value">{bloomedPads.length}</strong>
          <span className="stat-description">Successfully completed</span>
        </article>

        <article className="stat-card stat-progress">
          <span className="stat-icon">↗</span>
          <span className="stat-label">Overall Progress</span>
          <strong className="stat-value">{progress}%</strong>
          <span className="stat-description">
            {completedItems} of {totalItems} steps completed
          </span>

          <div className="stat-progress-track">
            <div
              className="stat-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </article>
      </div>
    </section>
  )
}

function PadCard({
  pad,
  busy,
  onToggleBud,
  onAddBud,
  onEdit,
  onDelete,
  onEditBud,
  onDeleteBud,
  onTogglePadCompletion,
}) {
  const completedCount = pad.buds.filter((bud) => bud.completed).length
  const totalCount = pad.buds.length
  const progress = getPadProgress(pad)
  const bloomed = isPadBloomed(pad)
  const deadlineStatus = getDeadlineStatus(pad)

  const priority =
    PRIORITY_STYLES[pad.priority] || PRIORITY_STYLES.medium

  return (
    <article className={`pad-card ${pad.featured ? 'featured' : ''}`}>
      <div className="pad-card-top">
        <div className="pad-card-labels">
          <span className="pad-category">{pad.category}</span>

          <span className={`priority-badge ${priority.className}`}>
            {priority.symbol} {priority.label}
          </span>
        </div>

        <div className="pad-actions">
          <button
            type="button"
            className="pad-action-button edit-action"
            onClick={() => onEdit(pad)}
            title="Edit Pad"
            aria-label={`Edit ${pad.title}`}
          >
            ✎
          </button>

          <button
            type="button"
            className="pad-action-button delete-action"
            onClick={() => onDelete(pad)}
            title="Delete Pad"
            aria-label={`Delete ${pad.title}`}
            disabled={busy}
          >
            ×
          </button>
        </div>
      </div>

      {bloomed && <span className="pad-status">Bloomed ✿</span>}

      <h3>{pad.title}</h3>

      {pad.deadline && (
        <div className={`deadline-badge deadline-${deadlineStatus || 'upcoming'}`}>
          ◷{' '}
          {deadlineStatus === 'overdue'
            ? 'Overdue · '
            : deadlineStatus === 'today'
              ? 'Due today · '
              : 'Due · '}
          {formatDeadline(pad.deadline)}
        </div>
      )}

      <p>
        {completedCount} of {totalCount} Buds completed
      </p>

      {totalCount > 0 ? (
        <ul className="bud-list">
          {pad.buds.map((bud) => (
            <li
              key={bud.id}
              className={`bud-row ${bud.completed ? 'completed' : ''}`}
            >
              <button
                type="button"
                className="bud-toggle-button"
                onClick={() => onToggleBud(pad.id, bud.id)}
                disabled={busy}
              >
                <span>{bud.completed ? '✓' : '○'}</span>
                <span className="bud-title">{bud.title}</span>
              </button>

              <div className="bud-actions">
                <button
                  type="button"
                  className="bud-action-button bud-edit-action"
                  onClick={() => onEditBud(pad, bud)}
                  disabled={busy}
                  aria-label={`Edit ${bud.title}`}
                >
                  ✎
                </button>

                <button
                  type="button"
                  className="bud-action-button bud-delete-action"
                  onClick={() => onDeleteBud(pad, bud)}
                  disabled={busy}
                  aria-label={`Delete ${bud.title}`}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No Buds added yet.</p>
      )}

      {totalCount === 0 && (
        <button
          type="button"
          className="complete-pad-button"
          onClick={() => onTogglePadCompletion(pad.id)}
          disabled={busy}
        >
          {bloomed ? 'Undo Completion' : 'Complete Pad ✿'}
        </button>
      )}

      {!bloomed && (
        <button
          type="button"
          className="add-bud-button"
          onClick={() => onAddBud(pad.id, pad.title)}
        >
          + Add Bud
        </button>
      )}

      {bloomed && pad.completedAt && (
        <p className="completion-date">
          Bloomed on {formatCompletionDate(pad.completedAt)}
        </p>
      )}

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="progress-label">
        {Math.round(progress)}% complete
      </span>
    </article>
  )
}

function PadFormModal({ pad, onClose, onSave, busy }) {
  const editing = Boolean(pad)

  const [title, setTitle] = useState(pad?.title ?? '')
  const [category, setCategory] = useState(
    pad?.category ?? 'Personal Growth'
  )
  const [deadline, setDeadline] = useState(pad?.deadline ?? '')
  const [priority, setPriority] = useState(
    pad?.priority ?? 'medium'
  )

  function submit(event) {
    event.preventDefault()

    if (!title.trim()) return

    onSave(title.trim(), category, deadline || null, priority)
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) =>
        event.target === event.currentTarget && !busy && onClose()
      }
    >
      <div
        className="pad-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pad-modal-title"
      >
        <div className="modal-header">
          <div>
            <span className="date-label">
              {editing ? 'MAKE IT YOUR OWN' : 'GROW SOMETHING NEW'}
            </span>

            <h2 id="pad-modal-title">
              {editing ? 'Edit Pad' : 'Create a Pad'}
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit}>
          <label htmlFor="pad-title">Pad name</label>

          <input
            id="pad-title"
            type="text"
            placeholder="What would you like to work on?"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={60}
            autoFocus
          />

          <label htmlFor="pad-category">Category</label>

          <select
            id="pad-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option>Personal Growth</option>
            <option>Development</option>
            <option>University</option>
            <option>Health & Wellness</option>
            <option>Work</option>
            <option>Other</option>
          </select>

          <label htmlFor="pad-priority">Priority</label>

          <select
            id="pad-priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            <option value="low">Low · 🌱</option>
            <option value="medium">Medium · 🍃</option>
            <option value="high">High · 🌺</option>
          </select>

          <label htmlFor="pad-deadline">Deadline (optional)</label>

          <input
            id="pad-deadline"
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            min={getTodayDate()}
          />

          {deadline && (
            <button
              type="button"
              className="remove-deadline-button"
              onClick={() => setDeadline('')}
            >
              Remove deadline
            </button>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="create-button"
              disabled={busy || !title.trim()}
            >
              {busy
                ? 'Saving...'
                : editing
                  ? 'Save Changes'
                  : 'Create Pad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BudFormModal({
  padTitle,
  bud,
  onClose,
  onSave,
  busy,
}) {
  const editing = Boolean(bud)
  const [title, setTitle] = useState(bud?.title ?? '')

  function submit(event) {
    event.preventDefault()

    if (title.trim()) {
      onSave(title.trim())
    }
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) =>
        event.target === event.currentTarget && !busy && onClose()
      }
    >
      <div
        className="pad-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bud-modal-title"
      >
        <div className="modal-header">
          <div>
            <span className="date-label">
              {editing ? 'REFINE YOUR NEXT STEP' : 'A LITTLE STEP FORWARD'}
            </span>

            <h2 id="bud-modal-title">
              {editing ? 'Edit Bud' : 'Add a Bud'}
            </h2>

            <p className="modal-description">
              {editing
                ? `Update this step in ${padTitle}.`
                : <>Add a new step to <strong>{padTitle}</strong>.</>}
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit}>
          <label htmlFor="bud-title">Bud name</label>

          <input
            id="bud-title"
            type="text"
            placeholder="What is your next small step?"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={100}
            autoFocus
          />

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="create-button"
              disabled={busy || !title.trim()}
            >
              {busy
                ? 'Saving...'
                : editing
                  ? 'Save Changes'
                  : 'Add Bud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SettingsPage({
  user,
  pads,
  theme,
  setTheme,
  density,
  setDensity,
  motionEnabled,
  setMotionEnabled,
  onLogout,
}) {
  const completedPads = pads.filter(isPadBloomed).length
  const activePads = pads.length - completedPads

  return (
    <section className="settings-page">
      <div className="settings-intro">
        <span className="eyebrow">MAKE YOURSELF AT HOME</span>
        <h2>Settings</h2>
        <p>A little space to make Flowstate feel like yours.</p>
      </div>

      <div className="settings-layout">
        <div className="settings-main-column">
          <article className="settings-card">
            <div className="settings-card-heading">
              <div className="settings-heading-icon">✿</div>

              <div>
                <h3>Appearance</h3>
                <p>Shape your personal workspace.</p>
              </div>
            </div>

            <div className="setting-row setting-row-stack">
              <div>
                <strong>Color theme</strong>
                <span>Choose the atmosphere of your pond.</span>
              </div>

              <div className="appearance-options">
                <button
                  type="button"
                  className={`appearance-option ${theme === 'botanical' ? 'selected' : ''}`}
                  onClick={() => setTheme('botanical')}
                  aria-pressed={theme === 'botanical'}
                >
                  <span className="palette-preview botanical-preview">
                    <i />
                    <i />
                    <i />
                  </span>

                  Botanical

                  {theme === 'botanical' && <span>✓</span>}
                </button>

                <button
                  type="button"
                  className={`appearance-option ${theme === 'lavender' ? 'selected' : ''}`}
                  onClick={() => setTheme('lavender')}
                  aria-pressed={theme === 'lavender'}
                >
                  <span className="palette-preview lavender-preview">
                    <i />
                    <i />
                    <i />
                  </span>

                  Lavender

                  {theme === 'lavender' && <span>✓</span>}
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <strong>Card density</strong>
                <span>Choose how much space your Pads take up.</span>
              </div>

              <div className="setting-segment">
                <button
                  type="button"
                  className={density === 'comfortable' ? 'selected' : ''}
                  onClick={() => setDensity('comfortable')}
                  aria-pressed={density === 'comfortable'}
                >
                  Comfortable
                </button>

                <button
                  type="button"
                  className={density === 'compact' ? 'selected' : ''}
                  onClick={() => setDensity('compact')}
                  aria-pressed={density === 'compact'}
                >
                  Compact
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <strong>Animations</strong>
                <span>Enable subtle movements and transitions.</span>
              </div>

              <button
                type="button"
                className={`toggle-switch ${motionEnabled ? 'active' : ''}`}
                onClick={() =>
                  setMotionEnabled((current) => !current)
                }
                aria-label="Toggle animations"
                aria-pressed={motionEnabled}
              >
                <span />
              </button>
            </div>
          </article>

          <article className="settings-card">
            <div className="settings-card-heading">
              <div className="settings-heading-icon account-icon">
                ♙
              </div>

              <div>
                <h3>Account</h3>
                <p>Your Flowstate account information.</p>
              </div>
            </div>

            <div className="account-info-row">
              <div>
                <strong>Email address</strong>
                <span>
                  {user?.email || 'Email information unavailable'}
                </span>
              </div>

              <span className="account-status">
                <span />
                Active
              </span>
            </div>

            <div className="account-info-row">
              <div>
                <strong>Account type</strong>
                <span>Personal workspace</span>
              </div>

              <span className="account-status account-status-neutral">
                Flowstate
              </span>
            </div>
          </article>
        </div>

        <div className="settings-side-column">
          <article className="settings-card">
            <div className="settings-card-heading">
              <div className="settings-heading-icon account-icon">
                ◉
              </div>

              <div>
                <h3>Your workspace</h3>
                <p>A little overview of your progress.</p>
              </div>
            </div>

            <div className="account-info-row">
              <div>
                <strong>Total Pads</strong>
                <span>Your personal goals.</span>
              </div>

              <strong>{pads.length}</strong>
            </div>

            <div className="account-info-row">
              <div>
                <strong>Active Pads</strong>
                <span>Still growing.</span>
              </div>

              <strong>{activePads}</strong>
            </div>

            <div className="account-info-row">
              <div>
                <strong>Bloomed Pads</strong>
                <span>Successfully completed.</span>
              </div>

              <strong>{completedPads}</strong>
            </div>
          </article>

          <article className="settings-quote-card">
            <span>✧</span>
            <p>
              “Almost everything will work again if you unplug it for a few
              minutes, including you.”
            </p>
            <span>A LITTLE REMINDER</span>
          </article>

          <article className="settings-logout-card">
            <h3>Leaving the pond?</h3>

            <p>
              You can safely log out. Your Pads and Buds will remain saved
              in your account.
            </p>

            <button
              type="button"
              className="logout-button"
              onClick={onLogout}
            >
              ↪ Log out
            </button>
          </article>
        </div>
      </div>
    </section>
  )
}

function AuthScreen({ onLogin, onRegister }) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        await onRegister(email.trim(), password)
      } else {
        await onLogin(email.trim(), password)
      }
    } catch (error) {
      setError(
        error.message || 'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-scene">
          <PondScene idPrefix="auth" />
        </div>

        <WaterLily />

        <h1>Flowstate</h1>
        <p>Find your calm. Find your flow.</p>

        <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>

        <form onSubmit={submit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete={
              isRegister ? 'new-password' : 'current-password'
            }
          />

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? 'Please wait...'
              : isRegister
                ? 'Create account'
                : 'Sign in'}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister
            ? 'Already have an account?'
            : "Don't have an account?"}

          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister)
              setError('')
            }}
          >
            {isRegister ? 'Sign in' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem('flowstate_token'))
  )

  const [authLoading, setAuthLoading] = useState(true)
  const [user, setUser] = useState(null)

  const [theme, setTheme] = useState(() =>
    localStorage.getItem('flowstate_theme') === 'lavender'
      ? 'lavender'
      : 'botanical'
  )

  const [density, setDensity] = useState(() =>
    localStorage.getItem('flowstate_density') === 'compact'
      ? 'compact'
      : 'comfortable'
  )

  const [motionEnabled, setMotionEnabled] = useState(
    () => localStorage.getItem('flowstate_motion') !== 'false'
  )

  const [pads, setPads] = useState([])
  const [activeView, setActiveView] = useState('pond')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPadForBud, setSelectedPadForBud] = useState(null)
  const [selectedPadForEdit, setSelectedPadForEdit] = useState(null)
  const [selectedBudForEdit, setSelectedBudForEdit] = useState(null)

  const [padsLoading, setPadsLoading] = useState(false)
  const [operationLoading, setOperationLoading] = useState(false)
  const [busyIds, setBusyIds] = useState([])

  const [notification, setNotification] = useState(null)
  const [loadError, setLoadError] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const notificationTimer = useRef(null)

  const notify = useCallback((message, type = 'success') => {
    setNotification({ message, type })

    if (notificationTimer.current) {
      window.clearTimeout(notificationTimer.current)
    }

    notificationTimer.current = window.setTimeout(() => {
      setNotification(null)
      notificationTimer.current = null
    }, 4000)
  }, [])

  function markBusy(id, busy) {
    setBusyIds((current) =>
      busy
        ? [...current, id]
        : current.filter((item) => item !== id)
    )
  }

  useEffect(() => {
    localStorage.setItem('flowstate_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('flowstate_density', density)
  }, [density])

  useEffect(() => {
    localStorage.setItem('flowstate_motion', String(motionEnabled))
  }, [motionEnabled])

  async function handleLogin(email, password) {
    await loginUser(email, password)

    const currentUser = await apiRequest('/users/me')

    setUser(currentUser)
    setActiveView('pond')
    setIsAuthenticated(true)
  }

  async function handleRegister(email, password) {
    await registerUser(email, password)
    await loginUser(email, password)

    const currentUser = await apiRequest('/users/me')

    setUser(currentUser)
    setActiveView('pond')
    setIsAuthenticated(true)
  }

  function handleLogout() {
    logoutUser()

    setIsAuthenticated(false)
    setUser(null)
    setPads([])
    setActiveView('pond')
    setIsModalOpen(false)
    setSelectedPadForBud(null)
    setSelectedPadForEdit(null)
    setSelectedBudForEdit(null)
    setNotification(null)
  }

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      const token = localStorage.getItem('flowstate_token')

      if (!token) {
        setAuthLoading(false)
        return
      }

      try {
        const currentUser = await apiRequest('/users/me')

        if (!cancelled) {
          setUser(currentUser)
          setIsAuthenticated(true)
        }
      } catch {
        logoutUser()

        if (!cancelled) {
          setUser(null)
          setIsAuthenticated(false)
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false

    async function loadPads() {
      setPadsLoading(true)
      setLoadError('')

      try {
        const tasks = await apiRequest('/tasks')

        const result = await Promise.all(
          tasks.map(async (task) => {
            const buds = await apiRequest(`/tasks/${task.id}/buds`)

            return {
              id: task.id,
              title: task.title,
              category: task.category ?? 'Other',
              priority: task.priority ?? 'medium',
              featured: false,
              completed: task.completed,
              completedAt: task.completed_at ?? null,
              deadline: task.deadline,
              buds: Array.isArray(buds) ? buds : [],
            }
          })
        )

        if (!cancelled) {
          setPads(result)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error.message || 'Your Pads could not be loaded.'
          )

          notify(
            'Your Pads could not be loaded. Please try again.',
            'error'
          )
        }
      } finally {
        if (!cancelled) {
          setPadsLoading(false)
        }
      }
    }

    loadPads()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, notify])

  async function toggleBud(padId, budId) {
    const pad = pads.find((item) => item.id === padId)
    const bud = pad?.buds.find((item) => item.id === budId)

    if (!bud || busyIds.includes(budId)) return

    markBusy(budId, true)

    try {
      const updated = await apiRequest(`/buds/${budId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          completed: !bud.completed,
        }),
      })

      setPads((current) =>
        current.map((item) =>
          item.id !== padId
            ? item
            : {
                ...item,
                buds: item.buds.map((entry) =>
                  entry.id === budId
                    ? {
                        ...entry,
                        completed: updated.completed ?? !bud.completed,
                      }
                    : entry
                ),
                completedAt:
                  item.buds.length > 0 &&
                  item.buds.every((entry) =>
                    entry.id === budId
                      ? !bud.completed
                      : entry.completed
                  )
                    ? item.completedAt ?? new Date().toISOString()
                    : null,
              }
        )
      )
    } catch (error) {
      notify(
        error.message || 'Bud could not be updated.',
        'error'
      )
    } finally {
      markBusy(budId, false)
    }
  }

  async function togglePadCompletion(padId) {
    const pad = pads.find((item) => item.id === padId)

    if (!pad || busyIds.includes(padId)) return

    markBusy(padId, true)

    try {
      const updated = await apiRequest(`/tasks/${padId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          completed: !pad.completed,
        }),
      })

      setPads((current) =>
        current.map((item) =>
          item.id !== padId
            ? item
            : {
                ...item,
                completed: updated.completed,
                completedAt: updated.completed
                  ? item.completedAt ?? new Date().toISOString()
                  : null,
              }
        )
      )

      notify(
        updated.completed
          ? 'Your Pad has bloomed!'
          : 'Pad completion undone.'
      )
    } catch (error) {
      notify(
        error.message || 'Pad status could not be updated.',
        'error'
      )
    } finally {
      markBusy(padId, false)
    }
  }

  async function createPad(title, category, deadline, priority) {
    setOperationLoading(true)

    try {
      const created = await apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          category,
          priority,
          deadline: deadline || null,
        }),
      })

      setPads((current) => [
        ...current,
        {
          id: created.id,
          title: created.title,
          category: created.category ?? category,
          priority: created.priority ?? priority,
          featured: false,
          buds: [],
          completed: created.completed,
          completedAt: null,
          deadline: created.deadline,
        },
      ])

      setIsModalOpen(false)
      notify('A new Pad has been planted!')
    } catch (error) {
      notify(
        error.message || 'Pad could not be created.',
        'error'
      )
    } finally {
      setOperationLoading(false)
    }
  }

  async function createBud(title) {
    if (!selectedPadForBud) return

    setOperationLoading(true)

    const padId = selectedPadForBud.id

    try {
      const created = await apiRequest(
        `/tasks/${padId}/buds`,
        {
          method: 'POST',
          body: JSON.stringify({ title }),
        }
      )

      setPads((current) =>
        current.map((pad) =>
          pad.id !== padId
            ? pad
            : {
                ...pad,
                completed: false,
                completedAt: null,
                buds: [...pad.buds, created],
              }
        )
      )

      setSelectedPadForBud(null)
      notify('A new Bud has been added!')
    } catch (error) {
      notify(
        error.message || 'Bud could not be created.',
        'error'
      )
    } finally {
      setOperationLoading(false)
    }
  }

  async function updatePad(title, category, deadline, priority) {
    if (!selectedPadForEdit) return

    setOperationLoading(true)

    const padId = selectedPadForEdit.id

    try {
      const updated = await apiRequest(`/tasks/${padId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          category,
          deadline: deadline || null,
          priority,
        }),
      })

      setPads((current) =>
        current.map((pad) =>
          pad.id !== padId
            ? pad
            : {
                ...pad,
                title: updated.title,
                category: updated.category,
                deadline: updated.deadline,
                priority: updated.priority,
              }
        )
      )

      setSelectedPadForEdit(null)
      notify('Pad details have been updated.')
    } catch (error) {
      notify(
        error.message || 'Pad could not be updated.',
        'error'
      )
    } finally {
      setOperationLoading(false)
    }
  }

  async function updateBud(title) {
    if (!selectedBudForEdit) return

    setOperationLoading(true)

    const { padId, budId } = selectedBudForEdit

    try {
      const updated = await apiRequest(`/buds/${budId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      })

      setPads((current) =>
        current.map((pad) =>
          pad.id !== padId
            ? pad
            : {
                ...pad,
                buds: pad.buds.map((bud) =>
                  bud.id === budId
                    ? { ...bud, title: updated.title }
                    : bud
                ),
              }
        )
      )

      setSelectedBudForEdit(null)
      notify('Bud details have been updated.')
    } catch (error) {
      notify(
        error.message || 'Bud could not be updated.',
        'error'
      )
    } finally {
      setOperationLoading(false)
    }
  }

  async function deleteBud(pad, bud) {
    if (
      !window.confirm(
        `"${bud.title}" will be deleted from "${pad.title}". Are you sure?`
      )
    ) {
      return
    }

    markBusy(bud.id, true)

    try {
      await apiRequest(`/buds/${bud.id}`, {
        method: 'DELETE',
      })

      setPads((current) =>
        current.map((item) => {
          if (item.id !== pad.id) return item

          const buds = item.buds.filter(
            (entry) => entry.id !== bud.id
          )

          return {
            ...item,
            buds,
            completedAt:
              buds.length && buds.every((entry) => entry.completed)
                ? item.completedAt ?? new Date().toISOString()
                : null,
          }
        })
      )

      notify('Bud deleted.')
    } catch (error) {
      notify(
        error.message || 'Bud could not be deleted.',
        'error'
      )
    } finally {
      markBusy(bud.id, false)
    }
  }

  async function deletePad(pad) {
    if (
      !window.confirm(
        `"${pad.title}" and all its Buds will be deleted. Are you sure?`
      )
    ) {
      return
    }

    markBusy(pad.id, true)

    try {
      await apiRequest(`/tasks/${pad.id}`, {
        method: 'DELETE',
      })

      setPads((current) =>
        current.filter((item) => item.id !== pad.id)
      )

      notify('Pad deleted.')
    } catch (error) {
      notify(
        error.message || 'Pad could not be deleted.',
        'error'
      )
    } finally {
      markBusy(pad.id, false)
    }
  }

  const activePads = pads.filter(
    (pad) => !isPadBloomed(pad)
  )

  const bloomedPads = pads.filter(isPadBloomed)

  const baseVisiblePads =
    activeView === 'garden' ? bloomedPads : activePads

  const categories = [
    'All',
    ...new Set(
      pads.map((pad) => pad.category).filter(Boolean)
    ),
  ]

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase()

  const filteredPads = baseVisiblePads.filter((pad) => {
    const matchesSearch =
      !normalizedQuery ||
      String(pad.title || '')
        .toLocaleLowerCase()
        .includes(normalizedQuery) ||
      String(pad.category || '')
        .toLocaleLowerCase()
        .includes(normalizedQuery) ||
      pad.buds.some((bud) =>
        String(bud.title || '')
          .toLocaleLowerCase()
          .includes(normalizedQuery)
      )

    return (
      matchesSearch &&
      (selectedCategory === 'All' ||
        pad.category === selectedCategory)
    )
  })

  const visiblePads = [...filteredPads].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.title.localeCompare(b.title)

      case 'mostProgress':
        return getPadProgress(b) - getPadProgress(a)

      case 'leastProgress':
        return getPadProgress(a) - getPadProgress(b)

      case 'recentlyCompleted':
        return (
          (b.completedAt
            ? new Date(b.completedAt).getTime()
            : 0) -
          (a.completedAt
            ? new Date(a.completedAt).getTime()
            : 0)
        )

      default:
        return Number(b.id) - Number(a.id)
    }
  })

  const hasFilters =
    normalizedQuery !== '' || selectedCategory !== 'All'

  const pageTitle =
    activeView === 'garden'
      ? 'Bloom Garden'
      : activeView === 'settings'
        ? 'Settings'
        : 'Your Pond'

  const pageDescription =
    activeView === 'garden'
      ? 'Look at everything you have accomplished.'
      : activeView === 'settings'
        ? 'Make your personal space feel just right.'
        : 'A little progress, every day.'

  const controlStyle = {
    flex: '1 1 200px',
    minWidth: 170,
  }

  if (authLoading || (isAuthenticated && padsLoading)) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Your pond is growing...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    )
  }

  return (
    <div
      className={[
        'app',
        theme === 'lavender' ? 'theme-lavender' : '',
        density === 'compact' ? 'density-compact' : '',
        !motionEnabled ? 'motion-off' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Sidebar
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view)
          setSearchQuery('')
          setSelectedCategory('All')
        }}
      />

      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <span className="date-label">YOUR PERSONAL SPACE</span>
            <h1>{pageTitle}</h1>
            <p>{pageDescription}</p>
          </div>

          {activeView === 'pond' && (
            <button
              type="button"
              className="new-pad-button"
              onClick={() => setIsModalOpen(true)}
            >
              + New Pad
            </button>
          )}
        </header>

        {loadError && (
          <div className="load-error" role="alert">
            <p>{loadError}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {activeView !== 'settings' && (
          <div className="pond-hero">
            <PondScene idPrefix="hero" />
          </div>
        )}

        {activeView === 'settings' ? (
          <SettingsPage
            user={user}
            pads={pads}
            theme={theme}
            setTheme={setTheme}
            density={density}
            setDensity={setDensity}
            motionEnabled={motionEnabled}
            setMotionEnabled={setMotionEnabled}
            onLogout={handleLogout}
          />
        ) : (
          <>
            {activeView === 'pond' && (
              <Statistics
                pads={pads}
                activePads={activePads}
                bloomedPads={bloomedPads}
              />
            )}

            <section className="pads-section">
              <div className="section-heading">
                <h2>
                  {activeView === 'garden'
                    ? 'Your Blooms'
                    : 'Your Pads'}
                </h2>

                <span>
                  {visiblePads.length}{' '}
                  {activeView === 'garden'
                    ? 'Bloomed Pads'
                    : 'active Pads'}
                </span>
              </div>

              <div className="pad-filters">
                <input
                  type="search"
                  placeholder="Search Pads or Buds..."
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  aria-label="Search Pads and Buds"
                  style={controlStyle}
                />

                <select
                  value={selectedCategory}
                  onChange={(event) =>
                    setSelectedCategory(event.target.value)
                  }
                  aria-label="Filter by category"
                  style={controlStyle}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === 'All'
                        ? 'All categories'
                        : category}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value)
                  }
                  aria-label="Sort Pads"
                  style={controlStyle}
                >
                  <option value="newest">Recently Created</option>
                  <option value="alphabetical">
                    Alphabetical (A–Z)
                  </option>
                  <option value="mostProgress">
                    Most Progress
                  </option>
                  <option value="leastProgress">
                    Least Progress
                  </option>
                  <option value="recentlyCompleted">
                    Recently Completed
                  </option>
                </select>

                {hasFilters && (
                  <button
                    type="button"
                    className="clear-filters-button"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('All')
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {visiblePads.length > 0 ? (
                <div className="pads-grid">
                  {visiblePads.map((pad) => (
                    <PadCard
                      key={pad.id}
                      pad={pad}
                      busy={busyIds.includes(pad.id)}
                      onToggleBud={toggleBud}
                      onAddBud={(id, title) =>
                        setSelectedPadForBud({ id, title })
                      }
                      onEdit={setSelectedPadForEdit}
                      onDelete={deletePad}
                      onEditBud={(selectedPad, bud) =>
                        setSelectedBudForEdit({
                          padId: selectedPad.id,
                          padTitle: selectedPad.title,
                          budId: bud.id,
                          bud,
                        })
                      }
                      onDeleteBud={deleteBud}
                      onTogglePadCompletion={togglePadCompletion}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className={`empty-garden ${hasFilters ? 'filtered-empty' : ''}`}
                >
                  {hasFilters ? (
                    <>
                      <div className="empty-icon">⌕</div>
                      <h3>No matching Pads found</h3>
                      <p>
                        Try another search term or choose a different
                        category.
                      </p>

                      <button
                        type="button"
                        className="empty-action"
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedCategory('All')
                        }}
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="empty-flower">
                        <span className="flower-leaf leaf-one">✿</span>
                        <span className="flower-leaf leaf-two">✿</span>
                        <span className="flower-center">
                          {activeView === 'garden' ? '✿' : '❀'}
                        </span>
                        <span className="flower-ground">〰</span>
                      </div>

                      <span className="empty-eyebrow">
                        {activeView === 'garden'
                          ? 'A GARDEN OF POSSIBILITIES'
                          : 'A LITTLE SPACE TO GROW'}
                      </span>

                      <h3>
                        {activeView === 'garden'
                          ? 'Your first bloom is waiting'
                          : 'Your pond is waiting for you'}
                      </h3>

                      <p>
                        {activeView === 'garden'
                          ? 'Every little step brings you closer to something beautiful. Complete a Pad and watch your garden bloom.'
                          : 'Every meaningful journey starts with a little seed. Create your first Pad and let your progress grow.'}
                      </p>

                      {activeView === 'pond' && (
                        <button
                          type="button"
                          className="empty-action"
                          onClick={() => setIsModalOpen(true)}
                        >
                          + Plant your first Pad
                        </button>
                      )}

                      <div className="empty-decoration">
                        <span>✧</span>
                        <span>·</span>
                        <span>✿</span>
                        <span>·</span>
                        <span>✧</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Notification
        notification={notification}
        onClose={() => setNotification(null)}
      />

      {isModalOpen && (
        <PadFormModal
          busy={operationLoading}
          onClose={() => setIsModalOpen(false)}
          onSave={createPad}
        />
      )}

      {selectedPadForEdit && (
        <PadFormModal
          pad={selectedPadForEdit}
          busy={operationLoading}
          onClose={() => setSelectedPadForEdit(null)}
          onSave={updatePad}
        />
      )}

      {selectedPadForBud && (
        <BudFormModal
          padTitle={selectedPadForBud.title}
          busy={operationLoading}
          onClose={() => setSelectedPadForBud(null)}
          onSave={createBud}
        />
      )}

      {selectedBudForEdit && (
        <BudFormModal
          padTitle={selectedBudForEdit.padTitle}
          bud={selectedBudForEdit.bud}
          busy={operationLoading}
          onClose={() => setSelectedBudForEdit(null)}
          onSave={updateBud}
        />
      )}
    </div>
  )
}

export default App
