import { useMemo, useState } from 'react'
import hubHero from './assets/images/hub.png'
import { events } from './data/events'
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

function groupEventsByDay(filteredEvents) {
  return filteredEvents.reduce((groups, event) => {
    if (!groups[event.day]) {
      groups[event.day] = []
    }

    groups[event.day].push(event)
    return groups
  }, {})
}

function App() {
  const [dateFilter, setDateFilter] = useState('This Weekend')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesDate = event.dateFilters.includes(dateFilter)
      const matchesCategory =
        categoryFilter === 'All Categories' || event.category === categoryFilter

      return matchesDate && matchesCategory
    })
  }, [dateFilter, categoryFilter])

  const groupedEvents = groupEventsByDay(filteredEvents)

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

        {filteredEvents.length > 0 ? (
          Object.entries(groupedEvents).map(([day, dayEvents]) => (
            <div className="day-group" key={day}>
              <h3>{day}</h3>
              <div className="event-list">
                {dayEvents.map((event) => (
                  <article className="event-card" key={event.id}>
                    <div className="event-card-top">
                      <div>
                        <p className="event-date">{event.date}</p>
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
                ))}
              </div>
            </div>
          ))
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
