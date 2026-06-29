import { DEFAULT_SETTINGS } from './data'
import type { AppSettings, ArchiveEntry, TripProfile } from './types'

const ENTRY_KEY = 'travel-archive.entries.v1'
const TRIP_KEY = 'travel-archive.trips.v1'
const SETTINGS_KEY = 'travel-archive.settings.v1'
const DB_NAME = 'travel-archive-assets'
const STORE_NAME = 'images'

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

export const loadEntries = () => readJson<ArchiveEntry[]>(ENTRY_KEY, [])
export const saveEntries = (entries: ArchiveEntry[]) => localStorage.setItem(ENTRY_KEY, JSON.stringify(entries))
export const loadTrips = () => readJson<TripProfile[]>(TRIP_KEY, [])
export const saveTrips = (trips: TripProfile[]) => localStorage.setItem(TRIP_KEY, JSON.stringify(trips))
export const loadSettings = () => ({ ...DEFAULT_SETTINGS, ...readJson<Partial<AppSettings>>(SETTINGS_KEY, {}) })
export const saveSettings = (settings: AppSettings) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function putImage(id: string, blob: Blob) {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function getImage(id?: string): Promise<Blob | undefined> {
  if (!id) return undefined
  const db = await openDb()
  const result = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(id)
    request.onsuccess = () => resolve(request.result as Blob | undefined)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return result
}

export async function deleteImage(id?: string) {
  if (!id) return
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}
