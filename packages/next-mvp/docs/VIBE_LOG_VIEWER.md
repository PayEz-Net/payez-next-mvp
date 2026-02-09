# VibeLogViewer Component

Status: **PLANNED**

A real-time log viewer component for the Vibe App.

## Location

```
@payez/next-mvp/components/VibeLogViewer
```

## Usage

```tsx
import { VibeLogViewer } from '@payez/next-mvp/components'

// Basic usage in admin dashboard
export default function AdminLogs() {
  return <VibeLogViewer defaultLevel='ERROR' autoRefresh={true} />
}

// With custom filters
<VibeLogViewer
  category='auth'
  from={lastWeek}
  to={today}
/>
```

## Features

### Core
- Real-time log stream (polling or websocket)
- Filter by level (ERROR, WARN, INFO, DEBUG)
- Filter by category (auth, api-proxy, etc)
- Date range picker
- Search in message/context
- Expandable rows to see full context JSON
- Auto-refresh toggle
- Export to CSV/JSON

### UI
- Table view with columns: timestamp, level, category, message
- Level badges (red ERROR, yellow WARN, blue INFO, gray DEBUG)
- Click row to expand and see full context
- Sticky header with filters

### Test Log Button
- Button labeled "Test" or "Send Test Log" in toolbar
- Icon: beaker/flask
- Behavior:
  ```typescript
  onClick: async () => {
    await vibe.site_logs.create({
      data: {
        level: 'info',
        message: 'Test log entry from VibeLogViewer',
        source: 'log-viewer-test-button',
        metadata: {
          timestamp: new Date().toISOString(),
        }
      }
    })
    // Show toast: 'Test log sent'
    // Auto-refresh the log list
  }
  ```
- Purpose: Lets devs verify logging pipeline works end-to-end

## Permissions

- Requires admin role to access
- Consider `useCanViewLogs()` hook or wrapper with permission check

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultLevel` | `'ERROR' \| 'WARN' \| 'INFO' \| 'DEBUG'` | `undefined` | Pre-filter by level |
| `category` | `string` | `undefined` | Pre-filter by category |
| `from` | `Date` | `undefined` | Start date filter |
| `to` | `Date` | `undefined` | End date filter |
| `autoRefresh` | `boolean` | `false` | Enable auto-refresh |
| `refreshInterval` | `number` | `5000` | Refresh interval in ms |
