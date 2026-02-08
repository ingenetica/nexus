import React, { useState } from 'react'
import { Button } from '../ui/Button'

interface SchedulePickerProps {
  onSchedule: (dateTime: string) => void
  onCancel: () => void
}

export const SchedulePicker: React.FC<SchedulePickerProps> = ({ onSchedule, onCancel }) => {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')

  const handleSchedule = () => {
    if (date && time) {
      onSchedule(new Date(`${date}T${time}`).toISOString())
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-nexus-text-secondary block mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-nexus-surface-elevated border border-nexus-border rounded-lg px-3 py-2 text-sm text-nexus-text-primary focus:outline-none focus:border-nexus-primary"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-nexus-text-secondary block mb-1.5">Time</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full bg-nexus-surface-elevated border border-nexus-border rounded-lg px-3 py-2 text-sm text-nexus-text-primary focus:outline-none focus:border-nexus-primary"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSchedule} disabled={!date}>Schedule</Button>
      </div>
    </div>
  )
}
