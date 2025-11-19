import { useState, useEffect } from 'react'
import { createBooking, getPublicBookings } from '../services/api'
import './ContactPage.css'

interface Booking {
  id: number;
  booking_date: string;
  notes?: string;
}

const ContactPage = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [reservationPosition, setReservationPosition] = useState<{ column: number, rows: number[] } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [existingBookings, setExistingBookings] = useState<Booking[]>([])

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
    for (let hour = 8; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
    }
    return slots
  }

  const weekDays = getWeekDays(currentWeek)
  const timeSlots = getTimeSlots()
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const MIN_ADVANCE_HOURS = 12

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await getPublicBookings();
      setExistingBookings(response.data);
    } catch (error) {
      console.error('Błąd ładowania rezerwacji:', error);
    }
  };

  const isSlotBooked = (day: Date, time: string): boolean => {
    const [hour] = time.split(':').map(Number);
    const slotDate = new Date(day);
    slotDate.setHours(hour, 0, 0, 0);
    
    return existingBookings.some(booking => {
      const bookingStart = new Date(booking.booking_date);
      const durationMatch = booking.notes?.match(/Duration: (\d+) hour/);
      const duration = durationMatch ? parseInt(durationMatch[1], 10) : 1;
      const bookingEnd = new Date(bookingStart.getTime() + duration * 60 * 60 * 1000);
      
      // Slot jest zajęty jeśli mieści się w zakresie rezerwacji
      return slotDate >= bookingStart && slotDate < bookingEnd;
    });
  };

  const canBookSlot = (day: Date, time: string): boolean => {
    // Nie można zarezerwować jeśli slot jest w przeszłości lub już zajęty
    return !isPastSlot(day, time) && !isSlotBooked(day, time);
  };

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
    // Sprawdź czy slot można zarezerwować
    if (!canBookSlot(day, time)) {
      return;
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !clientName || !reservationPosition) return

    setSubmitting(true)
    
    try {
      // Oblicz datę i godzinę rozpoczęcia rezerwacji
      const startRowIdx = Math.min(...reservationPosition.rows)
      const startHour = parseInt(timeSlots[startRowIdx].split(':')[0], 10)
      const bookingDay = weekDays[reservationPosition.column]
      
      const bookingDateTime = new Date(bookingDay)
      bookingDateTime.setHours(startHour, 0, 0, 0)
      
      // Oblicz czas trwania w godzinach
      const duration = reservationPosition.rows.length
      
      await createBooking({
        client_name: clientName,
        client_email: email,
        client_phone: clientPhone || undefined,
        service_name: 'Photo shoot',
        booking_date: bookingDateTime.toISOString(),
        notes: `Duration: ${duration} hour(s)`
      })
      
      alert(`Reservation confirmed for ${clientName}! We will contact you at ${email}`)
      setShowModal(false)
      setEmail('')
      setClientName('')
      setClientPhone('')
      setReservationPosition(null)
    } catch (error) {
      console.error('Booking error:', error)
      const any = error as any
      const detail = any?.response?.data?.detail || any?.message || ''
      alert(`Failed to create booking. ${detail}`.trim())
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEmail('')
    setClientName('')
    setClientPhone('')
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
                const isPast = isPastSlot(day, time)
                const isBooked = isSlotBooked(day, time)
                const isAvailable = canBookSlot(day, time)
                
                return (
                  <div
                    key={slotKey}
                    className={`slot ${isPast ? 'past' : ''} ${isBooked ? 'booked' : ''} ${isAvailable ? 'available' : ''}`}
                    onClick={() => onClick({ day, time, dayIndex })}
                    title={`${dayNames[dayIndex]} ${time}${isBooked ? ' (zajęte)' : isPast ? ' (przeszłość)' : ' (dostępne)'}`}
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
            <div className="modal-description">Please provide your contact details so I can confirm your reservation</div>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Your name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className="email-input"
              />
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="email-input"
              />
              <input
                type="tel"
                placeholder="Phone number (optional)"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="email-input"
              />
              <div className="modal-buttons">
                <button type="submit" className="modal-confirm-btn" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactPage;