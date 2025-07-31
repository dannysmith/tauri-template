import type { AppCommand } from '@/types/commands'
import { notify, notifications } from '@/lib/notifications'

export const notificationCommands: AppCommand[] = [
  {
    id: 'notification.test-toast-success',
    label: 'Test Success Toast',
    description: 'Show a success toast notification',
    async execute() {
      await notifications.success('Success!', 'This is a success toast message')
    },
  },
  {
    id: 'notification.test-toast-error',
    label: 'Test Error Toast',
    description: 'Show an error toast notification',
    async execute() {
      await notifications.error('Error!', 'This is an error toast message')
    },
  },
  {
    id: 'notification.test-toast-info',
    label: 'Test Info Toast',
    description: 'Show an info toast notification',
    async execute() {
      await notifications.info('Info', 'This is an info toast message')
    },
  },
  {
    id: 'notification.test-toast-warning',
    label: 'Test Warning Toast',
    description: 'Show a warning toast notification',
    async execute() {
      await notifications.warning('Warning!', 'This is a warning toast message')
    },
  },
  {
    id: 'notification.test-native-success',
    label: 'Test Native Success Notification',
    description: 'Show a native system success notification',
    async execute() {
      await notify('Success!', 'This is a native system notification', {
        native: true,
        type: 'success',
      })
    },
  },
  {
    id: 'notification.test-native-info',
    label: 'Test Native Info Notification',
    description: 'Show a native system info notification',
    async execute() {
      await notify(
        'Information',
        'This is a native system notification with more details',
        { native: true, type: 'info' }
      )
    },
  },
]
