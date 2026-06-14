const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQuNC_JtQsMmWPDSef9cnSmRR4KtkbQ74PQ2jTahbz5XbmaG4qQ6qbQlFDGJkSrOw8UQK2gB-L8WCmR/pub?output=csv'

const monthFilters = ['July', 'August', 'September']

function parseCsv(csvText) {
  const rows = []
  let row = []
  let field = ''
  let insideQuotes = false

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index]
    const nextCharacter = csvText[index + 1]

    if (character === '"' && insideQuotes && nextCharacter === '"') {
      field += '"'
      index += 1
    } else if (character === '"') {
      insideQuotes = !insideQuotes
    } else if (character === ',' && !insideQuotes) {
      row.push(field)
      field = ''
    } else if ((character === '\n' || character === '\r') && !insideQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1
      }

      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (field || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((csvRow) => csvRow.some((cell) => cell.trim()))
}

function parseDate(value) {
  if (!value) {
    return null
  }

  const dateValue = value.trim()
  const isoDateOnlyMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (isoDateOnlyMatch) {
    const [, year, month, day] = isoDateOnlyMatch
    return new Date(Number(year), Number(month) - 1, Number(day), 12)
  }

  const parsedDate = new Date(`${dateValue} 12:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    const fallbackDate = new Date(value)
    return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate
  }

  return parsedDate
}

function formatDate(value) {
  const date = parseDate(value)

  if (!date) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function formatDateRange(startDate, endDate) {
  if (!endDate || endDate === startDate) {
    return formatDate(startDate)
  }

  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

function getDateSpanDays(startDate, endDate) {
  if (!startDate || !endDate) {
    return 1
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000
  return Math.round((endDate - startDate) / millisecondsPerDay) + 1
}

function getDateBadge(startDate, endDate) {
  return getDateSpanDays(startDate, endDate) > 14 ? '🔁 Recurring Event' : ''
}

function getWeekendRange(weekOffset = 0) {
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  const dayOfWeek = today.getDay()
  const daysUntilSaturday =
    dayOfWeek === 0 ? -1 : (6 - today.getDay() + 7) % 7
  const saturday = new Date(today)
  saturday.setDate(today.getDate() + daysUntilSaturday + weekOffset * 7)

  const sunday = new Date(saturday)
  sunday.setDate(saturday.getDate() + 1)

  return { saturday, sunday }
}

function datesOverlapRange(startDate, endDate, rangeStart, rangeEnd) {
  if (!startDate) {
    return false
  }

  const normalizedEndDate = endDate || startDate
  return startDate <= rangeEnd && normalizedEndDate >= rangeStart
}

function buildDateFilters(startDate, endDate) {
  const filters = []
  const { saturday, sunday } = getWeekendRange()
  const nextWeekend = getWeekendRange(1)
  const today = new Date()
  const eventEndDate = endDate || startDate
  const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1, 12)
  const lastDayThisMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
    12,
  )

  if (datesOverlapRange(startDate, eventEndDate, saturday, sunday)) {
    filters.push('This Weekend')
  }

  if (
    datesOverlapRange(
      startDate,
      eventEndDate,
      nextWeekend.saturday,
      nextWeekend.sunday,
    )
  ) {
    filters.push('Next Weekend')
  }

  if (datesOverlapRange(startDate, eventEndDate, firstDayThisMonth, lastDayThisMonth)) {
    filters.push('This Month')
  }

  monthFilters.forEach((monthName) => {
    const monthStart = new Date(`${monthName} 1, ${startDate?.getFullYear() || 2026}`)
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 12)

    if (datesOverlapRange(startDate, eventEndDate, monthStart, monthEnd)) {
      filters.push(monthName)
    }
  })

  return filters
}

function getDay(startDateValue) {
  const date = parseDate(startDateValue)

  if (!date) {
    return 'Upcoming'
  }

  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date)
}

function normalizeStatus(status) {
  const normalizedStatus = status.trim()
  const statusMap = {
    Verified: 'Hub Verified',
    Basic: 'Community Submitted',
    'Organizer Verified': 'Organizer Verified',
    'Hub Verified': 'Hub Verified',
    'Community Submitted': 'Community Submitted',
    'AI Discovered': 'AI Discovered',
  }

  return statusMap[normalizedStatus] || 'Community Submitted'
}

function buildCategoryFilters(category) {
  const normalizedCategory = category.toLowerCase()
  const filters = []

  if (normalizedCategory.includes('farmers market')) {
    filters.push('Farmers Market')
  }

  if (normalizedCategory.includes('concert') || normalizedCategory.includes('music')) {
    filters.push('Concert')
  }

  if (normalizedCategory.includes('festival')) {
    filters.push('Festival')
  }

  if (normalizedCategory.includes('market')) {
    filters.push('Market')
  }

  if (normalizedCategory.includes('sport')) {
    filters.push('Sports')
  }

  if (normalizedCategory.includes('community')) {
    filters.push('Community')
  }

  if (normalizedCategory.includes('fair')) {
    filters.push('Fair')
  }

  if (
    normalizedCategory.includes('art') ||
    normalizedCategory.includes('comic') ||
    normalizedCategory.includes('convention')
  ) {
    filters.push('Arts')
  }

  return filters
}

function mapRowToEvent(row, index) {
  const startDate = parseDate(row['Start Date'])
  const endDate = parseDate(row['End Date'])
  const category = row.Category || 'Community'

  return {
    id: row['Event ID'] || `event-${index}`,
    name: row['Event Name'] || 'Untitled Event',
    startDate: row['Start Date'] || '',
    endDate: row['End Date'] || '',
    town: row.Town || 'Brockton area',
    location: row.Location || '',
    category,
    categoryFilters: buildCategoryFilters(category),
    description: row.Description || 'Event details are coming soon.',
    ticketUrl: row['Ticket URL'] || '',
    sourceUrl: row['Source URL'] || '',
    status: normalizeStatus(row.Status || ''),
    sourceName: row['Source Name'] || '',
    day: getDay(row['Start Date']),
    date: formatDateRange(row['Start Date'], row['End Date']),
    dateBadge: getDateBadge(startDate, endDate),
    dateFilters: buildDateFilters(startDate, endDate),
  }
}

export async function loadEvents() {
  const response = await fetch(GOOGLE_SHEET_CSV_URL)

  if (!response.ok) {
    throw new Error('Unable to load Brockton Hub events.')
  }

  const csvText = await response.text()
  const [headers, ...rows] = parseCsv(csvText)
  const normalizedHeaders = headers.map((header) => header.trim())

  return rows
    .map((row) => {
      return normalizedHeaders.reduce((record, header, index) => {
        record[header] = row[index]?.trim() || ''
        return record
      }, {})
    })
    .filter((record) => record['Event Name'])
    .map(mapRowToEvent)
}
