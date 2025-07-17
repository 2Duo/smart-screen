import React from 'react'
import { useNotificationStore, type Notification } from '../stores/notificationStore'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

interface NotificationToastProps {
  notification: Notification
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification }) => {
  const { removeNotification } = useNotificationStore()
  
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }
  
  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'from-green-500/20 via-green-400/15 to-green-500/20 border-green-300/30'
      case 'error':
        return 'from-red-500/20 via-red-400/15 to-red-500/20 border-red-300/30'
      case 'warning':
        return 'from-yellow-500/20 via-yellow-400/15 to-yellow-500/20 border-yellow-300/30'
      case 'info':
        return 'from-blue-500/20 via-blue-400/15 to-blue-500/20 border-blue-300/30'
      default:
        return 'from-blue-500/20 via-blue-400/15 to-blue-500/20 border-blue-300/30'
    }
  }
  
  return (
    <div className={`backdrop-blur-2xl bg-gradient-to-br ${getBackgroundColor()} border rounded-xl shadow-2xl p-4 max-w-md`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className="text-white font-medium text-sm mb-1">
            {notification.title}
          </h4>
          <p className="text-white/80 text-sm whitespace-pre-wrap">
            {notification.message}
          </p>
        </div>
        <button
          onClick={() => removeNotification(notification.id)}
          className="flex-shrink-0 text-white/60 hover:text-white/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export const NotificationContainer: React.FC = () => {
  const { notifications } = useNotificationStore()
  
  if (notifications.length === 0) {
    return null
  }
  
  return (
    <div className="fixed top-20 right-8 z-50 space-y-3">
      {notifications.map((notification) => (
        <NotificationToast key={notification.id} notification={notification} />
      ))}
    </div>
  )
}

export default NotificationToast