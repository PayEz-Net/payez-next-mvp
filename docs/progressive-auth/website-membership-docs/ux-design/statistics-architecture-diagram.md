```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│ IDP Admin Dashboard                                         │
│  ├── Calls: /api/activity/user-stats                      │
│  ├── Shows: Real user statistics                          │
│  └── Updates: StatsCard components with live data         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Next.js API Layer                           │
├─────────────────────────────────────────────────────────────┤
│ /api/activity/user-stats                                   │
│ /api/activity/role-stats                                   │
│ /api/activity/client-stats/[id]                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            C# ActivityController (Backend)                 │
├─────────────────────────────────────────────────────────────┤
│ GET /api/Activity/user-stats                               │
│ GET /api/Activity/role-stats                               │
│ GET /api/Activity/client-stats/{clientId}                 │
│                                                            │
│ + SignalR Hub Context (Ready for live updates)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   UserService Layer                        │
├─────────────────────────────────────────────────────────────┤
│ GetUserStatsAsync()  - Real EF queries                    │
│ GetRoleStatsAsync()  - Role assignment calculations       │
│ GetClientStatsAsync() - Client metrics (placeholder)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database                               │
├─────────────────────────────────────────────────────────────┤
│ ApplicationUser table - User statistics                   │
│ ApplicationRole table - Role assignments                  │
│ UserManager/RoleManager - Identity framework              │
└─────────────────────────────────────────────────────────────┘
```
