import { useState } from 'react'
import './ContactPage.css'

const ContactPage = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [reservationPosition, setReservationPosition] = useState<{ column: number, rows: number[] } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')

  const getMonday = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const getWeekDays = (date: Date): Date[] => {
    const monday = getMonday(date)
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getTimeSlots = (): string[] => {
    const slots: string[] = []
    for (let hour = 8; hour < 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
    }
    return slots
  }

  const weekDays = getWeekDays(currentWeek)
  const timeSlots = getTimeSlots()
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const MIN_ADVANCE_HOURS = 12

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }
  const isPastSlot = (day: Date, time: string): boolean => {
    const now = new Date()
    const [hour] = time.split(':').map(Number)
    const slotDate = new Date(day)
    slotDate.setHours(hour, 0, 0, 0)
    const minAdvanceMs = MIN_ADVANCE_HOURS * 60 * 60 * 1000
    return slotDate.getTime() < now.getTime() + minAdvanceMs
  }

  const handleSlotClick = (day: Date, time: string) => {
    const key = `${day.toISOString().split('T')[0]}-${time}`
    const newSlots = new Set(selectedSlots)
    if (newSlots.has(key)) {
      newSlots.delete(key)
    } else {
      newSlots.add(key)
    }
    setSelectedSlots(newSlots)
  }

  const goToPreviousWeek = () => {
    const prev = new Date(currentWeek)
    prev.setDate(prev.getDate() - 7)
    setCurrentWeek(prev)
  }

  const goToNextWeek = () => {
    const next = new Date(currentWeek)
    next.setDate(next.getDate() + 7)
    setCurrentWeek(next)
  }

  const formatDateRange = () => {
    const start = weekDays[0]
    const end = weekDays[6]
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${monthNames[start.getMonth()]} ${start.getFullYear()}`
    }
    if (start.getFullYear() === end.getFullYear()) {
      return `${monthNames[start.getMonth()]} / ${monthNames[end.getMonth()]} ${start.getFullYear()}`
    }
    return `${monthNames[start.getMonth()]} ${start.getFullYear()} / ${monthNames[end.getMonth()]} ${end.getFullYear()}`
  }

  const onClick = ({ day, time, dayIndex }: { day: Date, time: string, dayIndex: number }) => {
    setReservationPosition((prev) => {

      if (prev?.column !== dayIndex) {
        return { column: dayIndex, rows: [timeSlots.indexOf(time)] }
      }

      const newRows = prev ? [...prev.rows, timeSlots.indexOf(time)] : [timeSlots.indexOf(time)];
      const newUniqueRows = Array.from(new Set(newRows)).sort((a, b) => a - b);

      return ({ column: dayIndex, rows: newUniqueRows })
    })
  }

  const resevationStyles = reservationPosition ? {
    gridColumnStart: reservationPosition.column + 1,
    gridColumnEnd: reservationPosition.column + 2,
    gridRowStart: Math.min(...reservationPosition.rows) + 1,
    gridRowEnd: Math.max(...reservationPosition.rows) + 2,
  } : {}

  console.log(resevationStyles)

  const formatReservationRange = (
    pos: { column: number; rows: number[] },
    slots: string[]
  ) => {
    const startIdx = Math.min(...pos.rows)
    const endIdx = Math.max(...pos.rows)
    const start = slots[startIdx]
    const endHour = parseInt(slots[endIdx].split(':')[0], 10) + 1
    const end = `${String(endHour).padStart(2, '0')}:00`
    return `${start} – ${end}`
  }

  const handleConfirmClick = () => {
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && reservationPosition) {
      // Tutaj możesz dodać logikę wysyłania rezerwacji
      console.log('Rezerwacja:', { email, reservationPosition, weekDays })
      alert(`Rezerwacja potwierdzona dla: ${email}`)
      setShowModal(false)
      setEmail('')
      setReservationPosition(null)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEmail('')
  }

  const formatShortDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="calendar-section">
      <h1>Let's meet!</h1>
      <p>Book a photo shoot below or contact me at jan.kowalski@yopmail.com</p>

      <div className="calendar-header">
        <button onClick={goToPreviousWeek} className="nav-button">← Previous week</button>
        <span className="week-range">{formatDateRange()}</span>
        <button onClick={goToNextWeek} className="nav-button">Next week →</button>
      </div>
      <div className="calendar-container">
        <div className="time-column-wrapper">
          <div className="corner-cell" />
          <div className="time-column">
            {timeSlots.map((time) => (
              <div key={time} className="time-slot">{time}</div>
            ))}
          </div>
        </div>
        <div className="calendar-grid">
          <div className="days-header-row">
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className={`day-header ${isToday(day) ? 'today' : ''}`}>
                <div className="day-name">{dayNames[dayIndex]}</div>
                <div className="day-date">{day.getDate()}</div>
              </div>
            ))}
          </div>
          <div className="slots-grid">

            {timeSlots.map((time, timeIndex) => (
              weekDays.map((day, dayIndex) => {
                const slotKey = `${day.toISOString().split('T')[0]}-${time}`
                const isSelected = selectedSlots.has(slotKey)
                const isPast = isPastSlot(day, time)
                return (
                  <div
                    key={slotKey}
                    className={`slot ${isSelected ? 'selected' : ''} ${isPast ? 'past' : ''}`}
                    onClick={() => !isPast && onClick({ day, time, dayIndex })}
                    title={`${dayNames[dayIndex]} ${time}`}
                    style={{
                      gridColumn: dayIndex + 1,
                      gridRow: timeIndex + 1
                    }}
                  />
                )
              })
            ))}
            {reservationPosition && (<div className="reservation" style={resevationStyles} onClick={() => setReservationPosition(null)} // jeśli chcesz móc kliknięciem usunąć 
            > <div className="reservation-title">Photo shoot
              </div>
              <div className="reservation-time">{formatReservationRange(reservationPosition, timeSlots)}
              </div>
            </div>)}
          </div>
        </div>
      </div>

      <div className="calendar-info">
        {!!reservationPosition && (
          <button className="confirm-button" onClick={handleConfirmClick}>Confirm reservation</button>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal} aria-label="Close">×</button>
            <h2>Confirm your reservation</h2>
            {reservationPosition && (
              <div className="reservation-summary">
                <div className="summary-day">
                  {dayNames[reservationPosition.column]}
                </div>
                <div className="summary-date-short">
                  {formatShortDate(weekDays[reservationPosition.column])}
                </div>
                <div className="summary-title">Photo shoot</div>
                <div className="summary-time">
                  {formatReservationRange(reservationPosition, timeSlots)}
                </div>
              </div>
            )}
            <div className="modal-description">Please, leave your email, so I can confirm your reservation</div>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="email-input"
              />
              <div className="modal-buttons">
                <button type="submit" className="modal-confirm-btn">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactPage;