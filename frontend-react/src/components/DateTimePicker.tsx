import { useState, useEffect, useRef } from 'react'

interface DateTimePickerProps {
  id?: string
  name: string
  required?: boolean
  min?: string   // ISO datetime-local format: YYYY-MM-DDTHH:mm
  max?: string   // ISO datetime-local format: YYYY-MM-DDTHH:mm
  className?: string
}

/** Parse "DD/MM/YYYY HH:mm" → "YYYY-MM-DDTHH:mm" (ISO for datetime-local).
 *  Returns empty string if the input is not fully valid. */
function parseDisplayToISO(display: string): string {
  // Accept both "05/05/2000 18:46" and partial inputs
  const match = display.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/
  )
  if (!match) return ''
  const [, dd, mm, yyyy, hh, min] = match
  const d = parseInt(dd, 10)
  const m = parseInt(mm, 10)
  const y = parseInt(yyyy, 10)
  const h = parseInt(hh, 10)
  const mi = parseInt(min, 10)
  if (m < 1 || m > 12) return ''
  if (d < 1 || d > 31) return ''
  if (h > 23 || mi > 59) return ''
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

/** Parse "YYYY-MM-DDTHH:mm" → "DD/MM/YYYY HH:mm" */
function isoToDisplay(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return ''
  const [, yyyy, mm, dd, hh, min] = match
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

export default function DateTimePicker({
  id,
  name,
  required,
  min,
  max,
  className = 'form-control',
}: DateTimePickerProps) {
  // Text shown to the user (DD/MM/YYYY HH:mm)
  const [display, setDisplay] = useState('')
  // Actual ISO value fed to the hidden datetime-local input (and the calendar)
  const [isoValue, setIsoValue] = useState('')
  // Whether to show the native calendar picker
  const hiddenRef = useRef<HTMLInputElement>(null)

  // When user types in the text box
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setDisplay(raw)
    const iso = parseDisplayToISO(raw)
    setIsoValue(iso)
  }

  // When user picks from the calendar (the hidden input changes)
  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value  // "YYYY-MM-DDTHH:mm"
    setIsoValue(iso)
    setDisplay(isoToDisplay(iso))
  }

  // Keep the hidden input in sync whenever isoValue changes
  useEffect(() => {
    if (hiddenRef.current) {
      // Setting .value programmatically syncs the calendar
      hiddenRef.current.value = isoValue
    }
  }, [isoValue])

  const openCalendar = () => {
    hiddenRef.current?.showPicker?.()
  }

  return (
    <div className="position-relative d-flex gap-1">
      {/* Visible text input */}
      <input
        type="text"
        className={className}
        id={id}
        placeholder="JJ/MM/AAAA HH:mm"
        value={display}
        onChange={handleTextChange}
        required={required}
        autoComplete="off"
        // Pattern for basic HTML5 validation hint (actual validation done in JS)
        pattern="\d{2}/\d{2}/\d{4} \d{2}:\d{2}"
      />

      {/* Calendar icon button */}
      <button
        type="button"
        className="btn btn-outline-secondary"
        onClick={openCalendar}
        tabIndex={-1}
        title="Ouvrir le calendrier"
      >
        <i className="fas fa-calendar-alt" />
      </button>

      {/* Hidden datetime-local input that drives the calendar popup.
          Its value is always ISO format; the text box mirrors it in display format.
          name goes here so FormData picks up the ISO value. */}
      <input
        ref={hiddenRef}
        type="datetime-local"
        name={name}
        id={id ? `${id}_hidden` : undefined}
        required={required}
        min={min}
        max={max}
        value={isoValue}
        onChange={handleCalendarChange}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1, overflow: 'hidden' }}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  )
}
