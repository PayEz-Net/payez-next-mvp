# Two-Factor Authentication Management - Admin UI Specification

## Overview
This document defines the standardized approach for Two-Factor Authentication (2FA) management in the admin user management interface.

## Current Problems
- **Multiple Confusing Controls**: 2FA status and controls appear in multiple places with different wording
- **Unclear Terminology**: "Toggle to configure & enable" is confusing - what does it actually do?
- **Redundant UI Elements**: Same information and controls repeated across multiple components
- **Poor User Experience**: Admins have to hunt for where to actually manage 2FA

## Solution: Single Source of Truth

### Primary Control Location
**AdminQuickActions Component** - This will be the ONLY place where admins can toggle 2FA on/off

### Terminology Standards

| Element | Label | Values | Notes |
|---------|-------|--------|--------|
| **Primary Label** | "Two-Factor Authentication" | N/A | Never abbreviate to "2FA" in UI |
| **Status Display** | Status indicator | "Enabled" / "Disabled" | Clear, simple states |
| **Action Description** | Toggle behavior | See below | Explains what happens |

### Toggle Behavior Descriptions

#### When Disabled → Enabling (Toggle ON)
- **Primary Action**: "Enable Two-Factor Authentication"
- **User Explanation**: "User must configure and use a second factor at next login"
- **Technical Action**: Sends 2FA setup email to user

#### When Enabled → Disabling (Toggle OFF) 
- **Primary Action**: "Disable Two-Factor Authentication" 
- **User Explanation**: "All registered second-factor devices will be cleared"
- **Technical Action**: Revokes all 2FA devices for user

#### When Required by Client Constraints
- **Status**: "Required by clients: [Client Names]"
- **Toggle State**: Disabled/Locked
- **Icon**: Lock icon to indicate constraint
- **Behavior**: Cannot be toggled, shows error toast explaining constraint

## Component Responsibilities

### AdminQuickActions (Primary Control)
- ✅ **Interactive toggle switch**
- ✅ Status indicator with icon (ShieldCheck/ShieldAlert)  
- ✅ Explanatory sub-text describing current state
- ✅ Client constraint handling and display
- ✅ Confirmation dialogs for state changes
- ✅ Loading states during API calls

### Security Component (Read-Only Status)
- ✅ **Read-only status badge** - simple "Enabled"/"Disabled" 
- ✅ Small icon indicator
- ✅ Tooltip: "To change 2FA status use Admin Quick Actions above"
- ❌ **NO toggle** - removing duplicate control
- ❌ **NO explanatory text** - avoiding redundancy

### Other Components
- ❌ **No other 2FA controls** - single source of truth principle

## Implementation Checklist

- [ ] Update AdminQuickActions with proper labels and descriptions
- [ ] Remove toggle from Security component, replace with read-only badge
- [ ] Add tooltips to read-only elements pointing to primary control
- [ ] Ensure client constraints properly disable toggle and show explanation
- [ ] Add confirmation dialogs with clear action descriptions
- [ ] Test all state changes and error conditions
- [ ] Update accessibility labels for screen readers
- [ ] Add Cypress tests to prevent regressions

## Accessibility Requirements

- Toggle must have proper `aria-label` describing the action
- Status indicators must have accessible text alternatives
- Confirmation dialogs must be keyboard accessible
- Color must not be the only indicator of state (use icons + text)

## Future Enhancements

- Add 2FA method selection (email, SMS, authenticator app)
- Show last 2FA activity/usage for user
- Add "Test 2FA" functionality for admin verification
- Implement 2FA bypass tokens for emergency access
