# Sentinel Ops - MVP Feature Inventory
*Generated for UI/UX Design Review based on implemented code (v1.0.0 Alpha)*

## 1. Authentication & Security
- **Login Screen**: Dark industrial theme, Email/Password authentication.
- **Session Management**: Persistent sessions via Supabase Auth.
- **Multi-Tenancy**: Strict data isolation via Row Level Security (RLS). Users only see data from their organization.
- **Role System**: Supported roles: 'admin', 'supervisor', 'operator'.

## 2. Dashboard (Home)
- **Fleet Health Overview**: Donut chart showing Active vs Maintenance vs Offline assets.
- **Operational Risk**: Counter of active critical alerts.
- **Daily Compliance**: Progress bar indicating daily checklist completion rate.
- **Quick Actions**: Navigation to Team, Map, Scan, and Add Asset.

## 3. Asset Management (Core)
- **Asset List**: Scrollable grid of asset cards with status indicators (Green/Orange/Gray).
- **Asset Drawer**: Slide-out panel for details to maintain context.
  - **Summary View**: Technical specs, serial numbers, location.
  - **History View**: Timeline of maintenance logs with photos.
  - **Edit Mode**: Update asset details.
- **Creation Flow**: Modal to register new assets with QR code generation (visual).

## 4. Maintenance & Checklist
- **Dynamic Checklists**: Form with Pass/Fail/N/A toggles and comment fields.
- **Photo Evidence**: Camera integration to capture and upload photos directly to logs.
- **GPS Tagging**: Automatic capture of operator's geolocation during submission.
- **Offline Mode**: 
  - Full functionality without internet.
  - Auto-sync when connection is restored.
  - Visual indicator of pending uploads.

## 5. Fleet Map
- **Interactive Map**: Leaflet-based map visualization.
- **Markers**: Assets plotted by their last known GPS coordinates.
- **Status Filtering**: Markers color-coded by asset status.

## 6. Team Management
- **Team Roster**: List of all operators in the organization.
- **Role Visibility**: See who is Admin vs Operator.
- **Invite System**: UI for inviting new members (Email trigger placeholder).

## 7. Alerts & Notifications
- **Alert Panel**: Slide-out panel showing critical/warning alerts.
- **Severity Levels**: Visual distinction between Critical (Red) and Warning (Yellow).
- **Resolution Flow**: Mark alerts as resolved directly from the panel.
- **Toast Notifications**: Non-intrusive popups for success/error/sync messages.

## Technical Constraints for Design
- **Theme**: "Industrial Dark Mode" (Primary: #0d1117, Accent: #d29922).
- **Responsive**: Mobile-first design, adaptable to tablets.
- **Interactions**: Touch-friendly targets (min 44px) for field operators.
