import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Clock } from 'lucide-react'

interface ClockWidgetProps {
  showSeconds?: boolean
  format24Hour?: boolean
  showDate?: boolean
}

export default function ClockWidget({ 
  showSeconds = true, 
  format24Hour = true, 
  showDate = true 
}: ClockWidgetProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const timeFormat = format24Hour 
    ? (showSeconds ? 'HH:mm:ss' : 'HH:mm')
    : (showSeconds ? 'h:mm:ss a' : 'h:mm a')

  return (
    <div className="h-full flex flex-col items-center justify-center text-white">
      <div className="flex items-center gap-2 mb-2">
        <Clock size={24} className="text-white/80" />
        <span className="text-lg font-medium text-white/80">時刻</span>
      </div>
      
      <div className="text-center">
        <div className="text-4xl font-bold font-mono mb-2">
          {format(time, timeFormat)}
        </div>
        
        {showDate && (
          <div className="text-lg text-white/80">
            {format(time, 'yyyy年M月d日 (E)', { locale: ja })}
          </div>
        )}
      </div>
    </div>
  )
}