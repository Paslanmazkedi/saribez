import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const DAYS_FULL = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

const THEMES = [
  { primary: '#F0A500', bg: '#FFF8E1', dark: '#1a1a2e' },
  { primary: '#E91E8C', bg: '#FFF0F5', dark: '#2D0A1E' },
  { primary: '#7C3AED', bg: '#F5F0FF', dark: '#1A0A2E' },
  { primary: '#10B981', bg: '#F0FFF8', dark: '#0A2E1A' },
  { primary: '#3B82F6', bg: '#F0F5FF', dark: '#0A1A2E' },
  { primary: '#F97316', bg: '#FFF5F0', dark: '#2E1A0A' },
]

function getTodayIndex() {
  const d = new Date().getDay()
  return d === 0 ? 6 : d - 1
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function Weekly({ user, home, theme: themePrimary }) {
  const theme = THEMES.find(t => t.primary === themePrimary) || THEMES[0]

  const [tasks, setTasks] = useState([])
  const [completions, setCompletions] = useState([])
  const [profiles, setProfiles] = useState({})
  const [currentDay, setCurrentDay] = useState(getTodayIndex())
  const [showAddTask, setShowAddTask] = useState(false)
  const [loading, setLoading] = useState(true)

  const [taskName, setTaskName] = useState('')
  const [taskNote, setTaskNote] = useState('')
  const [taskDays, setTaskDays] = useState([1, 2, 3, 4, 5, 6, 7])
  const [taskAssigned, setTaskAssigned] = useState('')
  const [saving, setSaving] = useState(false)

  // Edit/delete
  const [editingTask, setEditingTask] = useState(null)
  const [deleteModal, setDeleteModal] = useState(null) // silinecek task
  const [editName, setEditName] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editDays, setEditDays] = useState([])
  const [editAssigned, setEditAssigned] = useState('')

  useEffect(() => { loadAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoading(true)

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('home_id', home.id)
      .eq('is_active', true)

    const { data: completionsData } = await supabase
      .from('task_completions')
      .select('*')
      .eq('completed_date', getTodayStr())

    const { data: membersData } = await supabase
      .from('home_members')
      .select('user_id')
      .eq('home_id', home.id)

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
      await supabase.from('task_completions').delete().eq('id', existing.id)
      setCompletions(completions.filter(c => c.id !== existing.id))
    } else {
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
      days_of_week: taskDays.map(Number),
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

  async function deleteTask(type) {
    const task = deleteModal
    if (!task) return
    if (type === 'day') {
      const newDays = task.days_of_week.map(Number).filter(d => d !== currentDay + 1)
      if (newDays.length === 0) {
        await supabase.from('tasks').update({ is_active: false }).eq('id', task.id)
        setTasks(tasks.filter(t => t.id !== task.id))
      } else {
        await supabase.from('tasks').update({ days_of_week: newDays }).eq('id', task.id)
        setTasks(tasks.map(t => t.id === task.id ? { ...t, days_of_week: newDays } : t))
      }
    } else {
      await supabase.from('tasks').update({ is_active: false }).eq('id', task.id)
      setTasks(tasks.filter(t => t.id !== task.id))
    }
    setDeleteModal(null)
  }

  async function saveEditTask() {
    if (!editName.trim()) return
    await supabase.from('tasks').update({
      name: editName.trim(),
      note: editNote.trim() || null,
      assigned_to: editAssigned || null,
      days_of_week: editDays.map(Number),
    }).eq('id', editingTask.id)
    setTasks(tasks.map(t => t.id === editingTask.id
      ? { ...t, name: editName, note: editNote || null, assigned_to: editAssigned || null, days_of_week: editDays }
      : t
    ))
    setEditingTask(null)
  }

  function startEdit(task) {
    setEditingTask(task)
    setEditName(task.name)
    setEditNote(task.note || '')
    setEditDays(task.days_of_week.map(Number))
    setEditAssigned(task.assigned_to || '')
  }

  function toggleEditDay(day) {
    if (editDays.includes(day)) {
      setEditDays(editDays.filter(d => d !== day))
    } else {
      setEditDays([...editDays, day].sort((a, b) => a - b))
    }
  }

  function toggleDay(day) {
    if (taskDays.includes(day)) {
      setTaskDays(taskDays.filter(d => d !== day))
    } else {
      setTaskDays([...taskDays, day].sort((a, b) => a - b))
    }
  }

  const todayTasks = tasks.filter(t => t.days_of_week.map(Number).includes(currentDay + 1))
  const todayDone = todayTasks.filter(t => completions.find(c => c.task_id === t.id))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, fontSize: 24, background: theme.bg }}>⏳</div>
  )

  return (
    <div style={{ ...styles.container, background: theme.bg }}>

      {/* Edit modal */}
      {editingTask && (
        <div style={styles.modalOverlay} onClick={() => setEditingTask(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Görevi Düzenle</h3>
            <input style={styles.input} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Görev adı" />
            <input style={styles.input} value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Not (isteğe bağlı)" />
            <div style={styles.formLabel}>Hangi günler?</div>
            <div style={styles.dayPicker}>
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  style={{
                    ...styles.dayPickerBtn,
                    ...(editDays.includes(i + 1) ? { background: theme.primary, borderColor: theme.primary, color: 'white' } : {})
                  }}
                  onClick={() => toggleEditDay(i + 1)}
                >
                  {d}
                </button>
              ))}
            </div>
            <div style={styles.formLabel}>Görevli</div>
            <select style={styles.input} value={editAssigned} onChange={e => setEditAssigned(e.target.value)}>
              <option value="">Herkes</option>
              {Object.values(profiles).map(p => (
                <option key={p.id} value={p.id}>{p.avatar_emoji || '😊'} {p.display_name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button style={{ ...styles.saveBtn, background: theme.primary }} onClick={saveEditTask}>Kaydet</button>
              <button style={styles.cancelBtn} onClick={() => setEditingTask(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Silme modal */}
{deleteModal && (
  <div style={styles.modalOverlay} onClick={() => setDeleteModal(null)}>
    <div style={styles.modal} onClick={e => e.stopPropagation()}>
      <div style={styles.modalHeader}>
        <h3 style={styles.modalTitle}>Görevi Sil</h3>
        <button style={styles.modalClose} onClick={() => setDeleteModal(null)}>✕</button>
      </div>
      <p style={styles.modalDesc}>
        <strong>"{deleteModal.name}"</strong> görevini nasıl silmek istiyorsun?
      </p>
      <button style={styles.deleteDayBtn} onClick={() => deleteTask('day')}>
        📅 Sadece {DAYS_FULL[currentDay]} gününden kaldır
      </button>
      <button style={styles.deleteAllBtn} onClick={() => deleteTask('all')}>
        🗑️ Tüm haftadan sil
      </button>
      <button style={styles.cancelBtn} onClick={() => setDeleteModal(null)}>
        İptal
      </button>
    </div>
  </div>
)}

      {/* Gün seçici */}
      <div style={styles.dayTabs}>
        {DAYS.map((d, i) => (
          <button
            key={i}
            style={{
              ...styles.dayTab,
              ...(i === currentDay ? { ...styles.dayTabActive, borderBottomColor: theme.primary, color: theme.dark } : {}),
              ...(i === getTodayIndex() && i !== currentDay ? { color: theme.primary } : {})
            }}
            onClick={() => setCurrentDay(i)}
          >
            {d}
            {i === getTodayIndex() && <div style={{ ...styles.todayDot, background: theme.primary }} />}
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
            width: todayTasks.length ? `${(todayDone.length / todayTasks.length) * 100}%` : '0%',
            background: `linear-gradient(90deg, ${theme.primary}, ${theme.primary}99)`
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
            <div key={task.id} style={{ ...styles.taskItem, ...(done ? styles.taskDone : {}) }}>
              <div
                style={{
                  ...styles.checkbox,
                  ...(done ? { background: theme.primary, borderColor: theme.primary } : { borderColor: theme.primary + '66' })
                }}
                onClick={() => toggleTask(task)}
              >
                {done && '✓'}
              </div>
              <div style={styles.taskInfo} onClick={() => toggleTask(task)}>
                <div style={styles.taskName}>{task.name}</div>
                {task.note && <div style={styles.taskNote}>{task.note}</div>}
                {completedProfile && (
                  <div style={{ ...styles.completedBy, color: theme.primary }}>
                    ✓ {completedProfile.display_name} tamamladı
                  </div>
                )}
                {assignedProfile && (
                  <div style={{ ...styles.assignedBadge, background: theme.primary + '22', color: theme.primary }}>
                    {assignedProfile.avatar_emoji || '😊'} {assignedProfile.display_name}
                  </div>
                )}
              </div>
              {/* Düzenle / Sil */}
             <div style={styles.taskActions} onClick={e => e.stopPropagation()}>
  <button style={styles.editBtn} onClick={() => startEdit(task)}>✏️</button>
  <button style={styles.deleteBtn} onClick={() => setDeleteModal(task)}>🗑️</button>
</div>
            </div>
          )
        })}
      </div>

      {!showAddTask && (
        <button style={{ ...styles.addBtn, background: theme.dark }} onClick={() => setShowAddTask(true)}>
          + Görev Ekle
        </button>
      )}

      {showAddTask && (
        <div style={styles.addForm}>
          <h3 style={styles.formTitle}>Yeni Haftalık Görev</h3>
          <input style={styles.input} placeholder="Görev adı" value={taskName} onChange={e => setTaskName(e.target.value)} />
          <input style={styles.input} placeholder="Not (isteğe bağlı)" value={taskNote} onChange={e => setTaskNote(e.target.value)} />
          <div style={styles.formLabel}>Hangi günler?</div>
          <div style={styles.dayPicker}>
            {DAYS.map((d, i) => (
              <button
                key={i}
                style={{
                  ...styles.dayPickerBtn,
                  ...(taskDays.includes(i + 1) ? { background: theme.primary, borderColor: theme.primary, color: 'white' } : {})
                }}
                onClick={() => toggleDay(i + 1)}
              >
                {d}
              </button>
            ))}
          </div>
          <div style={styles.formLabel}>Görevli (isteğe bağlı)</div>
          <select style={styles.input} value={taskAssigned} onChange={e => setTaskAssigned(e.target.value)}>
            <option value="">Herkes</option>
            {Object.values(profiles).map(p => (
              <option key={p.id} value={p.id}>{p.avatar_emoji || '😊'} {p.display_name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button style={{ ...styles.saveBtn, background: theme.primary }} onClick={addTask} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button style={styles.cancelBtn} onClick={() => setShowAddTask(false)}>İptal</button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { flex: 1, fontFamily: 'sans-serif', overflowY: 'auto' },
  dayTabs: { display: 'flex', padding: '16px 16px 0', gap: 4, overflowX: 'auto' },
  dayTab: { flex: 1, padding: '8px 4px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 500, color: '#8a8a9a', cursor: 'pointer', borderBottom: '3px solid transparent', position: 'relative', minWidth: 40 },
  dayTabActive: { fontWeight: 700 },
  todayDot: { width: 4, height: 4, borderRadius: '50%', margin: '2px auto 0' },
  progress: { padding: '16px 24px 8px' },
  progressText: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayTitle: { fontSize: 20, fontWeight: 700, color: '#1a1a2e' },
  progressCount: { fontSize: 13, color: '#8a8a9a' },
  progressBar: { height: 6, background: '#e8e2da', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99, transition: 'width 0.3s' },
  taskList: { padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 24 },
  taskItem: { display: 'flex', alignItems: 'center', gap: 12, background: 'white', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #e8e2da', transition: 'all 0.15s' },
  taskDone: { opacity: 0.4 },
  checkbox: { width: 24, height: 24, borderRadius: 7, border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', flexShrink: 0, cursor: 'pointer' },
  taskInfo: { flex: 1, cursor: 'pointer' },
  taskName: { fontSize: 15, fontWeight: 500, color: '#1a1a2e' },
  taskNote: { fontSize: 12, color: '#8a8a9a', marginTop: 2 },
  completedBy: { fontSize: 11, marginTop: 3 },
  assignedBadge: { fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, display: 'inline-block', marginTop: 4 },
  taskActions: { display: 'flex', gap: 4, flexShrink: 0 },
  editBtn: { background: '#f5f5f5', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontSize: 14 },
  deleteBtn: { background: '#fff0f0', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontSize: 14 },
  emptyState: { textAlign: 'center', padding: 48, color: '#8a8a9a', fontSize: 16 },
  addBtn: { margin: '0 16px', width: 'calc(100% - 32px)', padding: 14, color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  addForm: { margin: '0 16px 16px', background: 'white', borderRadius: 16, padding: '20px', border: '1.5px solid #e8e2da', display: 'flex', flexDirection: 'column', gap: 10 },
  formTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0 },
  formLabel: { fontSize: 12, fontWeight: 600, color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: 1 },
  input: { padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8e2da', fontSize: 14, outline: 'none', fontFamily: 'sans-serif' },
  dayPicker: { display: 'flex', gap: 6 },
  dayPickerBtn: { flex: 1, padding: '8px 4px', borderRadius: 8, border: '1.5px solid #e8e2da', background: 'white', fontSize: 12, fontWeight: 500, color: '#8a8a9a', cursor: 'pointer' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 10, border: 'none', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, border: '1.5px solid #e8e2da', background: 'white', color: '#8a8a9a', fontSize: 14, cursor: 'pointer' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalClose: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#999', padding: '0 4px' },
  modalDesc: { fontSize: 14, color: '#555', margin: '4px 0 8px', lineHeight: 1.5 },
  deleteDayBtn: { width: '100%', padding: 13, borderRadius: 12, border: '1.5px solid #e8e2da', background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', marginBottom: 8 },
  deleteAllBtn: { width: '100%', padding: 13, borderRadius: 12, border: '1.5px solid #FFCCCC', background: '#FFF0F0', color: '#CC4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', marginBottom: 8 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 },
  modal: { background: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 10 },
  modalTitle: { fontSize: 17, fontWeight: 700, color: '#1a1a2e', margin: 0 },
}
