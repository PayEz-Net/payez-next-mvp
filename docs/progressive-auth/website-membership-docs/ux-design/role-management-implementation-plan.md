# Role Management UX Implementation Plan

## Overview

This document outlines the complete implementation plan for a modern, task-oriented role management system that replaces traditional tab-based interfaces with intuitive, workflow-driven designs.

## Design Philosophy

### Core Principles
1. **Task-Oriented**: Organize around what users want to accomplish, not technical architecture
2. **Progressive Disclosure**: Start simple, reveal complexity as needed
3. **Contextual Relationships**: Show connections between roles, users, and clients naturally
4. **Visual Clarity**: Use consistent iconography, color coding, and hierarchy
5. **Smart Defaults**: Reduce cognitive load with intelligent suggestions and automation

### Problems We're Solving
- ❌ Complex tab navigation between global/client roles
- ❌ Hidden relationships between role types
- ❌ Unclear impact of role changes
- ❌ Separated workflows for related tasks
- ❌ Technical jargon confusing business users

## File Structure

```
src/app/dashboards/idp-admin/roles/
├── page.tsx                           # Main roles dashboard
├── [id]/
│   ├── page.tsx                       # Individual role detail page
│   ├── assignments/
│   │   └── page.tsx                   # Role assignment management
│   └── permissions/
│       └── page.tsx                   # Role permissions/claims editor
├── components/
│   ├── RoleOverviewCards.tsx          # Dashboard overview cards
│   ├── RoleCategoryCard.tsx           # Expandable role category cards
│   ├── RoleDetailPanel.tsx            # Comprehensive role information
│   ├── PermissionEditor.tsx           # Visual claims/permissions editor
│   ├── RoleAssignmentPanel.tsx        # User/client assignment interface
│   ├── RoleUsageIndicator.tsx         # Shows where role is used
│   ├── SmartRoleCreator.tsx           # Guided role creation flow
│   └── BulkAssignmentTool.tsx         # Bulk role assignment interface
└── hooks/
    ├── useRoleCategories.ts           # Hook for role categorization
    ├── useRoleAssignments.ts          # Hook for assignment management
    └── useRoleImpactAnalysis.ts       # Hook for change impact analysis
```

## Page-by-Page Implementation Plan

### 1. Main Roles Dashboard (`/dashboards/idp-admin/roles/page.tsx`)

#### Layout Structure
```tsx
<RolesManagementPage>
  <PageHeader>
    <Breadcrumbs />
    <PageTitle>Role Management</PageTitle>
    <QuickActions />
  </PageHeader>
  
  <OverviewSection>
    <RoleOverviewCards />
  </OverviewSection>
  
  <QuickActionsSection>
    <CreateGlobalRoleButton />
    <CreateClientRoleButton />
    <BulkAssignButton />
  </QuickActionsSection>
  
  <RoleCategoriesSection>
    <RoleCategoryCard category="System Administration" />
    <RoleCategoryCard category="Merchant Management" />
    <RoleCategoryCard category="Client Management" />
    <RoleCategoryCard category="Support" />
  </RoleCategoriesSection>
  
  <RecentActivitySection>
    <RoleChangeLog />
  </RecentActivitySection>
</RolesManagementPage>
```

#### Key Features
- **Overview Cards**: Real-time stats (Global Roles, Client Roles, User Assignments, Recent Changes)
- **Role Categories**: Expandable cards grouped by business function
- **Quick Actions**: Context-aware buttons for common tasks
- **Recent Activity**: Audit trail of recent role changes
- **Search & Filter**: Smart search across all role types

#### Data Sources
- `GET /api/admin/roles` - Global roles
- `GET /api/admin/clients/*/roles` - All client roles (aggregated)
- `GET /api/admin/users/*/roles` - All user assignments (aggregated)
- `GET /api/admin/audit/roles` - Recent role changes

### 2. Individual Role Detail Page (`/dashboards/idp-admin/roles/[id]/page.tsx`)

#### Layout Structure
```tsx
<RoleDetailPage>
  <PageHeader>
    <Breadcrumbs />
    <RoleTitle>
      <RoleIcon type={role.type} />
      <RoleName>{role.name}</RoleName>
      <RoleType>{role.type}</RoleType>
    </RoleTitle>
    <RoleActions>
      <EditButton />
      <DeleteButton />
      <DuplicateButton />
    </RoleActions>
  </PageHeader>
  
  <RoleInformationPanel>
    <BasicInfo />
    <AuditInfo />
  </RoleInformationPanel>
  
  <PermissionsPanel>
    <CurrentClaims />
    <PermissionEditor />
  </PermissionsPanel>
  
  <UsagePanel>
    <ClientUsage />
    <UserAssignments />
    <ImpactAnalysis />
  </UsagePanel>
  
  <RelatedRolesPanel>
    <SimilarRoles />
    <DependentRoles />
  </RelatedRolesPanel>
</RoleDetailPage>
```

#### Key Features
- **Comprehensive Information**: Everything about one role in one place
- **Permission Management**: Visual editor for role claims
- **Usage Indicators**: Real-time display of where role is used
- **Impact Analysis**: Shows effect of potential changes
- **Related Roles**: Suggests similar or dependent roles

### 3. Role Assignment Management (`/dashboards/idp-admin/roles/[id]/assignments/page.tsx`)

#### Layout Structure
```tsx
<RoleAssignmentsPage>
  <AssignmentOverview>
    <TotalAssignments />
    <AssignmentsByClient />
    <AssignmentTrends />
  </AssignmentOverview>
  
  <AssignmentActions>
    <AssignToUserButton />
    <AssignToClientButton />
    <BulkAssignButton />
  </AssignmentActions>
  
  <AssignmentTable>
    <UserAssignmentsTab />
    <ClientAssignmentsTab />
  </AssignmentTable>
  
  <AssignmentHistory>
    <RecentChanges />
    <AssignmentAudit />
  </AssignmentHistory>
</RoleAssignmentsPage>
```

#### Key Features
- **Assignment Overview**: Visual breakdown of where role is assigned
- **Smart Assignment**: Context-aware user/client selection
- **Bulk Operations**: Efficient mass assignment tools
- **Assignment History**: Full audit trail of assignment changes

## Component Specifications

### 1. RoleOverviewCards Component

```tsx
interface RoleOverviewCardsProps {
  globalRolesCount: number;
  clientRolesCount: number;
  userAssignmentsCount: number;
  recentChangesCount: number;
}

const RoleOverviewCards: React.FC<RoleOverviewCardsProps> = ({
  globalRolesCount,
  clientRolesCount,
  userAssignmentsCount,
  recentChangesCount
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <OverviewCard
        icon={<Globe />}
        title="Global Roles"
        value={globalRolesCount}
        description="System-wide roles"
        trend="+2 this week"
        action={() => navigate('/roles?filter=global')}
      />
      <OverviewCard
        icon={<Building />}
        title="Client Roles"
        value={clientRolesCount}
        description="Client-specific roles"
        trend="+5 this week"
        action={() => navigate('/roles?filter=client')}
      />
      <OverviewCard
        icon={<Users />}
        title="User Assignments"
        value={userAssignmentsCount}
        description="Active role assignments"
        trend="+12 this week"
        action={() => navigate('/roles/assignments')}
      />
      <OverviewCard
        icon={<Activity />}
        title="Recent Changes"
        value={recentChangesCount}
        description="Changes in last 7 days"
        trend="View all"
        action={() => navigate('/roles/audit')}
      />
    </div>
  );
};
```

### 2. RoleCategoryCard Component

```tsx
interface RoleCategoryCardProps {
  category: string;
  roles: RoleWithUsage[];
  isExpanded?: boolean;
  onToggle?: () => void;
}

const RoleCategoryCard: React.FC<RoleCategoryCardProps> = ({
  category,
  roles,
  isExpanded = false,
  onToggle
}) => {
  return (
    <Card className="mb-4">
      <CardHeader 
        className="cursor-pointer" 
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CategoryIcon category={category} />
            <CardTitle>{category}</CardTitle>
            <Badge variant="secondary">{roles.length} roles</Badge>
          </div>
          <ChevronDown 
            className={`transform transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {roles.map((role) => (
            <RoleListItem 
              key={role.id}
              role={role}
              showUsage={true}
              actions={[
                { label: 'View Details', onClick: () => navigate(`/roles/${role.id}`) },
                { label: 'Edit', onClick: () => navigate(`/roles/${role.id}/edit`) },
                { label: 'View Assignments', onClick: () => navigate(`/roles/${role.id}/assignments`) }
              ]}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
};
```

### 3. PermissionEditor Component

```tsx
interface PermissionEditorProps {
  roleId: string;
  currentClaims: RoleClaim[];
  availableClaims: ClaimTemplate[];
  onSave: (claims: RoleClaim[]) => Promise<void>;
}

const PermissionEditor: React.FC<PermissionEditorProps> = ({
  roleId,
  currentClaims,
  availableClaims,
  onSave
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Permissions & Claims</h3>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Permission
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CurrentPermissionsPanel 
          claims={currentClaims}
          onRemove={handleRemoveClaim}
          onEdit={handleEditClaim}
        />
        <AvailablePermissionsPanel 
          claims={availableClaims}
          currentClaims={currentClaims}
          onAdd={handleAddClaim}
        />
      </div>
      
      <PermissionImpactAnalysis 
        roleId={roleId}
        proposedChanges={pendingChanges}
      />
      
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={handleReset}>
          Reset Changes
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges}>
          Save Permissions
        </Button>
      </div>
    </div>
  );
};
```

## API Integration Plan

### Required API Endpoints

#### Global Roles API
```typescript
// GET /api/admin/roles - List all global roles with usage stats
interface GlobalRolesResponse {
  data: Array<{
    id: number;
    name: string;
    normalizedName: string;
    description?: string;
    category: string;
    claims: RoleClaim[];
    usageStats: {
      userCount: number;
      clientCount: number;
      assignmentCount: number;
    };
    createdAt: string;
    updatedAt?: string;
  }>;
  total: number;
  categories: string[];
}

// POST /api/admin/roles - Create new global role
interface CreateGlobalRoleRequest {
  name: string;
  description?: string;
  category: string;
  claims?: string[];
}

// PUT /api/admin/roles/{id} - Update global role
// DELETE /api/admin/roles/{id} - Delete global role (with dependency check)
```

#### Client Roles API
```typescript
// GET /api/admin/clients/{id}/roles - List client-specific roles
interface ClientRolesResponse {
  data: Array<{
    idpClientRoleId: number;
    idpClientId: number;
    name: string;
    isRequired: boolean;
    description: string;
    permissions: ClientPermission[];
    userCount: number;
  }>;
  clientInfo: {
    name: string;
    type: string;
    isActive: boolean;
  };
}

// GET /api/admin/roles/client-summary - Aggregated client roles data
interface ClientRolesSummaryResponse {
  totalClientRoles: number;
  rolesByClient: Array<{
    clientId: number;
    clientName: string;
    roleCount: number;
    userAssignments: number;
  }>;
  mostUsedClientRoles: Array<{
    name: string;
    clientName: string;
    userCount: number;
  }>;
}
```

#### Role Assignments API
```typescript
// GET /api/admin/roles/{id}/assignments - Get all assignments for a role
interface RoleAssignmentsResponse {
  role: GlobalRole | ClientRole;
  assignments: {
    users: Array<{
      userId: number;
      username: string;
      email: string;
      clientAssignments: Array<{
        clientId: number;
        clientName: string;
        assignedAt: string;
        assignedBy: number;
      }>;
    }>;
    clients: Array<{
      clientId: number;
      clientName: string;
      userCount: number;
      isRequired: boolean;
    }>;
  };
}

// POST /api/admin/roles/{id}/assignments - Bulk assign role
interface BulkAssignmentRequest {
  assignments: Array<{
    userId: number;
    clientId: number;
  }>;
}
```

#### Role Analytics API
```typescript
// GET /api/admin/roles/analytics - Role usage analytics
interface RoleAnalyticsResponse {
  overview: {
    totalGlobalRoles: number;
    totalClientRoles: number;
    totalAssignments: number;
    recentChanges: number;
  };
  trends: {
    assignmentsByDay: Array<{ date: string; count: number }>;
    topRolesByUsage: Array<{ roleName: string; assignmentCount: number }>;
    clientsWithMostRoles: Array<{ clientName: string; roleCount: number }>;
  };
  recentActivity: Array<{
    timestamp: string;
    action: 'created' | 'updated' | 'deleted' | 'assigned' | 'unassigned';
    entity: string;
    user: string;
    details: string;
  }>;
}
```

## Data Hooks Plan

### 1. useRoleCategories Hook
```typescript
export const useRoleCategories = () => {
  const [categories, setCategories] = useState<RoleCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };
  
  const isExpanded = (category: string) => expandedCategories.has(category);
  
  return {
    categories,
    toggleCategory,
    isExpanded,
    loading,
    error
  };
};
```

### 2. useRoleAssignments Hook
```typescript
export const useRoleAssignments = (roleId: string) => {
  const [assignments, setAssignments] = useState<RoleAssignments | null>(null);
  
  const assignToUser = async (userId: number, clientId: number) => {
    // Implementation for assigning role to user for specific client
  };
  
  const removeAssignment = async (assignmentId: number) => {
    // Implementation for removing role assignment
  };
  
  const bulkAssign = async (assignments: BulkAssignmentRequest) => {
    // Implementation for bulk assignment
  };
  
  return {
    assignments,
    assignToUser,
    removeAssignment,
    bulkAssign,
    loading,
    error
  };
};
```

### 3. useRoleImpactAnalysis Hook
```typescript
export const useRoleImpactAnalysis = (roleId: string) => {
  const analyzeImpact = async (proposedChanges: RoleChange[]) => {
    // Analyze impact of proposed role changes
    return {
      affectedUsers: number;
      affectedClients: number;
      potentialIssues: string[];
      recommendations: string[];
    };
  };
  
  const validateChanges = async (changes: RoleChange[]) => {
    // Validate that changes won't break system constraints
  };
  
  return {
    analyzeImpact,
    validateChanges,
    loading,
    error
  };
};
```

## Styling & Design System

### Color Scheme
```css
:root {
  /* Role Types */
  --role-global: #3b82f6;      /* Blue - Global roles */
  --role-client: #10b981;      /* Green - Client roles */
  --role-assignment: #f59e0b;  /* Amber - Assignments */
  --role-permission: #8b5cf6;  /* Purple - Permissions */
  
  /* Status Colors */
  --status-active: #10b981;
  --status-inactive: #6b7280;
  --status-required: #ef4444;
  --status-optional: #6b7280;
  
  /* Interactive States */
  --hover-global: #2563eb;
  --hover-client: #059669;
  --hover-assignment: #d97706;
  --hover-permission: #7c3aed;
}
```

### Icon System
```typescript
const RoleIcons = {
  global: Globe,
  client: Building,
  assignment: Users,
  permission: Shield,
  claim: Key,
  audit: Activity,
  required: AlertTriangle,
  optional: Info
};
```

## Testing Strategy

### Unit Tests
- Component rendering and interaction
- Hook behavior and state management
- Data transformation utilities
- Permission validation logic

### Integration Tests
- API endpoint integration
- Role assignment workflows
- Permission modification flows
- Bulk operations

### E2E Tests
- Complete role creation workflow
- Role assignment and removal
- Permission management
- Client role configuration

## Performance Considerations

### Optimization Strategies
1. **Virtual Scrolling** for large role lists
2. **Debounced Search** for real-time filtering
3. **Lazy Loading** for role details and assignments
4. **Optimistic Updates** for better UX
5. **Caching Strategy** for frequently accessed data

### Monitoring
- Role operation response times
- Component render performance
- API call frequency and caching effectiveness
- User interaction patterns

## Future Enhancements

### Phase 2 Features
1. **Role Templates** - Predefined role configurations
2. **Role Inheritance** - Hierarchical role relationships
3. **Conditional Permissions** - Context-based access control
4. **Role Approval Workflows** - Multi-step approval process
5. **Advanced Analytics** - Role usage insights and optimization

### Phase 3 Features
1. **AI-Powered Role Suggestions** - Smart role recommendations
2. **Risk Analysis** - Security impact assessment
3. **Compliance Reporting** - Automated compliance checking
4. **Integration APIs** - External system role synchronization

## Implementation Timeline

### Week 1: Foundation
- [ ] Create file structure and basic components
- [ ] Implement main roles dashboard layout
- [ ] Set up data hooks and API integration
- [ ] Basic styling and design system

### Week 2: Core Features
- [ ] Individual role detail pages
- [ ] Permission editor component
- [ ] Role assignment interface
- [ ] Search and filtering functionality

### Week 3: Advanced Features
- [ ] Bulk operations
- [ ] Impact analysis
- [ ] Audit trail and history
- [ ] Client role integration

### Week 4: Polish & Testing
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Documentation and training materials
- [ ] User acceptance testing

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-24  
**Next Review**: Implementation kickoff  
**Status**: Ready for Implementation  
