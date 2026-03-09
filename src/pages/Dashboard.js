import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const DAYS_FULL = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

function getTodayIndex() {
  const d = new Date().getDay()
  return d === 0 ? 6 : d - 1
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function Dashboard({ user, home }) {
  const [tasks, setTasks] = useState([])
  const [completions, setCompletions] = useState([])
  const [profiles, setProfiles] = useState({})
  const [currentDay, setCurrentDay] = useState(getTodayIndex())
  const [showAddTask, setShowAddTask] = useState(false)
  const [loading, setLoading] = useState(true)

  // Yeni görev formu
  const [taskName, setTaskName] = useState('')
  const [taskNote, setTaskNote] = useState('')
  const [taskDays, setTaskDays] = useState([1, 2, 3, 4, 5, 6, 7])
  const [taskAssigned, setTaskAssigned] = useState('')
  const [saving, setSaving] = useState(false)

  // eslint-disable-next-line
  useEffect(() => {
    loadAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoading(true)

    // Görevleri yükle
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('home_id', home.id)
      .eq('is_active', true)

    // Bugünün tiklerini yükle
    const { data: completionsData } = await supabase
      .from('task_completions')
      .select('*')
      .eq('completed_date', getTodayStr())

    // Ev üyelerini yükle
    const { data: membersData } = await supabase
      .from('home_members')
      .select('user_id')
      .eq('home_id', home.id)

    // Profilleri yükle
    if (membersData?.length) {
      const userIds = membersData.map(m => m.user_id)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      const profileMap = {}
      profilesData?.forEach(p => profileMap[p.id] = p)
      setProfiles(profileMap)
    }

    setTasks(tasksData || [])
    setCompletions(completionsData || [])
    setLoading(false)
  }

  async function toggleTask(task) {
    const existing = completions.find(c => c.task_id === task.id)

    if (existing) {
      // Tiki kaldır
      await supabase.from('task_completions').delete().eq('id', existing.id)
      setCompletions(completions.filter(c => c.id !== existing.id))
    } else {
      // Tik at
      const { data } = await supabase.from('task_completions').insert({
        task_id: task.id,
        completed_by: user.id,
        completed_date: getTodayStr()
      }).select().single()
      if (data) setCompletions([...completions, data])
    }
  }

  async function addTask() {
    if (!taskName.trim()) return
    setSaving(true)

    await supabase.from('tasks').insert({
      home_id: home.id,
      name: taskName,
      note: taskNote || null,
      assigned_to: taskAssigned || null,
      days_of_week: taskDays,
      created_by: user.id
    })

    setTaskName('')
    setTaskNote('')
    setTaskDays([1, 2, 3, 4, 5, 6, 7])
    setTaskAssigned('')
    setShowAddTask(false)
    setSaving(false)
    loadAll()
  }

  function toggleDay(day) {
    if (taskDays.includes(day)) {
      setTaskDays(taskDays.filter(d => d !== day))
    } else {
      setTaskDays([...taskDays, day].sort())
    }
  }

  const todayTasks = tasks.filter(t => t.days_of_week.map(Number).includes(currentDay + 1))
  const todayDone = todayTasks.filter(t => completions.find(c => c.task_id === t.id))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 24 }}>⏳</div>
  )

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerSub}>🧹 Sarı Bez</div>
          <div style={styles.headerTitle}>{home.name}</div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.inviteCode}>
            Davet: <strong>{home.invite_code}</strong>
          </div>
          <button style={styles.logoutBtn} onClick={() => supabase.auth.signOut()}>Çıkış</button>
        </div>
      </div>

      {/* Gün seçici */}
      <div style={styles.dayTabs}>
        {DAYS.map((d, i) => (
          <button
            key={i}
            style={{ ...styles.dayTab, ...(i === currentDay ? styles.dayTabActive : {}), ...(i === getTodayIndex() ? styles.dayTabToday : {}) }}
            onClick={() => setCurrentDay(i)}
          >
            {d}
            {i === getTodayIndex() && <div style={styles.todayDot} />}
          </button>
        ))}
      </div>

      {/* İlerleme */}
      <div style={styles.progress}>
        <div style={styles.progressText}>
          <span style={styles.dayTitle}>{DAYS_FULL[currentDay]}</span>
          <span style={styles.progressCount}>{todayDone.length}/{todayTasks.length} tamamlandı</span>
        </div>
        <div style={styles.progressBar}>
          <div style={{
            ...styles.progressFill,
            width: todayTasks.length ? `${(todayDone.length / todayTasks.length) * 100}%` : '0%'
          }} />
        </div>
      </div>

      {/* Görev listesi */}
      <div style={styles.taskList}>
        {todayTasks.length === 0 && (
          <div style={styles.emptyState}>🎉 Bugün görev yok!</div>
        )}
        {todayTasks.map(task => {
          const done = !!completions.find(c => c.task_id === task.id)
          const assignedProfile = task.assigned_to ? profiles[task.assigned_to] : null
          const completedBy = completions.find(c => c.task_id === task.id)
          const completedProfile = completedBy ? profiles[completedBy.completed_by] : null

          return (
            <div
              key={task.id}
              style={{ ...styles.taskItem, ...(done ? styles.taskDone : {}) }}
              onClick={() => toggleTask(task)}
            >
              <div style={{ ...styles.checkbox, ...(done ? styles.checkboxDone : {}) }}>
                {done && '✓'}
              </div>
              <div style={styles.taskInfo}>
                <div style={styles.taskName}>{task.name}</div>
                {task.note && <div style={styles.taskNote}>{task.note}</div>}
                {completedProfile && (
                  <div style={styles.completedBy}>✓ {completedProfile.display_name} tamamladı</div>
                )}
              </div>
              {assignedProfile && (
                <div style={styles.assignedBadge}>
                  {assignedProfile.display_name}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Görev ekle butonu */}
      {!showAddTask && (
        <button style={styles.addBtn} onClick={() => setShowAddTask(true)}>
          + Görev Ekle
        </button>
      )}

      {/* Görev ekleme formu */}
      {showAddTask && (
        <div style={styles.addForm}>
          <h3 style={styles.formTitle}>Yeni Görev</h3>

          <input
            style={styles.input}
            placeholder="Görev adı (örn: Bulaşık yıkama)"
            value={taskName}
            onChange={e => setTaskName(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Not (isteğe bağlı)"
            value={taskNote}
            onChange={e => setTaskNote(e.target.value)}
          />

          {/* Gün seçimi */}
          <div style={styles.formLabel}>Hangi günler?</div>
          <div style={styles.dayPicker}>
            {DAYS.map((d, i) => (
              <button
                key={i}
                style={{ ...styles.dayPickerBtn, ...(taskDays.includes(i + 1) ? styles.dayPickerBtnActive : {}) }}
                onClick={() => toggleDay(i + 1)}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Kişi seçimi */}
          <div style={styles.formLabel}>Görevli (isteğe bağlı)</div>
          <select
            style={styles.input}
            value={taskAssigned}
            onChange={e => setTaskAssigned(e.target.value)}
          >
            <option value="">Herkes</option>
            {Object.values(profiles).map(p => (
              <option key={p.id} value={p.id}>{p.display_name}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button style={styles.saveBtn} onClick={addTask} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button style={styles.cancelBtn} onClick={() => setShowAddTask(false)}>
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f0eb',
    fontFamily: 'sans-serif',
    paddingBottom: 40,
  },
  header: {
    background: '#1a1a2e',
    color: 'white',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSub: { fontSize: 12, color: '#aaa', marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: 700 },
  headerRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  inviteCode: { fontSize: 12, color: '#f0a500', background: 'rgba(240,165,0,0.15)', padding: '4px 10px', borderRadius: 20 },
  logoutBtn: { background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer' },
  dayTabs: { display: 'flex', padding: '16px 16px 0', gap: 4, overflowX: 'auto' },
  dayTab: {
    flex: 1, padding: '8px 4px', border: 'none', background: 'transparent',
    fontSize: 13, fontWeight: 500, color: '#8a8a9a', cursor: 'pointer',
    borderBottom: '3px solid transparent', position: 'relative', minWidth: 40,
  },
  dayTabActive: { color: '#1a1a2e', borderBottomColor: '#1a1a2e', fontWeight: 700 },
  dayTabToday: { color: '#f0a500' },
  todayDot: { width: 4, height: 4, background: '#f0a500', borderRadius: '50%', margin: '2px auto 0' },
  progress: { padding: '16px 24px 8px' },
  progressText: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayTitle: { fontSize: 20, fontWeight: 700, color: '#1a1a2e' },
  progressCount: { fontSize: 13, color: '#8a8a9a' },
  progressBar: { height: 6, background: '#e8e2da', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #f0a500, #e07b39)', borderRadius: 99, transition: 'width 0.3s' },
  taskList: { padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  taskItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'white', borderRadius: 14, padding: '14px 16px',
    border: '1.5px solid #e8e2da', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  taskDone: { opacity: 0.4 },
  checkbox: {
    width: 24, height: 24, borderRadius: 7, border: '2px solid #e8e2da',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, color: 'white', flexShrink: 0,
  },
  checkboxDone: { background: '#bbb', borderColor: '#bbb' },
  taskInfo: { flex: 1 },
  taskName: { fontSize: 15, fontWeight: 500, color: '#1a1a2e' },
  taskNote: { fontSize: 12, color: '#8a8a9a', marginTop: 2 },
  completedBy: { fontSize: 11, color: '#3ab0c8', marginTop: 3 },
  assignedBadge: {
    fontSize: 11, fontWeight: 600, background: '#fff8e6',
    color: '#f0a500', padding: '3px 8px', borderRadius: 20,
  },
  emptyState: { textAlign: 'center', padding: 48, color: '#8a8a9a', fontSize: 16 },
  addBtn: {
    margin: '16px 16px 0', width: 'calc(100% - 32px)', padding: 14,
    background: '#1a1a2e', color: 'white', border: 'none',
    borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
  addForm: {
    margin: '16px', background: 'white', borderRadius: 16,
    padding: '20px', border: '1.5px solid #e8e2da',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  formTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0 },
  formLabel: { fontSize: 12, fontWeight: 600, color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8e2da',
    fontSize: 14, outline: 'none', fontFamily: 'sans-serif',
  },
  dayPicker: { display: 'flex', gap: 6 },
  dayPickerBtn: {
    flex: 1, padding: '8px 4px', borderRadius: 8, border: '1.5px solid #e8e2da',
    background: 'white', fontSize: 12, fontWeight: 500, color: '#8a8a9a', cursor: 'pointer',
  },
  dayPickerBtnActive: { background: '#f0a500', borderColor: '#f0a500', color: 'white' },
  saveBtn: {
    flex: 1, padding: 12, borderRadius: 10, border: 'none',
    background: '#f0a500', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  cancelBtn: {
    flex: 1, padding: 12, borderRadius: 10, border: '1.5px solid #e8e2da',
    background: 'white', color: '#8a8a9a', fontSize: 14, cursor: 'pointer',
  },
}
