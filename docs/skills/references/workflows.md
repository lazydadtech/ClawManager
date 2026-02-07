# Workflows & Sequential Patterns

This document provides detailed workflow patterns for implementing features in the OpenClaw Mission Control builder.

## Feature Implementation Workflow

### Decision Tree: What Type of Feature?

```
Start: New Feature Request
│
├─ Data Display (Dashboard, List, Chart)?
│  └─ Go to: Display Feature Workflow
│
├─ User Action (Form, Button, Modal)?
│  └─ Go to: Action Feature Workflow
│
├─ Background Process (Backup, Sync, Alert)?
│  └─ Go to: Background Process Workflow
│
└─ Integration (API, External Service)?
   └─ Go to: Integration Workflow
```

## Display Feature Workflow

For dashboards, lists, charts, and data visualization:

```
1. Define Data Model
   ├─ Add table to drizzle/schema.ts
   ├─ Run: pnpm db:push
   └─ Verify migration applied

2. Create Database Helper
   ├─ Add query function to server/db.ts
   ├─ Test query returns correct data
   └─ Add TypeScript types

3. Create tRPC Procedure
   ├─ Add router to server/routers.ts
   ├─ Use database helper
   ├─ Add input validation with Zod
   └─ Test with Vitest

4. Build React Component
   ├─ Create component in client/src/pages/ or client/src/components/
   ├─ Use trpc hook to fetch data
   ├─ Add loading state (skeleton)
   ├─ Add error state (error message)
   └─ Add empty state (helpful message)

5. Add to Navigation
   ├─ Register route in client/src/App.tsx
   ├─ Add link to DashboardLayout
   └─ Test navigation works

6. Write Tests
   ├─ Test database query returns correct data
   ├─ Test tRPC procedure with valid/invalid input
   ├─ Test React component renders
   └─ Aim for >80% coverage

7. Verify & Deploy
   ├─ Run: pnpm test (all tests pass)
   ├─ Run: pnpm check (no TypeScript errors)
   ├─ Test in browser
   └─ Create checkpoint
```

## Action Feature Workflow

For forms, buttons, modals, and user interactions:

```
1. Design Form Schema
   ├─ Define input fields
   ├─ Create Zod schema
   └─ Add validation rules

2. Create Database Helper
   ├─ Add mutation function to server/db.ts
   ├─ Handle success and error cases
   └─ Return updated data

3. Create tRPC Mutation
   ├─ Add mutation to server/routers.ts
   ├─ Use Zod for input validation
   ├─ Call database helper
   ├─ Handle errors gracefully
   └─ Return success response

4. Build React Component
   ├─ Create form with react-hook-form
   ├─ Use shadcn/ui components
   ├─ Add loading state while submitting
   ├─ Show error messages
   ├─ Show success toast
   └─ Implement optimistic updates

5. Add Error Handling
   ├─ Catch validation errors
   ├─ Catch database errors
   ├─ Show user-friendly messages
   └─ Provide recovery options

6. Write Tests
   ├─ Test form validation
   ├─ Test successful submission
   ├─ Test error handling
   ├─ Test optimistic updates
   └─ Aim for >80% coverage

7. Verify & Deploy
   ├─ Run: pnpm test (all tests pass)
   ├─ Test in browser with valid data
   ├─ Test in browser with invalid data
   ├─ Test error scenarios
   └─ Create checkpoint
```

## Background Process Workflow

For backups, syncs, alerts, and scheduled tasks:

```
1. Define Process Schema
   ├─ Add tables to drizzle/schema.ts
   ├─ Include status tracking fields
   ├─ Add timestamp fields
   └─ Run: pnpm db:push

2. Create Service Function
   ├─ Create server/services/<feature>.ts
   ├─ Implement core logic
   ├─ Add error handling
   ├─ Add logging
   └─ Test with Vitest

3. Create tRPC Procedure
   ├─ Add procedure to server/routers.ts
   ├─ Trigger service function
   ├─ Track progress in database
   ├─ Return status updates
   └─ Handle cancellation

4. Build UI for Process
   ├─ Create component to trigger process
   ├─ Show progress indicator
   ├─ Display status messages
   ├─ Allow cancellation if applicable
   └─ Show completion status

5. Add Scheduling (if needed)
   ├─ Use node-cron for scheduling
   ├─ Add schedule configuration to database
   ├─ Implement schedule management UI
   └─ Log all executions

6. Write Tests
   ├─ Test service function logic
   ├─ Test error scenarios
   ├─ Test progress tracking
   ├─ Test scheduling (if applicable)
   └─ Aim for >80% coverage

7. Verify & Deploy
   ├─ Run: pnpm test (all tests pass)
   ├─ Test process execution
   ├─ Test error recovery
   ├─ Test scheduling (if applicable)
   └─ Create checkpoint
```

## Integration Workflow

For connecting to external APIs and services:

```
1. Document API
   ├─ Gather API endpoint URLs
   ├─ Document authentication method
   ├─ Get example request/response
   ├─ Note rate limits and timeouts
   └─ Create references/api-integration.md

2. Create API Client
   ├─ Create server/clients/<service>.ts
   ├─ Implement authentication
   ├─ Add error handling
   ├─ Add retry logic
   └─ Add timeout handling

3. Create Data Mapping
   ├─ Map API response to internal schema
   ├─ Handle missing/optional fields
   ├─ Normalize data format
   └─ Add TypeScript types

4. Create tRPC Procedures
   ├─ Add fetch procedure to server/routers.ts
   ├─ Call API client
   ├─ Transform response data
   ├─ Cache results if applicable
   └─ Handle API errors

5. Build UI Components
   ├─ Create components to display data
   ├─ Add loading states
   ├─ Add error states
   ├─ Add retry functionality
   └─ Add refresh capability

6. Add Configuration UI
   ├─ Create API configuration page
   ├─ Allow users to add API credentials
   ├─ Test connection functionality
   ├─ Store credentials securely
   └─ Show connection status

7. Write Tests
   ├─ Mock API responses
   ├─ Test successful data fetch
   ├─ Test error scenarios
   ├─ Test data transformation
   ├─ Test retry logic
   └─ Aim for >80% coverage

8. Verify & Deploy
   ├─ Run: pnpm test (all tests pass)
   ├─ Test with real API (if available)
   ├─ Test error handling
   ├─ Test rate limiting
   └─ Create checkpoint
```

## Backup & Restore Workflow

Specific workflow for implementing backup/restore features:

```
1. Create Backup Schema
   ├─ Add backups table
   ├─ Add backup_items table
   ├─ Add restore_operations table
   └─ Run: pnpm db:push

2. Implement Backup Service
   ├─ Create server/services/backup.ts
   ├─ Export data to S3
   ├─ Create backup record
   ├─ Store metadata
   └─ Handle errors

3. Implement Restore Service
   ├─ Fetch backup from S3
   ├─ Parse backup data
   ├─ Implement merge strategy
   ├─ Implement replace strategy
   ├─ Track restore progress
   └─ Handle conflicts

4. Create tRPC Procedures
   ├─ backup.create - Create new backup
   ├─ backup.list - List all backups
   ├─ backup.restore - Restore from backup
   ├─ backup.delete - Delete old backups
   └─ backup.getStatus - Get restore status

5. Build Backup UI
   ├─ Create BackupRestore.tsx page
   ├─ Show backup list
   ├─ Add create backup button
   ├─ Show backup details
   ├─ Add restore button
   └─ Show restore progress

6. Add Scheduling
   ├─ Create schedule configuration
   ├─ Implement daily/weekly/monthly backups
   ├─ Add retention policy
   ├─ Auto-delete old backups
   └─ Log all backup operations

7. Write Tests
   ├─ Test backup creation
   ├─ Test restore with merge strategy
   ├─ Test restore with replace strategy
   ├─ Test conflict handling
   ├─ Test scheduling
   └─ Aim for >80% coverage

8. Verify & Deploy
   ├─ Create test backup
   ├─ Test restore to new database
   ├─ Verify data integrity
   ├─ Test scheduling
   └─ Create checkpoint
```

## Multi-Provider OAuth Workflow

Specific workflow for implementing social login:

```
1. Configure OAuth Providers
   ├─ Setup Google OAuth
   ├─ Setup Microsoft OAuth
   ├─ Setup Apple OAuth
   ├─ Setup X/Twitter OAuth
   └─ Document credentials

2. Create Login Component
   ├─ Create MultiProviderLogin.tsx
   ├─ Add provider buttons
   ├─ Add provider icons
   ├─ Style for consistency
   └─ Add loading states

3. Implement OAuth Flow
   ├─ Handle OAuth callback
   ├─ Exchange code for token
   ├─ Create/update user record
   ├─ Set session cookie
   └─ Redirect to dashboard

4. Update User Schema
   ├─ Add loginMethod field
   ├─ Track provider information
   ├─ Store provider user ID
   └─ Run: pnpm db:push

5. Build Provider Selection UI
   ├─ Show provider options
   ├─ Handle provider selection
   ├─ Redirect to OAuth provider
   ├─ Handle OAuth callback
   └─ Show success/error messages

6. Write Tests
   ├─ Test OAuth flow for each provider
   ├─ Test user creation
   ├─ Test session management
   ├─ Test error handling
   └─ Aim for >80% coverage

7. Verify & Deploy
   ├─ Test each provider login
   ├─ Test user creation
   ├─ Test session persistence
   ├─ Test logout
   └─ Create checkpoint
```

## Dark Mode Workflow

Specific workflow for implementing theme switching:

```
1. Define Theme Variables
   ├─ Create light theme colors
   ├─ Create dark theme colors
   ├─ Use OKLCH format
   ├─ Ensure sufficient contrast
   └─ Update client/src/index.css

2. Create Theme Context
   ├─ Create ThemeContext.tsx
   ├─ Implement useTheme hook
   ├─ Add theme persistence (localStorage)
   ├─ Add system preference detection
   └─ Export theme provider

3. Update App Layout
   ├─ Wrap app with ThemeProvider
   ├─ Enable theme switching
   ├─ Test theme application
   └─ Verify all colors update

4. Add Theme Toggle UI
   ├─ Add toggle to DashboardLayout
   ├─ Show current theme icon
   ├─ Handle theme switching
   ├─ Add smooth transitions
   └─ Test on all pages

5. Test All Components
   ├─ Test light mode on all pages
   ├─ Test dark mode on all pages
   ├─ Verify text contrast
   ├─ Check for color issues
   └─ Test theme persistence

6. Write Tests
   ├─ Test theme context
   ├─ Test theme switching
   ├─ Test localStorage persistence
   ├─ Test system preference detection
   └─ Aim for >80% coverage

7. Verify & Deploy
   ├─ Test all pages in light mode
   ├─ Test all pages in dark mode
   ├─ Verify contrast ratios
   ├─ Test theme persistence
   └─ Create checkpoint
```
