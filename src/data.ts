import type { AppSettings, ArchiveEntry, TemplateDefinition, TripProfile, WeatherOption } from './types'

export const WEATHER_OPTIONS: WeatherOption[] = [
  { code: 'sunny', labelZh: '晴朗', labelEn: 'SUNNY', symbol: '☀' },
  { code: 'mostly-sunny', labelZh: '晴時多雲', labelEn: 'MOSTLY SUNNY', symbol: '🌤' },
  { code: 'partly-cloudy', labelZh: '多雲', labelEn: 'PARTLY CLOUDY', symbol: '⛅' },
  { code: 'overcast', labelZh: '陰天', labelEn: 'OVERCAST', symbol: '☁' },
  { code: 'mist', labelZh: '薄霧', labelEn: 'MIST', symbol: '〰' },
  { code: 'fog', labelZh: '濃霧', labelEn: 'FOG', symbol: '≋' },
  { code: 'drizzle', labelZh: '毛毛雨', labelEn: 'DRIZZLE', symbol: '🌦' },
  { code: 'light-rain', labelZh: '小雨', labelEn: 'LIGHT RAIN', symbol: '☂' },
  { code: 'showers', labelZh: '陣雨', labelEn: 'SHOWERS', symbol: '🌧' },
  { code: 'heavy-rain', labelZh: '大雨', labelEn: 'HEAVY RAIN', symbol: '☔' },
  { code: 'thunderstorm', labelZh: '雷雨', labelEn: 'THUNDERSTORM', symbol: '⚡' },
  { code: 'sleet', labelZh: '雨夾雪', labelEn: 'SLEET', symbol: '🌨' },
  { code: 'light-snow', labelZh: '小雪', labelEn: 'LIGHT SNOW', symbol: '❄' },
  { code: 'snow', labelZh: '降雪', labelEn: 'SNOW', symbol: '❅' },
  { code: 'heavy-snow', labelZh: '大雪', labelEn: 'HEAVY SNOW', symbol: '❆' },
  { code: 'windy', labelZh: '強風', labelEn: 'WINDY', symbol: '≋' },
  { code: 'hail', labelZh: '冰雹', labelEn: 'HAIL', symbol: '◌' },
  { code: 'dust', labelZh: '沙塵／惡劣天候', labelEn: 'DUST', symbol: '◍' },
]

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'archive-passport',
    version: '1.0',
    nameZh: '護照旅行典藏',
    nameEn: 'PASSPORT EDITION',
    descriptionZh: '深色護照與可撕式票根，支援直式及完整橫式照片。',
    width: 1080,
    height: 1920,
    formatLabel: '9:16 Instagram 限時動態',
    supportedPhotoModes: ['auto', 'portrait', 'landscape'],
    status: 'available',
  },
  {
    id: 'archive-postcard',
    version: '1.0',
    nameZh: '旅行明信片',
    nameEn: 'POSTCARD EDITION',
    descriptionZh: '為未來模板預留的位置。',
    width: 1080,
    height: 1350,
    formatLabel: '4:5 Instagram 貼文',
    supportedPhotoModes: ['auto', 'portrait', 'landscape'],
    status: 'future',
  },
  {
    id: 'archive-cinema',
    version: '1.0',
    nameZh: '旅行電影畫面',
    nameEn: 'CINEMA ARCHIVE',
    descriptionZh: '為未來16:9橫式收藏預留的位置。',
    width: 1920,
    height: 1080,
    formatLabel: '16:9 橫式',
    supportedPhotoModes: ['auto', 'landscape'],
    status: 'future',
  },
]

export const DEFAULT_SETTINGS: AppSettings = {
  carryOverByDefault: true,
  showSafeZoneByDefault: false,
  jpegQuality: 0.94,
}

const isoToday = () => new Date().toISOString().slice(0, 10)

export function createBlankEntry(archiveNo: number): ArchiveEntry {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    templateId: 'archive-passport',
    templateVersion: '1.0',
    archiveNo,
    createdAt: now,
    updatedAt: now,
    tripLabel: '',
    photoMode: 'auto',
    focusX: 0.5,
    focusY: 0.5,
    cityZh: '',
    cityEn: '',
    countryZh: '',
    countryEn: '',
    arrivalDate: isoToday(),
    departureDate: isoToday(),
    locationZh: '',
    locationEn: '',
    date: isoToday(),
    time: new Date().toTimeString().slice(0, 5),
    weatherCode: 'sunny',
    temperature: '24',
    camera: '',
    origin: '',
    destination: '',
    flight: '',
    seat: '',
    memoryZh: '',
    memoryEn: '',
  }
}

export function carryEntry(source: ArchiveEntry, archiveNo: number): ArchiveEntry {
  const next = createBlankEntry(archiveNo)
  return {
    ...source,
    id: next.id,
    archiveNo,
    createdAt: next.createdAt,
    updatedAt: next.updatedAt,
    photoId: undefined,
    photoWidth: undefined,
    photoHeight: undefined,
  }
}

export function profileFromEntry(entry: ArchiveEntry): TripProfile {
  return {
    id: entry.tripId ?? crypto.randomUUID(),
    label: entry.tripLabel || `${entry.cityZh || entry.cityEn || '未命名旅行'} ${entry.date.slice(0, 4)}`,
    cityZh: entry.cityZh,
    cityEn: entry.cityEn,
    countryZh: entry.countryZh,
    countryEn: entry.countryEn,
    arrivalDate: entry.arrivalDate,
    departureDate: entry.departureDate,
    date: entry.date,
    weatherCode: entry.weatherCode,
    temperature: entry.temperature,
    camera: entry.camera,
    origin: entry.origin,
    destination: entry.destination,
    flight: entry.flight,
    seat: entry.seat,
    updatedAt: new Date().toISOString(),
  }
}

export function applyProfile(entry: ArchiveEntry, profile: TripProfile): ArchiveEntry {
  return {
    ...entry,
    tripId: profile.id,
    tripLabel: profile.label,
    cityZh: profile.cityZh,
    cityEn: profile.cityEn,
    countryZh: profile.countryZh,
    countryEn: profile.countryEn,
    arrivalDate: profile.arrivalDate,
    departureDate: profile.departureDate,
    date: profile.date,
    weatherCode: profile.weatherCode,
    temperature: profile.temperature,
    camera: profile.camera,
    origin: profile.origin,
    destination: profile.destination,
    flight: profile.flight,
    seat: profile.seat,
  }
}

export const COMMON_TRANSLATIONS: Record<string, string> = {
  首爾: 'SEOUL', 東京: 'TOKYO', 京都: 'KYOTO', 大阪: 'OSAKA', 巴黎: 'PARIS', 倫敦: 'LONDON', 台北: 'TAIPEI',
  韓國: 'SOUTH KOREA', 日本: 'JAPAN', 法國: 'FRANCE', 義大利: 'ITALY', 英國: 'UNITED KINGDOM', 台灣: 'TAIWAN',
  北村韓屋村: 'Bukchon Hanok Village', 南山首爾塔: 'N Seoul Tower', 明洞: 'Myeongdong', 淺草: 'Asakusa', 伏見稻荷大社: 'Fushimi Inari Taisha',
}
