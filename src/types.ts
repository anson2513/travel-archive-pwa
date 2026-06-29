export type PhotoMode = 'auto' | 'portrait' | 'landscape'

export type WeatherCode =
  | 'sunny'
  | 'mostly-sunny'
  | 'partly-cloudy'
  | 'overcast'
  | 'mist'
  | 'fog'
  | 'drizzle'
  | 'light-rain'
  | 'showers'
  | 'heavy-rain'
  | 'thunderstorm'
  | 'sleet'
  | 'light-snow'
  | 'snow'
  | 'heavy-snow'
  | 'windy'
  | 'hail'
  | 'dust'

export interface WeatherOption {
  code: WeatherCode
  labelZh: string
  labelEn: string
  symbol: string
}

export interface ArchiveEntry {
  id: string
  templateId: string
  templateVersion: string
  archiveNo: number
  createdAt: string
  updatedAt: string
  tripId?: string
  tripLabel: string
  photoId?: string
  photoWidth?: number
  photoHeight?: number
  photoMode: PhotoMode
  focusX: number
  focusY: number
  cityZh: string
  cityEn: string
  countryZh: string
  countryEn: string
  arrivalDate: string
  departureDate: string
  locationZh: string
  locationEn: string
  date: string
  time: string
  weatherCode: WeatherCode
  temperature: string
  camera: string
  origin: string
  destination: string
  flight: string
  seat: string
  memoryZh: string
  memoryEn: string
}

export interface TripProfile {
  id: string
  label: string
  cityZh: string
  cityEn: string
  countryZh: string
  countryEn: string
  arrivalDate: string
  departureDate: string
  date: string
  weatherCode: WeatherCode
  temperature: string
  camera: string
  origin: string
  destination: string
  flight: string
  seat: string
  updatedAt: string
}

export interface AppSettings {
  carryOverByDefault: boolean
  showSafeZoneByDefault: boolean
  jpegQuality: number
}

export interface TemplateDefinition {
  id: string
  version: string
  nameZh: string
  nameEn: string
  descriptionZh: string
  width: number
  height: number
  formatLabel: string
  supportedPhotoModes: PhotoMode[]
  status: 'available' | 'future'
}
