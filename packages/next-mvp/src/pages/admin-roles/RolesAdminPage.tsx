/**
 * Role Management Admin Page (/admin/roles)
 *
 * Design: Aurum (DESIGN_SPEC.md)
 * Three sections:
 * 1. Available Roles — Cards showing SiteAdmin, ClientAdmin
 * 2. User Assignments — Table with inline role dropdowns
 * 3. Change History — Audit log of role changes
 *
 * Design Principles:
 * - No shadows, gradients, or animation
 * - One accent color (blue #0066cc)
 * - Inline interactions (no modals)
 * - Scan-friendly tables and lists
 */

'use client';

import React, { useState } from 'react';

// Mock data
const MOCK_ROLES = [
  {
    id: 1,
    name: 'SiteAdmin',
    description: 'System-wide administrator. Manages all vibe_app features.',
    userCount: 1,
    lastChanged: '3/10/2026 by Admin',
  },
  {
    id: 2,
    name: 'ClientAdmin',
    description: 'Resume admin for Ideal Resume. Manages users, resumes, audit logs.',
    userCount: 2,
    lastChanged: '3/9/2026 by Admin',
  },
];

const MOCK_USERS = [
  { id: 1, email: 'alice@example.com', role: 'ClientAdmin', assigned: '3/10/2026' },
  { id: 2, email: 'bob@example.com', role: 'SiteAdmin', assigned: '2/28/2026' },
  { id: 3, email: 'carol@example.com', role: null, assigned: null },
  { id: 4, email: 'dave@example.com', role: 'ClientAdmin', assigned: '3/5/2026' },
  { id: 5, email: 'eve@example.com', role: 'ClientAdmin', assigned: '3/8/2026' },
];

const MOCK_CHANGES = [
  { timestamp: '3/10/2026, 10:15 AM', event: 'Alice assigned to ClientAdmin by Admin User' },
  { timestamp: '3/9/2026, 2:30 PM', event: 'Bob assigned to SiteAdmin by Admin User' },
  { timestamp: '3/8/2026, 4:45 PM', event: 'Carol removed from ClientAdmin by Admin User' },
  { timestamp: '3/8/2026, 3:00 PM', event: 'SiteAdmin edited: Description changed by Admin User' },
];

interface User {
  id: number;
  email: string;
  role: string | null;
  assigned: string | null;
}

export default function RolesAdminPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [tempRole, setTempRole] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (u) => u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditRole = (userId: number, currentRole: string | null) => {
    setEditingUserId(userId);
    setTempRole(currentRole);
  };

  const handleSaveRole = (userId: number) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, role: tempRole, assigned: '3/10/2026' } : u
      )
    );
    setMessage(`Role updated`);
    setEditingUserId(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRemoveRole = (userId: number) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: null, assigned: null } : u)));
    setMessage(`Role removed`);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div style={{ background: '#f8f8f8', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 400,
              color: '#333',
              marginBottom: '8px',
            }}
          >
            Role Management
          </h1>
          <p style={{ fontSize: '16px', color: '#666', fontWeight: 400 }}>
            Manage who has access to what role
          </p>
        </div>

        <div style={{ height: '1px', background: '#e0e0e0', margin: '24px 0' }} />

        {/* Section 1: Available Roles */}
        <section style={{ marginBottom: '60px' }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 400,
              color: '#666',
              marginBottom: '24px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Available Roles
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {MOCK_ROLES.map((role) => (
              <div
                key={role.id}
                style={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9f9f9';
                  e.currentTarget.style.borderColor = '#d0d0d0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#333',
                    marginBottom: '8px',
                  }}
                >
                  {role.name}
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '16px',
                    flex: 1,
                    lineHeight: 1.6,
                  }}
                >
                  {role.description}
                </p>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#999' }}>Users: {role.userCount}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    Last changed: {role.lastChanged}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      background: '#0066cc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#0052a3')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#0066cc')}
                  >
                    Edit
                  </button>
                  <button
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      background: 'white',
                      color: '#333',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ height: '1px', background: '#e0e0e0', margin: '24px 0' }} />

        {/* Section 2: User Assignments */}
        <section style={{ marginBottom: '60px' }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 400,
              color: '#666',
              marginBottom: '24px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            User Assignments
          </h2>

          {/* Search */}
          <div style={{ marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                background: 'white',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Message */}
          {message && (
            <div
              style={{
                padding: '8px 12px',
                background: '#e8f5e9',
                color: '#2e7d32',
                borderRadius: '4px',
                marginBottom: '12px',
                fontSize: '13px',
              }}
            >
              ✓ {message}
            </div>
          )}

          {/* Table */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <thead>
              <tr style={{ background: '#f8f8f8', borderBottom: '1px solid #e0e0e0' }}>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 'normal',
                  }}
                >
                  User
                </th>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 'normal',
                  }}
                >
                  Role
                </th>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 'normal',
                  }}
                >
                  Assigned
                </th>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 'normal',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: '1px solid #e0e0e0',
                    height: '48px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                >
                  <td style={{ padding: '16px', fontSize: '14px', color: '#333' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>
                    {editingUserId === user.id ? (
                      <select
                        value={tempRole || ''}
                        onChange={(e) => setTempRole(e.target.value || null)}
                        style={{
                          padding: '6px 10px',
                          fontSize: '13px',
                          border: '1px solid #0066cc',
                          borderRadius: '4px',
                          background: 'white',
                          color: '#333',
                        }}
                      >
                        <option value="">— Remove role —</option>
                        <option value="SiteAdmin">SiteAdmin</option>
                        <option value="ClientAdmin">ClientAdmin</option>
                      </select>
                    ) : user.role ? (
                      <span
                        style={{
                          background: '#e3f2fd',
                          color: '#0066cc',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          display: 'inline-block',
                        }}
                      >
                        {user.role}
                      </span>
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>(none)</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontSize: '12px', color: '#999' }}>
                    {user.assigned || '—'}
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px' }}>
                    {editingUserId === user.id ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleSaveRole(user.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#0066cc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#0052a3')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#0066cc')}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          style={{
                            padding: '6px 12px',
                            background: 'white',
                            color: '#333',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {user.role && (
                          <button
                            onClick={() => handleEditRole(user.id, user.role)}
                            style={{
                              padding: '6px 10px',
                              background: 'white',
                              color: '#0066cc',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                          >
                            ↓
                          </button>
                        )}
                        {!user.role ? (
                          <button
                            onClick={() => handleEditRole(user.id, null)}
                            style={{
                              padding: '6px 10px',
                              background: 'white',
                              color: '#0066cc',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                          >
                            +
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRemoveRole(user.id)}
                            style={{
                              padding: '6px 10px',
                              background: 'white',
                              color: '#cc0000',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#fff0f0')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '12px', fontSize: '12px', color: '#999' }}>
            {filteredUsers.length} of {users.length} users shown
          </div>
        </section>

        <div style={{ height: '1px', background: '#e0e0e0', margin: '24px 0' }} />

        {/* Section 3: Change History */}
        <section>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 400,
              color: '#666',
              marginBottom: '24px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Recent Changes
          </h2>
          <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
            {MOCK_CHANGES.map((change, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  borderBottom: idx < MOCK_CHANGES.length - 1 ? '1px solid #e0e0e0' : 'none',
                }}
              >
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  {change.timestamp}
                </div>
                <div style={{ fontSize: '14px', color: '#333' }}>{change.event}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
