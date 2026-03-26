/**
 * Page Permissions Admin Page (/admin/page-permissions)
 *
 * Design: Aurum (DESIGN_SPEC.md)
 * Control which roles can access which pages
 *
 * Three sections:
 * 1. Search & Filters — Find pages by route or category
 * 2. Pages & Role Requirements — Table showing pages and their role assignments
 * 3. Change History — Audit log of permission changes
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
const MOCK_PAGES = [
  {
    id: 1,
    route: '/dashboard',
    displayName: 'Dashboard',
    requires2fa: false,
    roles: [],
    category: 'user',
  },
  {
    id: 2,
    route: '/admin',
    displayName: 'Admin Dashboard',
    requires2fa: true,
    roles: ['SiteAdmin', 'ClientAdmin'],
    category: 'admin',
  },
  {
    id: 3,
    route: '/admin/users',
    displayName: 'User Management',
    requires2fa: true,
    roles: ['SiteAdmin'],
    category: 'admin',
  },
  {
    id: 4,
    route: '/account/security',
    displayName: 'Security Settings',
    requires2fa: true,
    roles: [],
    category: 'account',
  },
  {
    id: 5,
    route: '/interview-practice',
    displayName: 'Interview Practice',
    requires2fa: false,
    roles: ['ClientAdmin'],
    category: 'user',
  },
];

const MOCK_CHANGES = [
  {
    timestamp: '3/10/2026, 10:30 AM',
    event: '/admin/users role requirement changed: Added ClientAdmin by Admin User',
  },
  {
    timestamp: '3/10/2026, 10:15 AM',
    event: '/dashboard updated: 2FA requirement removed by Admin User',
  },
  {
    timestamp: '3/9/2026, 3:45 PM',
    event: '/interview-practice role requirement changed: Added SiteAdmin by Admin User',
  },
];

interface PagePermission {
  id: number;
  route: string;
  displayName: string;
  requires2fa: boolean;
  roles: string[];
  category: string;
}

const CATEGORIES = ['All Pages', 'Admin Pages', 'Account Pages', 'User Pages'];

const categoryMap: { [key: string]: string } = {
  'All Pages': '',
  'Admin Pages': 'admin',
  'Account Pages': 'account',
  'User Pages': 'user',
};

export default function PagePermissionsAdminPage() {
  const [pages, setPages] = useState<PagePermission[]>(MOCK_PAGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Pages');
  const [message, setMessage] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [tempRoles, setTempRoles] = useState<string[]>([]);

  const filteredPages = pages.filter((page) => {
    const matchesSearch =
      page.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.displayName.toLowerCase().includes(searchQuery.toLowerCase());

    const categoryFilter = categoryMap[activeFilter];
    const matchesCategory = !categoryFilter || page.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleEditRoles = (pageId: number, currentRoles: string[]) => {
    setEditingPageId(pageId);
    setTempRoles([...currentRoles]);
  };

  const handleToggleRole = (role: string) => {
    setTempRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSaveRoles = (pageId: number) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, roles: tempRoles } : p))
    );
    setMessage('Page updated');
    setEditingPageId(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRemoveRole = (pageId: number, role: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, roles: p.roles.filter((r) => r !== role) } : p
      )
    );
    setMessage('Role removed');
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
            Page Permissions
          </h1>
          <p style={{ fontSize: '16px', color: '#666', fontWeight: 400 }}>
            Control which roles can access which pages
          </p>
        </div>

        <div style={{ height: '1px', background: '#e0e0e0', margin: '24px 0' }} />

        {/* Section 1: Search & Filters */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search pages..."
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

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  border: activeFilter === cat ? 'none' : '1px solid #e0e0e0',
                  borderRadius: '4px',
                  background: activeFilter === cat ? '#0066cc' : 'white',
                  color: activeFilter === cat ? 'white' : '#333',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (activeFilter !== cat) {
                    e.currentTarget.style.background = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFilter !== cat) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        <div style={{ height: '1px', background: '#e0e0e0', margin: '24px 0' }} />

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

        {/* Section 2: Pages & Role Requirements */}
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
            Pages & Permissions
          </h2>

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
                  Route
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
                  Display Name
                </th>
                <th
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 'normal',
                  }}
                >
                  2FA
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
                  Roles
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.map((page) => (
                <tr
                  key={page.id}
                  style={{
                    borderBottom: '1px solid #e0e0e0',
                    height: '48px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                >
                  <td
                    style={{
                      padding: '16px',
                      fontSize: '12px',
                      fontFamily: 'Courier New, monospace',
                      color: '#333',
                    }}
                    title="Click to copy"
                  >
                    {page.route}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#333' }}>
                    {page.displayName}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px' }}>
                    {page.requires2fa ? '✓' : '✕'}
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px' }}>
                    {editingPageId === page.id ? (
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {['SiteAdmin', 'ClientAdmin'].map((role) => (
                            <label
                              key={role}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={tempRoles.includes(role)}
                                onChange={() => handleToggleRole(role)}
                                style={{ cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '12px', color: '#333' }}>{role}</span>
                            </label>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleSaveRoles(page.id)}
                            style={{
                              padding: '6px 10px',
                              background: '#0066cc',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#0052a3')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#0066cc')}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPageId(null)}
                            style={{
                              padding: '6px 10px',
                              background: 'white',
                              color: '#333',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {page.roles.length > 0 ? (
                          <>
                            {page.roles.map((role) => (
                              <span
                                key={role}
                                style={{
                                  background: '#e3f2fd',
                                  color: '#0066cc',
                                  padding: '4px 8px',
                                  borderRadius: '3px',
                                  fontSize: '12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                {role}
                                <button
                                  onClick={() => handleRemoveRole(page.id, role)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#0066cc',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    padding: '0',
                                    lineHeight: '1',
                                  }}
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                            <button
                              onClick={() => handleEditRoles(page.id, page.roles)}
                              style={{
                                padding: '4px 8px',
                                background: 'white',
                                color: '#0066cc',
                                border: '1px solid #e0e0e0',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '11px',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                            >
                              +
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEditRoles(page.id, [])}
                            style={{
                              padding: '4px 8px',
                              background: 'white',
                              color: '#0066cc',
                              border: '1px solid #e0e0e0',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '11px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                          >
                            + Add Role
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
            {filteredPages.length} of {pages.length} pages shown
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
