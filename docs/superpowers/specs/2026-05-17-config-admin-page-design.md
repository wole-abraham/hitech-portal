# Config / Admin Page — Design Spec
**Date:** 2026-05-17  
**Status:** Approved

## Overview
A single admin-only page at `/config` that lets Hi-Tech admins manage all dropdown data and user accounts from one place. Accessible only to users with `role = 'admin'`.

## Sections

| Section | Table | Fields | Operations |
|---|---|---|---|
| Team Cars | `hitech_report_teamcar` | name, plate_number, order | add, edit, delete |
| Subcontractors | `hitech_report_subcontractorname` | name, order | add, edit, delete |
| Activity Categories | `hitech_report_activitycategory` | name, order | add, edit, delete |
| Activity Types | `hitech_report_activitytype` | name, category_id | add, edit, delete |
| Activity Subtypes | `hitech_report_activitysubtype` | name, activity_type_id | add, edit, delete |
| Projects | `surveycollection_project` | name | add, edit, delete |
| Sections | `surveycollection_section` | name, project_id | add, edit, delete |
| Users | `auth_user` + `surveycollection_employee` | view name/email/role, toggle is_active | toggle only |

## Architecture

### API
Single catch-all route: `GET/POST/PATCH/DELETE /api/config/[resource]`  
Maps resource slug → table name. Admin session required on all methods.

### Frontend
`/config` page using `NavShell` + existing dark theme.  
Each section is a card with:
- Table of existing rows (name, key fields, edit/delete buttons)
- Inline "+ Add" form at the bottom of each card
- Edit mode: click pencil icon → row becomes an inline form

### Middleware
`/config` and `/api/config/*` added to `ADMIN_ONLY` list in `src/proxy.ts`.

## Constraints
- No password changes via this UI
- Delete is blocked if the item is referenced by existing reports (show error)
- Users section: toggle `is_active` on `auth_user` and `status` on `surveycollection_employee`
