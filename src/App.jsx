import { useEffect, useMemo, useState } from 'react'
import hubHero from './assets/images/hub.png'
import { loadEvents } from './data/events'
import './App.css'

const dateFilters = [
  'This Weekend',
  'Next Weekend',
  'This Month',
  'July',
  'August',
  'September',
]

const categories = [
  'All Categories',
  'Concert',
  'Festival',
  'Market',
  'Farmers Market',
  'Sports',
  'Community',
  'Fair',
  'Arts',
]

const spotlightCards = [
  {
    name: 'Downtown Cafe Feature',
    type: 'Coming soon',
    description: 'A rotating spotlight for local restaurants, cafes, and shops.',
  },
  {
    name: 'Neighbourhood Services',
    type: 'Coming soon',
    description: 'Future home for trusted local services and community partners.',
  },
  {
    name: 'Weekend Deals',
    type: 'Coming soon',
    description: 'A place to surface timely offers near the events residents attend.',
  },
]

function getEventTime(event) {
  const eventDate = new Date(`${event.startDate}T12:00:00`)
  return Number.isNaN(eventDate.getTime()) ? Number.MAX_SAFE_INTEGER : eventDate.getTime()
}

function formatTimelineDate(event) {
  const eventDate = new Date(`${event.startDate}T12:00:00`)

  if (Number.isNaN(eventDate.getTime())) {
    return 'Upcoming'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
  }).format(eventDate)
}

function groupEventsByStartDate(events) {
  return events.reduce((groups, event) => {
    const timelineDate = formatTimelineDate(event)

    if (!groups[timelineDate]) {
      groups[timelineDate] = []
    }

    groups[timelineDate].push(event)
    return groups
  }, {})
}

function EventCard({ event }) {
  return (
    <article className="event-card">
      <div className="event-card-top">
        <div>
          <div className="event-date-row">
            <p className="event-date">{event.date}</p>
            {event.dateBadge ? (
              <span className="date-badge">{event.dateBadge}</span>
            ) : null}
          </div>
          <h4>{event.name}</h4>
          <p className="event-town">
            <span aria-hidden="true">📍</span>
            {event.town}
          </p>
        </div>
        <span
          className={`status-badge ${event.status
            .toLowerCase()
            .replaceAll(' ', '-')}`}
        >
          {event.status}
        </span>
      </div>

      <p className="event-description">{event.description}</p>

      <div className="event-meta">
        <span>{event.category}</span>
      </div>
    </article>
  )
}

function App() {
  const [events, setEvents] = useState([])
  const [dateFilter, setDateFilter] = useState('This Weekend')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchEvents() {
      try {
        const loadedEvents = await loadEvents()

        if (isMounted) {
          setEvents(loadedEvents)
          setLoadError('')
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchEvents()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesDate = event.dateFilters.includes(dateFilter)
      const matchesCategory =
        categoryFilter === 'All Categories' ||
        event.categoryFilters.includes(categoryFilter)

      return matchesDate && matchesCategory
    })
  }, [events, dateFilter, categoryFilter])

  const recurringEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => event.dateBadge)
      .toSorted((firstEvent, secondEvent) => getEventTime(firstEvent) - getEventTime(secondEvent))
  }, [filteredEvents])

  const timelineEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => !event.dateBadge)
      .toSorted((firstEvent, secondEvent) => getEventTime(firstEvent) - getEventTime(secondEvent))
  }, [filteredEvents])

  const groupedEvents = groupEventsByStartDate(timelineEvents)

  return (
    <main className="app-shell">
      <section className="hero-section" aria-labelledby="page-title">
        <div className="hero-image-wrap">
          <img src={hubHero} alt="Brockton Hub community banner" />
        </div>
        <div className="hero-content">
          <p className="eyebrow">Brockton weekend guide</p>
          <h1 id="page-title">Brockton Hub</h1>
          <p>
            Find concerts, festivals, markets, celebrations, and community
            events happening around you this weekend.
          </p>
        </div>
      </section>

      <section className="filters-section" aria-label="Event filters">
        <label>
          <span>Date</span>
          <select
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          >
            {dateFilters.map((filter) => (
              <option key={filter} value={filter}>
                {filter}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Category</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="events-section" aria-labelledby="events-title">
        <div className="section-heading">
          <p className="eyebrow">What is happening around me?</p>
          <h2 id="events-title">What&apos;s Happening</h2>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <h3>Loading events</h3>
            <p>Checking the Brockton Hub calendar for the latest listings.</p>
          </div>
        ) : loadError ? (
          <div className="empty-state">
            <h3>Events could not be loaded</h3>
            <p>
              Please try again soon. The community calendar may be temporarily
              unavailable.
            </p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <>
            {recurringEvents.length > 0 ? (
              <div className="timeline-section">
                <h3>🔁 Recurring Events</h3>
                <div className="event-list">
                  {recurringEvents.map((event) => (
                    <EventCard event={event} key={event.id} />
                  ))}
                </div>
              </div>
            ) : null}

            {timelineEvents.length > 0 ? (
              <div className="timeline-section">
                <h3>Upcoming Events</h3>
                {Object.entries(groupedEvents).map(([date, dateEvents]) => (
                  <div className="day-group" key={date}>
                    <h4>{date}</h4>
                    <div className="event-list">
                      {dateEvents.map((event) => (
                        <EventCard event={event} key={event.id} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="empty-state">
            <h3>No events found</h3>
            <p>Try a different date or category to explore more local events.</p>
          </div>
        )}
      </section>

      <section className="spotlight-section" aria-labelledby="spotlight-title">
        <div className="section-heading">
          <p className="eyebrow">Coming next</p>
          <h2 id="spotlight-title">Local Spotlight</h2>
        </div>
        <div className="spotlight-grid">
          {spotlightCards.map((card) => (
            <article className="spotlight-card" key={card.name}>
              <p>{card.type}</p>
              <h3>{card.name}</h3>
              <span>{card.description}</span>
            </article>
          ))}
        </div>
      </section>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {['Home', 'Events', 'Directory', 'Vouch', 'More'].map((item) => (
          <button
            className={item === 'Home' ? 'active' : ''}
            type="button"
            key={item}
          >
            <span aria-hidden="true">{item.charAt(0)}</span>
            {item}
          </button>
        ))}
      </nav>
    </main>
  )
}

export default App
