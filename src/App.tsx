import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive,
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  CloudSun,
  CopyPlus,
  Download,
  FileImage,
  Images,
  MapPin,
  Menu,
  Plane,
  Plus,
  Save,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  applyProfile,
  carryEntry,
  COMMON_TRANSLATIONS,
  createBlankEntry,
  profileFromEntry,
  TEMPLATES,
  WEATHER_OPTIONS,
} from './data'
import {
  deleteImage,
  getImage,
  loadEntries,
  loadSettings,
  loadTrips,
  putImage,
  saveEntries,
  saveSettings,
  saveTrips,
} from './storage'
import { renderPassport, resolvePhotoMode } from './templates/passportRenderer'
import type { AppSettings, ArchiveEntry, TripProfile } from './types'

type Page = 'library' | 'editor' | 'trips' | 'settings'
type EditorTab = 'photo' | 'archive' | 'capture' | 'travel' | 'memory'

const TAB_ITEMS: Array<{ id: EditorTab; label: string; icon: typeof Camera }> = [
  { id: 'photo', label: '照片', icon: Images },
  { id: 'archive', label: '典藏', icon: Archive },
  { id: 'capture', label: '拍攝', icon: MapPin },
  { id: 'travel', label: '旅程', icon: Plane },
  { id: 'memory', label: '短句', icon: Sparkles },
]

function formatDate(value: string) {
  if (!value) return '尚未設定日期'
  return value.replaceAll('-', '.')
}

function archiveTitle(entry: ArchiveEntry) {
  return entry.cityZh || entry.cityEn || `未命名典藏 ${String(entry.archiveNo).padStart(3, '0')}`
}

function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-mark"><Archive size={30} /></div>
      <h3>建立第一張旅行典藏</h3>
      <p>照片與旅行資料會保存在這台裝置，完成後可匯出成 Instagram 限時動態。</p>
      <button className="primary-button" onClick={onCreate}><Plus size={18} />新增典藏</button>
    </div>
  )
}

function App() {
  const [page, setPage] = useState<Page>('library')
  const [editorTab, setEditorTab] = useState<EditorTab>('photo')
  const [entries, setEntries] = useState<ArchiveEntry[]>(() => loadEntries())
  const [trips, setTrips] = useState<TripProfile[]>(() => loadTrips())
  const [settings, setSettingsState] = useState<AppSettings>(() => loadSettings())
  const [draft, setDraft] = useState<ArchiveEntry | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [safeZone, setSafeZone] = useState(settings.showSafeZoneByDefault)
  const [fontsReady, setFontsReady] = useState(false)
  const [savedState, setSavedState] = useState<'saved' | 'saving'>('saved')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const nextArchiveNo = useMemo(
    () => Math.max(0, ...entries.map(entry => entry.archiveNo)) + 1,
    [entries],
  )

  useEffect(() => {
    let active = true
    document.fonts.ready.then(() => {
      if (active) setFontsReady(true)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    let objectUrl: string | undefined
    setImage(null)
    setImageUrl(null)
    if (!draft?.photoId) return
    getImage(draft.photoId).then(blob => {
      if (!blob || !active) return
      objectUrl = URL.createObjectURL(blob)
      const nextImage = new Image()
      nextImage.onload = () => {
        if (!active) return
        setImage(nextImage)
        setImageUrl(objectUrl ?? null)
      }
      nextImage.src = objectUrl
    })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [draft?.photoId])

  useEffect(() => {
    if (!draft || !canvasRef.current || !fontsReady) return
    renderPassport(canvasRef.current, draft, image, { showSafeZone: safeZone })
  }, [draft, image, safeZone, fontsReady])

  useEffect(() => {
    if (!draft) return
    setSavedState('saving')
    const timer = window.setTimeout(() => {
      setEntries(current => {
        const exists = current.some(item => item.id === draft.id)
        const next = exists
          ? current.map(item => item.id === draft.id ? draft : item)
          : [draft, ...current]
        saveEntries(next)
        return next
      })
      setSavedState('saved')
    }, 650)
    return () => window.clearTimeout(timer)
  }, [draft])

  function updateSettings(next: AppSettings) {
    setSettingsState(next)
    saveSettings(next)
  }

  function updateDraft<K extends keyof ArchiveEntry>(key: K, value: ArchiveEntry[K]) {
    setDraft(current => current ? { ...current, [key]: value, updatedAt: new Date().toISOString() } : current)
  }

  function updateTranslatedField(key: 'cityZh' | 'countryZh' | 'locationZh', value: string) {
    const outputKey = key === 'cityZh' ? 'cityEn' : key === 'countryZh' ? 'countryEn' : 'locationEn'
    setDraft(current => {
      if (!current) return current
      const translated = COMMON_TRANSLATIONS[value.trim()]
      return {
        ...current,
        [key]: value,
        ...(translated ? { [outputKey]: translated } : {}),
        updatedAt: new Date().toISOString(),
      }
    })
  }

  function createNew() {
    setDraft(createBlankEntry(nextArchiveNo))
    setImage(null)
    setEditorTab('photo')
    setSafeZone(settings.showSafeZoneByDefault)
    setPage('editor')
  }

  function editEntry(entry: ArchiveEntry) {
    setDraft({ ...entry })
    setEditorTab('photo')
    setSafeZone(settings.showSafeZoneByDefault)
    setPage('editor')
  }

  function saveNow(entry = draft) {
    if (!entry) return
    const saved = { ...entry, updatedAt: new Date().toISOString() }
    setDraft(saved)
    setEntries(current => {
      const next = current.some(item => item.id === saved.id)
        ? current.map(item => item.id === saved.id ? saved : item)
        : [saved, ...current]
      saveEntries(next)
      return next
    })
    setSavedState('saved')
  }

  async function removeEntry(entry: ArchiveEntry) {
    if (!window.confirm(`確定刪除「${archiveTitle(entry)}」嗎？`)) return
    await deleteImage(entry.photoId)
    const next = entries.filter(item => item.id !== entry.id)
    setEntries(next)
    saveEntries(next)
  }

  async function handlePhoto(file?: File) {
    if (!file || !draft) return
    const photoId = draft.photoId ?? `photo-${draft.id}`
    await putImage(photoId, file)
    const url = URL.createObjectURL(file)
    const probe = new Image()
    probe.onload = () => {
      updateDraft('photoId', photoId)
      setDraft(current => current ? {
        ...current,
        photoId,
        photoWidth: probe.naturalWidth,
        photoHeight: probe.naturalHeight,
        updatedAt: new Date().toISOString(),
      } : current)
      URL.revokeObjectURL(url)
    }
    probe.src = url
  }

  function createNextWithCarry() {
    if (!draft) return
    saveNow()
    const next = carryEntry(draft, nextArchiveNo)
    setDraft(next)
    setImage(null)
    setImageUrl(null)
    setEditorTab('photo')
  }

  function applyTrip(id: string) {
    const profile = trips.find(item => item.id === id)
    if (!profile || !draft) return
    setDraft({ ...applyProfile(draft, profile), updatedAt: new Date().toISOString() })
  }

  function saveTripProfile() {
    if (!draft) return
    const profile = profileFromEntry(draft)
    const next = trips.some(item => item.id === profile.id)
      ? trips.map(item => item.id === profile.id ? profile : item)
      : [profile, ...trips]
    setTrips(next)
    saveTrips(next)
    setDraft({ ...draft, tripId: profile.id, tripLabel: profile.label, updatedAt: new Date().toISOString() })
  }

  function removeTrip(id: string) {
    const next = trips.filter(item => item.id !== id)
    setTrips(next)
    saveTrips(next)
  }

  async function exportImage(kind: 'instagram' | 'archive') {
    if (!draft) return
    saveNow()
    await document.fonts.ready
    const canvas = document.createElement('canvas')
    const scale = kind === 'archive' ? 2 : 1
    renderPassport(canvas, draft, image, { scale, showSafeZone: false })
    const mime = kind === 'archive' ? 'image/png' : 'image/jpeg'
    const quality = kind === 'archive' ? undefined : settings.jpegQuality
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, quality))
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const city = (draft.cityEn || 'travel-archive').toLowerCase().replace(/\s+/g, '-')
    link.href = url
    link.download = `${city}-${draft.date}-${String(draft.archiveNo).padStart(3, '0')}-${kind}.${kind === 'archive' ? 'png' : 'jpg'}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const resolvedMode = draft ? resolvePhotoMode(draft, image) : 'portrait'
  const lowResolution = Boolean(
    draft?.photoWidth && draft.photoHeight && Math.min(draft.photoWidth, draft.photoHeight) < 1080,
  )

  const nav = [
    { id: 'library' as const, label: '典藏庫', icon: Archive },
    { id: 'trips' as const, label: '旅行資料', icon: Plane },
    { id: 'settings' as const, label: '設定', icon: Settings },
  ]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Archive size={22} /></div>
          <div><strong>旅行典藏</strong><span>TRAVEL ARCHIVE</span></div>
          <button className="icon-button mobile-close" aria-label="關閉選單" onClick={() => setMobileNavOpen(false)}><X size={20} /></button>
        </div>
        <nav>
          {nav.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={page === item.id ? 'active' : ''}
                onClick={() => { setPage(item.id); setMobileNavOpen(false) }}
              >
                <Icon size={19} />{item.label}
              </button>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <span>Passport Template</span>
          <strong>Version 1.0</strong>
        </div>
      </aside>

      {mobileNavOpen && <button className="nav-scrim" aria-label="關閉選單" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-area">
        <div className="mobile-topbar">
          <button className="icon-button" aria-label="開啟選單" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button>
          <strong>旅行典藏</strong>
          <button className="icon-button" aria-label="新增典藏" onClick={createNew}><Plus size={21} /></button>
        </div>

        {page === 'library' && (
          <div className="page-content">
            <header className="page-header">
              <div><span className="eyebrow">YOUR COLLECTION</span><h1>我的旅行典藏</h1><p>把每一次抵達，保存成同一套長久的收藏。</p></div>
              <button className="primary-button desktop-create" onClick={createNew}><Plus size={18} />新增典藏</button>
            </header>

            <section>
              <div className="section-heading"><div><h2>模板</h2><p>目前使用 Passport 1.0，其他比例可以在未來持續加入。</p></div></div>
              <div className="template-grid">
                {TEMPLATES.map(template => (
                  <article key={template.id} className={`template-card ${template.status === 'future' ? 'future' : ''}`}>
                    <div className={`template-visual ${template.id}`}>
                      {template.status === 'available' ? <><span>PASSPORT</span><strong>SEOUL</strong><i /></> : <Sparkles size={24} />}
                    </div>
                    <div className="template-copy">
                      <div className="template-title"><h3>{template.nameZh}</h3>{template.status === 'available' ? <span className="status-chip">使用中</span> : <span className="future-chip">未來擴充</span>}</div>
                      <p>{template.descriptionZh}</p>
                      <small>{template.formatLabel}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="collection-section">
              <div className="section-heading"><div><h2>作品</h2><p>{entries.length ? `目前收藏 ${entries.length} 張作品` : '尚未建立作品'}</p></div></div>
              {entries.length === 0 ? <EmptyState onCreate={createNew} /> : (
                <div className="entry-grid">
                  {entries.map(entry => (
                    <article className="entry-card" key={entry.id}>
                      <button className="entry-main" onClick={() => editEntry(entry)}>
                        <div className="entry-number">No.{String(entry.archiveNo).padStart(3, '0')}</div>
                        <span className="entry-city">{archiveTitle(entry)}</span>
                        <strong>{entry.locationZh || entry.locationEn || '尚未填寫拍攝地點'}</strong>
                        <small>{formatDate(entry.date)} · {entry.time}</small>
                        <ChevronRight size={18} />
                      </button>
                      <button className="entry-delete" aria-label={`刪除${archiveTitle(entry)}`} onClick={() => removeEntry(entry)}><Trash2 size={16} /></button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {page === 'trips' && (
          <div className="page-content narrow-page">
            <header className="page-header"><div><span className="eyebrow">TRIP PROFILES</span><h1>旅行資料</h1><p>同一趟旅行只填一次，之後新增照片可以直接沿用。</p></div></header>
            {trips.length === 0 ? (
              <div className="empty-state compact"><div className="empty-mark"><Plane size={28} /></div><h3>尚未儲存旅行資料</h3><p>在典藏編輯器的「旅程」分頁填寫資料後，點選「儲存為旅行資料」。</p></div>
            ) : (
              <div className="trip-list">
                {trips.map(trip => (
                  <article className="trip-card" key={trip.id}>
                    <div className="trip-icon"><Plane size={20} /></div>
                    <div><h3>{trip.label}</h3><p>{trip.cityZh || trip.cityEn} · {trip.origin || '---'} → {trip.destination || '---'}</p><small>{formatDate(trip.arrivalDate)}–{formatDate(trip.departureDate)}</small></div>
                    <button className="icon-button" aria-label={`刪除${trip.label}`} onClick={() => removeTrip(trip.id)}><Trash2 size={17} /></button>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {page === 'settings' && (
          <div className="page-content narrow-page">
            <header className="page-header"><div><span className="eyebrow">PREFERENCES</span><h1>設定</h1><p>調整連續建立與匯出偏好。</p></div></header>
            <div className="settings-card">
              <div className="setting-row">
                <div><h3>新增下一張時沿用資料</h3><p>保留上一張的城市、日期、天氣、相機、航班與所有文字，只更換照片及流水號。</p></div>
                <button className={`switch ${settings.carryOverByDefault ? 'on' : ''}`} role="switch" aria-checked={settings.carryOverByDefault} onClick={() => updateSettings({ ...settings, carryOverByDefault: !settings.carryOverByDefault })}><span /></button>
              </div>
              <div className="setting-row">
                <div><h3>預設顯示 Instagram 安全區</h3><p>編輯時顯示上下介面可能遮住的區域，匯出時不會出現。</p></div>
                <button className={`switch ${settings.showSafeZoneByDefault ? 'on' : ''}`} role="switch" aria-checked={settings.showSafeZoneByDefault} onClick={() => updateSettings({ ...settings, showSafeZoneByDefault: !settings.showSafeZoneByDefault })}><span /></button>
              </div>
              <Field label="Instagram JPEG 品質" hint="建議維持 94%，避免檔案過大又保留文字與照片細節。">
                <div className="range-row"><input type="range" min="88" max="100" value={Math.round(settings.jpegQuality * 100)} onChange={event => updateSettings({ ...settings, jpegQuality: Number(event.target.value) / 100 })} /><strong>{Math.round(settings.jpegQuality * 100)}%</strong></div>
              </Field>
              <div className="storage-note"><Check size={18} /><div><strong>本機優先保存</strong><span>典藏資料與照片保存在這台裝置的瀏覽器中，不會自動上傳雲端。</span></div></div>
            </div>
          </div>
        )}

        {page === 'editor' && draft && (
          <div className="editor-page">
            <header className="editor-toolbar">
              <div className="toolbar-left">
                <button className="icon-button" aria-label="返回典藏庫" onClick={() => { saveNow(); setPage('library') }}><ArrowLeft size={20} /></button>
                <div><strong>{archiveTitle(draft)}</strong><span>{savedState === 'saving' ? '正在儲存…' : '已自動儲存'}</span></div>
              </div>
              <div className="toolbar-actions">
                <button className="secondary-button" onClick={() => exportImage('archive')}><Download size={17} />高解析典藏版</button>
                <button className="primary-button" onClick={() => exportImage('instagram')}><Download size={17} />匯出限時動態</button>
              </div>
            </header>

            <div className="editor-workspace">
              <section className="preview-column">
                <div className="preview-topline">
                  <div><span className="live-dot" />即時預覽</div>
                  <button className={`safe-toggle ${safeZone ? 'active' : ''}`} onClick={() => setSafeZone(value => !value)}>IG安全區</button>
                </div>
                <div className="canvas-stage"><canvas ref={canvasRef} /></div>
                <div className="preview-meta">
                  <span><FileImage size={15} />1080 × 1920</span>
                  <span>{resolvedMode === 'landscape' ? '完整橫式照片模式' : '直式照片模式'}</span>
                  {lowResolution ? <span className="quality-warning">照片解析度偏低</span> : draft.photoId ? <span className="quality-good"><Check size={14} />畫質良好</span> : <span>尚未選擇照片</span>}
                </div>
              </section>

              <section className="form-column">
                <div className="editor-tabs">
                  {TAB_ITEMS.map(item => {
                    const Icon = item.icon
                    return <button key={item.id} className={editorTab === item.id ? 'active' : ''} onClick={() => setEditorTab(item.id)}><Icon size={17} /><span>{item.label}</span></button>
                  })}
                </div>
                <div className="form-scroll">
                  {editorTab === 'photo' && (
                    <div className="form-section">
                      <div className="form-intro"><h2>照片</h2><p>原始照片會獨立保存；預覽縮小不會影響最後匯出畫質。</p></div>
                      <input ref={fileInputRef} className="hidden-input" type="file" accept="image/*" onChange={event => handlePhoto(event.target.files?.[0])} />
                      <button className={`photo-drop ${imageUrl ? 'has-photo' : ''}`} onClick={() => fileInputRef.current?.click()}>
                        {imageUrl ? <img src={imageUrl} alt="已選擇的旅行照片" /> : <div><Upload size={26} /><strong>選擇旅行照片</strong><span>建議至少 1080 × 1920 或 1920 × 1080</span></div>}
                        {imageUrl && <span className="replace-photo"><Camera size={16} />更換照片</span>}
                      </button>
                      {lowResolution && <div className="notice warning"><span>!</span><p>照片短邊小於1080px，放大後可能不夠清晰。原圖仍會保留，但建議改用較高解析度照片。</p></div>}
                      <Field label="照片呈現方式" hint="自動模式會依照片比例選擇直式或完整橫式版。">
                        <div className="segmented">
                          {[['auto', '自動判斷'], ['portrait', '直式照片'], ['landscape', '完整橫式']] .map(([value, label]) => <button key={value} className={draft.photoMode === value ? 'active' : ''} onClick={() => updateDraft('photoMode', value as ArchiveEntry['photoMode'])}>{label}</button>)}
                        </div>
                      </Field>
                      {resolvedMode === 'portrait' && image && <>
                        <Field label="水平焦點"><div className="range-row"><input type="range" min="0" max="100" value={draft.focusX * 100} onChange={event => updateDraft('focusX', Number(event.target.value) / 100)} /><strong>{Math.round(draft.focusX * 100)}%</strong></div></Field>
                        <Field label="垂直焦點"><div className="range-row"><input type="range" min="0" max="100" value={draft.focusY * 100} onChange={event => updateDraft('focusY', Number(event.target.value) / 100)} /><strong>{Math.round(draft.focusY * 100)}%</strong></div></Field>
                      </>}
                    </div>
                  )}

                  {editorTab === 'archive' && (
                    <div className="form-section">
                      <div className="form-intro"><h2>典藏識別</h2><p>操作欄位使用中文，右側英文內容才會顯示在成品上。</p></div>
                      {trips.length > 0 && <Field label="套用既有旅行資料"><select value={draft.tripId ?? ''} onChange={event => applyTrip(event.target.value)}><option value="">不套用</option>{trips.map(trip => <option key={trip.id} value={trip.id}>{trip.label}</option>)}</select></Field>}
                      <div className="two-columns">
                        <Field label="城市名稱（中文）"><input value={draft.cityZh} placeholder="例如：首爾" onChange={event => updateTranslatedField('cityZh', event.target.value)} /></Field>
                        <Field label="成品英文"><input value={draft.cityEn} placeholder="SEOUL" onChange={event => updateDraft('cityEn', event.target.value)} /></Field>
                      </div>
                      <div className="two-columns">
                        <Field label="國家（中文）"><input value={draft.countryZh} placeholder="例如：韓國" onChange={event => updateTranslatedField('countryZh', event.target.value)} /></Field>
                        <Field label="成品英文"><input value={draft.countryEn} placeholder="SOUTH KOREA" onChange={event => updateDraft('countryEn', event.target.value)} /></Field>
                      </div>
                      <Field label="收藏編號" hint="系統會自動遞增；如有需要仍可手動調整。"><input type="number" min="1" value={draft.archiveNo} onChange={event => updateDraft('archiveNo', Math.max(1, Number(event.target.value)))} /></Field>
                      <div className="read-only-row"><div><span>模板</span><strong>護照旅行典藏</strong></div><div><span>版本</span><strong>Passport 1.0</strong></div><div><span>格式</span><strong>9:16</strong></div></div>
                    </div>
                  )}

                  {editorTab === 'capture' && (
                    <div className="form-section">
                      <div className="form-intro"><h2>拍攝紀錄</h2><p>天氣只需要選擇中文狀況並輸入溫度，成品會自動顯示對應圖示。</p></div>
                      <div className="two-columns">
                        <Field label="拍攝地點（中文）"><input value={draft.locationZh} placeholder="例如：北村韓屋村" onChange={event => updateTranslatedField('locationZh', event.target.value)} /></Field>
                        <Field label="成品英文"><input value={draft.locationEn} placeholder="Bukchon Hanok Village" onChange={event => updateDraft('locationEn', event.target.value)} /></Field>
                      </div>
                      <div className="two-columns">
                        <Field label="拍攝日期"><input type="date" value={draft.date} onChange={event => updateDraft('date', event.target.value)} /></Field>
                        <Field label="拍攝時間"><input type="time" value={draft.time} onChange={event => updateDraft('time', event.target.value)} /></Field>
                      </div>
                      <div className="two-columns weather-row">
                        <Field label="天氣狀況"><select value={draft.weatherCode} onChange={event => updateDraft('weatherCode', event.target.value as ArchiveEntry['weatherCode'])}>{WEATHER_OPTIONS.map(option => <option key={option.code} value={option.code}>{option.symbol}　{option.labelZh}</option>)}</select></Field>
                        <Field label="氣溫"><div className="unit-input"><input type="number" inputMode="numeric" value={draft.temperature} onChange={event => updateDraft('temperature', event.target.value)} /><span>°C</span></div></Field>
                      </div>
                      <Field label="相機"><input value={draft.camera} placeholder="例如：iPhone 17 Pro Max" onChange={event => updateDraft('camera', event.target.value)} /></Field>
                    </div>
                  )}

                  {editorTab === 'travel' && (
                    <div className="form-section">
                      <div className="form-intro"><h2>旅程與護照章</h2><p>可儲存為旅行資料，讓同一趟旅行的下一張作品直接沿用。</p></div>
                      <Field label="旅行資料名稱"><input value={draft.tripLabel} placeholder="例如：首爾 2026 秋季旅行" onChange={event => updateDraft('tripLabel', event.target.value)} /></Field>
                      <div className="two-columns">
                        <Field label="入境日期"><input type="date" value={draft.arrivalDate} onChange={event => updateDraft('arrivalDate', event.target.value)} /></Field>
                        <Field label="離境日期"><input type="date" value={draft.departureDate} onChange={event => updateDraft('departureDate', event.target.value)} /></Field>
                      </div>
                      <div className="route-fields">
                        <Field label="出發機場"><input maxLength={3} value={draft.origin} placeholder="KHH" onChange={event => updateDraft('origin', event.target.value.toUpperCase())} /></Field>
                        <span>→</span>
                        <Field label="抵達機場"><input maxLength={3} value={draft.destination} placeholder="ICN" onChange={event => updateDraft('destination', event.target.value.toUpperCase())} /></Field>
                      </div>
                      <div className="two-columns">
                        <Field label="航班號"><input value={draft.flight} placeholder="例如：OZ746" onChange={event => updateDraft('flight', event.target.value.toUpperCase())} /></Field>
                        <Field label="座位"><input value={draft.seat} placeholder="例如：21A" onChange={event => updateDraft('seat', event.target.value.toUpperCase())} /></Field>
                      </div>
                      <button className="secondary-button full-button" onClick={saveTripProfile}><Save size={17} />{draft.tripId ? '更新旅行資料' : '儲存為旅行資料'}</button>
                    </div>
                  )}

                  {editorTab === 'memory' && (
                    <div className="form-section">
                      <div className="form-intro"><h2>旅行短句</h2><p>先記下中文原意，再確認最後會印在作品上的英文內容。</p></div>
                      <Field label="中文原意"><textarea rows={4} value={draft.memoryZh} placeholder="例如：每座城市都會在我心裡留下一部分。" onChange={event => updateDraft('memoryZh', event.target.value)} /></Field>
                      <Field label="成品英文" hint="建議控制在四行內；右側預覽會即時顯示排版結果。"><textarea rows={5} value={draft.memoryEn} placeholder={'Every city leaves\na piece of itself\ninside me.'} onChange={event => updateDraft('memoryEn', event.target.value)} /></Field>
                      <div className="notice"><span>i</span><p>目前版本不會自動翻譯自由文字，以免正式地名或語意被錯譯。英文內容可以自行確認後貼入。</p></div>
                    </div>
                  )}
                </div>

                <div className="editor-footer">
                  <button className="secondary-button" onClick={() => { saveNow(); setPage('library') }}><Check size={17} />完成編輯</button>
                  {settings.carryOverByDefault && <button className="primary-button" onClick={createNextWithCarry}><CopyPlus size={17} />新增下一張並沿用資料</button>}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
