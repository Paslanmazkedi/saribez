import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const THEMES = [
  { primary: '#F0A500', bg: '#FFF8E1', dark: '#1a1a2e' },
  { primary: '#E91E8C', bg: '#FFF0F5', dark: '#2D0A1E' },
  { primary: '#7C3AED', bg: '#F5F0FF', dark: '#1A0A2E' },
  { primary: '#10B981', bg: '#F0FFF8', dark: '#0A2E1A' },
  { primary: '#3B82F6', bg: '#F0F5FF', dark: '#0A1A2E' },
  { primary: '#F97316', bg: '#FFF5F0', dark: '#2E1A0A' },
]

export default function General({ user, home, theme: themePrimary }) {
  const theme = THEMES.find(t => t.primary === themePrimary) || THEMES[0]

  const [todos, setTodos] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showDone, setShowDone] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [assigned, setAssigned] = useState('')
  const [saving, setSaving] = useState(false)

  // Edit state
  const [editingTodo, setEditingTodo] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editAssigned, setEditAssigned] = useState('')

  useEffect(() => { loadAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoading(true)

    const { data: todosData } = await supabase
      .from('todos')
      .select('*')
      .eq('home_id', home.id)
      .order('created_at', { ascending: false })

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
      const map = {}
      profilesData?.forEach(p => map[p.id] = p)
      setProfiles(map)
    }

    setTodos(todosData || [])
    setLoading(false)
  }

  async function addTodo() {
    if (!title.trim()) return
    setSaving(true)
    await supabase.from('todos').insert({
      home_id: home.id,
      created_by: user.id,
      assigned_to: assigned || null,
      title: title.trim(),
      note: note.trim() || null,
    })
    setTitle('')
    setNote('')
    setAssigned('')
    setShowAdd(false)
    setSaving(false)
    loadAll()
  }

  async function toggleTodo(todo) {
    const nowDone = !todo.is_done
    await supabase.from('todos').update({
      is_done: nowDone,
      done_by: nowDone ? user.id : null,
      done_at: nowDone ? new Date().toISOString() : null,
    }).eq('id', todo.id)
    setTodos(todos.map(t => t.id === todo.id ? { ...t, is_done: nowDone, done_by: nowDone ? user.id : null } : t))
  }

  async function deleteTodo(id) {
    await supabase.from('todos').delete().eq('id', id)
    setTodos(todos.filter(t => t.id !== id))
  }

  async function saveEdit() {
    if (!editTitle.trim()) return
    await supabase.from('todos').update({
      title: editTitle.trim(),
      note: editNote.trim() || null,
      assigned_to: editAssigned || null,
    }).eq('id', editingTodo.id)
    setTodos(todos.map(t => t.id === editingTodo.id
      ? { ...t, title: editTitle.trim(), note: editNote.trim() || null, assigned_to: editAssigned || null }
      : t
    ))
    setEditingTodo(null)
  }

  function startEdit(todo) {
    setEditingTodo(todo)
    setEditTitle(todo.title)
    setEditNote(todo.note || '')
    setEditAssigned(todo.assigned_to || '')
  }

  const pending = todos.filter(t => !t.is_done)
  const done = todos.filter(t => t.is_done)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, fontSize: 24, background: theme.bg }}>⏳</div>
  )

  return (
    <div style={{ ...styles.container, background: theme.bg }}>

      {/* Edit modal */}
      {editingTodo && (
        <div style={styles.modalOverlay} onClick={() => setEditingTodo(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Görevi Düzenle</h3>
            <input
              style={styles.input}
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="Görev adı"
            />
            <input
              style={styles.input}
              value={editNote}
              onChange={e => setEditNote(e.target.value)}
              placeholder="Not (isteğe bağlı)"
            />
            <div style={styles.formLabel}>Görevli</div>
            <select style={styles.input} value={editAssigned} onChange={e => setEditAssigned(e.target.value)}>
              <option value="">Herkes</option>
              {Object.values(profiles).map(p => (
                <option key={p.id} value={p.id}>{p.avatar_emoji || '😊'} {p.display_name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button style={{ ...styles.saveBtn, background: theme.primary }} onClick={saveEdit}>Kaydet</button>
              <button style={styles.cancelBtn} onClick={() => setEditingTodo(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.content}>
        {/* Bekleyen görevler */}
        {pending.length === 0 && !showAdd && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>✅</div>
            <p style={styles.emptyText}>Tüm görevler tamamlandı!</p>
          </div>
        )}

        {pending.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            profiles={profiles}
            theme={theme}
            onToggle={() => toggleTodo(todo)}
            onEdit={() => startEdit(todo)}
            onDelete={() => deleteTodo(todo.id)}
          />
        ))}

        {/* Görev ekle formu */}
        {showAdd && (
          <div style={styles.addForm}>
            <input
              style={styles.input}
              placeholder="Ne yapılacak?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && addTodo()}
            />
            <input
              style={styles.input}
              placeholder="Not (isteğe bağlı)"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <div style={styles.formLabel}>Görevli (isteğe bağlı)</div>
            <select style={styles.input} value={assigned} onChange={e => setAssigned(e.target.value)}>
              <option value="">Herkes</option>
              {Object.values(profiles).map(p => (
                <option key={p.id} value={p.id}>{p.avatar_emoji || '😊'} {p.display_name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button style={{ ...styles.saveBtn, background: theme.primary }} onClick={addTodo} disabled={saving}>
                {saving ? '...' : 'Ekle'}
              </button>
              <button style={styles.cancelBtn} onClick={() => setShowAdd(false)}>İptal</button>
            </div>
          </div>
        )}

        {/* Ekle butonu */}
        {!showAdd && (
          <button style={{ ...styles.addBtn, background: theme.dark }} onClick={() => setShowAdd(true)}>
            + Görev Ekle
          </button>
        )}

        {/* Tamamlananlar */}
        {done.length > 0 && (
          <div style={styles.doneSection}>
            <button style={styles.doneSectionBtn} onClick={() => setShowDone(!showDone)}>
              {showDone ? '▲' : '▼'} Tamamlananlar ({done.length})
            </button>
            {showDone && done.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                profiles={profiles}
                theme={theme}
                onToggle={() => toggleTodo(todo)}
                onEdit={() => startEdit(todo)}
                onDelete={() => deleteTodo(todo.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TodoItem({ todo, profiles, theme, onToggle, onEdit, onDelete }) {
  const [showActions, setShowActions] = useState(false)
  const assignedProfile = todo.assigned_to ? profiles[todo.assigned_to] : null
  const doneProfile = todo.done_by ? profiles[todo.done_by] : null

  return (
    <div style={{ ...styles.todoItem, ...(todo.is_done ? styles.todoDone : {}) }}>
      <div
        style={{
          ...styles.checkbox,
          ...(todo.is_done
            ? { background: theme.primary, borderColor: theme.primary }
            : { borderColor: theme.primary + '66' })
        }}
        onClick={onToggle}
      >
        {todo.is_done && '✓'}
      </div>

      <div style={styles.todoInfo} onClick={() => setShowActions(!showActions)}>
        <div style={styles.todoTitle}>{todo.title}</div>
        {todo.note && <div style={styles.todoNote}>{todo.note}</div>}
        {assignedProfile && (
          <div style={{ ...styles.assignedBadge, color: theme.primary }}>
            {assignedProfile.avatar_emoji || '😊'} {assignedProfile.display_name}
          </div>
        )}
        {doneProfile && (
          <div style={{ ...styles.doneBadge, color: theme.primary }}>
            ✓ {doneProfile.display_name} tamamladı
          </div>
        )}
      </div>

      {/* Aksiyon butonları */}
      {showActions && (
        <div style={styles.actions}>
          <button style={styles.editBtn} onClick={(e) => { e.stopPropagation(); onEdit(); setShowActions(false) }}>✏️</button>
          <button style={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); onDelete(); setShowActions(false) }}>🗑️</button>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { flex: 1, fontFamily: 'sans-serif', overflowY: 'auto' },
  content: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 24 },
  todoItem: { display: 'flex', alignItems: 'flex-start', gap: 12, background: 'white', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #e8e2da', transition: 'all 0.15s' },
  todoDone: { opacity: 0.45 },
  checkbox: { width: 24, height: 24, borderRadius: 7, border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', flexShrink: 0, cursor: 'pointer', marginTop: 1 },
  todoInfo: { flex: 1, cursor: 'pointer' },
  todoTitle: { fontSize: 15, fontWeight: 500, color: '#1a1a2e' },
  todoNote: { fontSize: 12, color: '#8a8a9a', marginTop: 2 },
  assignedBadge: { fontSize: 11, fontWeight: 600, marginTop: 4 },
  doneBadge: { fontSize: 11, marginTop: 3 },
  actions: { display: 'flex', gap: 4, flexShrink: 0 },
  editBtn: { background: '#f5f5f5', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontSize: 14 },
  deleteBtn: { background: '#fff0f0', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontSize: 14 },
  emptyState: { textAlign: 'center', padding: '48px 0' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#8a8a9a' },
  addBtn: { width: '100%', padding: 14, color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
  addForm: { background: 'white', borderRadius: 16, padding: '16px', border: '1.5px solid #e8e2da', display: 'flex', flexDirection: 'column', gap: 10 },
  formLabel: { fontSize: 12, fontWeight: 600, color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: 1 },
  input: { padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8e2da', fontSize: 14, outline: 'none', fontFamily: 'sans-serif' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 10, border: 'none', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, border: '1.5px solid #e8e2da', background: 'white', color: '#8a8a9a', fontSize: 14, cursor: 'pointer' },
  doneSection: { marginTop: 8 },
  doneSectionBtn: { background: 'none', border: 'none', color: '#8a8a9a', fontSize: 13, cursor: 'pointer', padding: '8px 0', width: '100%', textAlign: 'left' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 },
  modal: { background: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 10 },
  modalTitle: { fontSize: 17, fontWeight: 700, color: '#1a1a2e', margin: 0 },
}
