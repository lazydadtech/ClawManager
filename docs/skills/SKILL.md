---
name: openclaw-mission-control-builder
description: Build comprehensive AI agent management dashboards with real-time monitoring, backup/restore systems, and multi-provider authentication. Use for creating production-ready OpenClaw deployment management platforms with Kanban task boards, financial tracking, and agent hierarchy visualization.
license: MIT
---

# OpenClaw Mission Control Builder

A complete workflow for building production-ready AI agent management dashboards. This skill encodes the process used to develop the OpenClaw Mission Control platform, enabling rapid creation of similar platforms for other AI orchestration systems.

## Overview

The OpenClaw Mission Control Builder transforms a basic web application into a comprehensive management platform featuring real-time monitoring, backup/restore capabilities, multi-provider authentication, and advanced task management. The workflow is organized into phases that can be completed sequentially or adapted based on project requirements.

### What This Skill Provides

1. **Phased Development Workflow** - Seven-phase approach from initial setup through production delivery
2. **Database Schema Templates** - Pre-built schemas for agents, tasks, metrics, backups, and monitoring
3. **Component Architecture** - Reusable React components and backend services
4. **Integration Patterns** - Best practices for API integration, authentication, and real-time data
5. **Testing Framework** - Comprehensive unit test patterns and validation strategies
6. **Deployment Checklist** - Production readiness verification and GitHub integration

## When to Use This Skill

Use this skill when you need to:

- Build dashboards for managing AI agent deployments or similar distributed systems
- Implement real-time monitoring with alerts and metrics tracking
- Create backup/restore systems with merge and replace strategies
- Add multi-provider OAuth authentication (Google, Microsoft, Apple, X/Twitter)
- Develop Kanban-based task management interfaces
- Track financial metrics and API usage costs
- Implement dark mode theme switching
- Create production-ready applications with comprehensive testing

## Phase 1: Project Setup & Database Schema

### Initialize the Web Application

Start with a web application template that includes React 19, Tailwind CSS 4, Express 4, tRPC 11, and Manus OAuth:

```bash
webdev_init_project project_name="your-project" features="web-db-user"
```

This creates a full-stack application with:
- React frontend with Tailwind CSS
- Express backend with tRPC procedures
- MySQL/TiDB database with Drizzle ORM
- Built-in Manus OAuth authentication
- Development server on port 3000

### Create Database Schema

Define your data model in `drizzle/schema.ts`. The OpenClaw implementation includes these core tables:

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| users | Authentication & authorization | id, openId, name, email, role |
| agents | AI agent definitions | id, name, status, healthScore, cpuUsage, memoryUsage |
| tasks | Task queue and history | id, title, status, priority, assignedAgent, createdAt |
| agentMetrics | Real-time metrics | id, agentId, timestamp, cpu, memory, uptime |
| alerts | Critical notifications | id, severity, message, agentId, acknowledged |
| backups | Backup versions | id, label, timestamp, strategy, status, s3Key |
| apiConfigurations | API connection settings | id, endpoint, authMethod, apiKey, pollInterval |

Push schema changes with:

```bash
pnpm db:push
```

### Create Initial Todo

Document all planned features in `todo.md`:

```markdown
# Project TODO

## Phase 1: Core Features
- [ ] Mission Control dashboard
- [ ] Workshop Kanban board
- [ ] Financial tracking
- [ ] API configuration page

## Phase 2: Advanced Features
- [ ] Real-time data streaming
- [ ] Alert management UI
- [ ] 24-hour trend charts
```

Update this file as you complete features, marking items as `[x]` when done.

## Phase 2: Core Dashboard UI

### Design System & Styling

Establish a consistent design language in `client/src/index.css`:

1. **Color Palette**: Define semantic colors using OKLCH format for superior color accuracy
2. **Typography**: Choose a modern font (e.g., Outfit) from Google Fonts
3. **Spacing System**: Use consistent spacing scale (4px, 8px, 16px, 32px)
4. **Dark Mode**: Define both light and dark theme variables

Example CSS structure:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.6%;
    --primary: 262.1 80% 50.4%;
    --primary-foreground: 210 40% 98%;
  }
  
  @media (prefers-color-scheme: dark) {
    :root {
      --background: 0 0% 3.6%;
      --foreground: 0 0% 98%;
    }
  }
}
```

### Layout Architecture

Use DashboardLayout component for consistent navigation:

```tsx
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  return (
    <DashboardLayout>
      {/* Page content */}
    </DashboardLayout>
  );
}
```

DashboardLayout provides:
- Persistent sidebar navigation
- User profile dropdown
- Theme toggle
- Responsive mobile drawer
- Logout functionality

### Create Dashboard Pages

Build each page as a separate component in `client/src/pages/`:

1. **Home.tsx** - Landing/login page with multi-provider OAuth
2. **MissionControl.tsx** - Real-time agent status and metrics
3. **Workshop.tsx** - Kanban board for task management
4. **FinancialDashboard.tsx** - API usage and cost tracking
5. **CronJobs.tsx** - Scheduled task management
6. **DocuDigest.tsx** - Document processing interface
7. **AgentHub.tsx** - Agent hierarchy and communication logs
8. **BackupRestore.tsx** - Backup management and recovery

Register routes in `client/src/App.tsx`:

```tsx
import { Route, Switch } from "wouter";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={MissionControl} />
      <Route path="/workshop" component={Workshop} />
      {/* Additional routes */}
    </Switch>
  );
}
```

## Phase 3: Backend Services & API Integration

### Create tRPC Procedures

Define backend logic in `server/routers.ts`:

```ts
export const appRouter = router({
  agents: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getAgents(ctx.user.id)
    ),
    getMetrics: protectedProcedure
      .input(z.object({ agentId: z.number() }))
      .query(({ input }) =>
        db.getAgentMetrics(input.agentId)
      ),
  }),
});
```

### Database Helper Functions

Create query helpers in `server/db.ts`:

```ts
export async function getAgents(userId: number) {
  const db = await getDb();
  return db.select().from(agents)
    .where(eq(agents.userId, userId));
}

export async function getAgentMetrics(agentId: number) {
  const db = await getDb();
  return db.select().from(agentMetrics)
    .where(eq(agentMetrics.agentId, agentId))
    .orderBy(desc(agentMetrics.timestamp))
    .limit(100);
}
```

### Frontend Data Fetching

Use tRPC hooks in React components:

```tsx
export default function Dashboard() {
  const { data: agents, isLoading } = trpc.agents.list.useQuery();
  const createTask = trpc.tasks.create.useMutation();

  if (isLoading) return <Skeleton />;

  return (
    <div>
      {agents?.map(agent => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
```

## Phase 4: Advanced Features

### Backup & Restore System

Implement backup creation with merge/replace strategies:

```ts
export async function createBackup(options: {
  label: string;
  includeData: string[];
  strategy: 'merge' | 'replace';
}) {
  // Export data to S3
  const s3Key = await exportToS3(options.includeData);
  
  // Create backup record
  return db.insert(backups).values({
    label: options.label,
    timestamp: new Date(),
    strategy: options.strategy,
    s3Key,
    status: 'completed',
  });
}
```

### Multi-Provider OAuth

Add social login support in `client/src/components/MultiProviderLogin.tsx`:

```tsx
export function MultiProviderLogin() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <OAuthButton provider="google" />
      <OAuthButton provider="microsoft" />
      <OAuthButton provider="apple" />
      <OAuthButton provider="x" />
    </div>
  );
}
```

### Real-time Monitoring

Implement API configuration page for connecting to external systems:

```tsx
export function ApiConfiguration() {
  const [config, setConfig] = useState({
    endpoint: '',
    authMethod: 'api-key',
    apiKey: '',
    pollInterval: 30,
  });

  const saveConfig = trpc.monitoring.saveConfig.useMutation();

  return (
    <form onSubmit={() => saveConfig.mutate(config)}>
      {/* Form fields */}
    </form>
  );
}
```

### Dark Mode Theme Switching

Enable theme toggle in DashboardLayout:

```tsx
const { theme, toggleTheme } = useTheme();

return (
  <button onClick={toggleTheme}>
    {theme === 'light' ? <Moon /> : <Sun />}
  </button>
);
```

## Phase 5: Testing & Quality Assurance

### Unit Testing with Vitest

Create test files alongside implementation:

```ts
// server/backup.test.ts
import { describe, it, expect } from 'vitest';

describe('backup system', () => {
  it('creates backup with correct metadata', async () => {
    const backup = await createBackup({
      label: 'Test Backup',
      includeData: ['agents', 'tasks'],
      strategy: 'merge',
    });

    expect(backup.label).toBe('Test Backup');
    expect(backup.status).toBe('completed');
  });
});
```

Run tests with:

```bash
pnpm test
```

### Component Testing

Test React components for rendering and interactions:

```tsx
import { render, screen } from '@testing-library/react';

describe('MissionControl', () => {
  it('displays agent status cards', () => {
    render(<MissionControl />);
    expect(screen.getByText(/agent status/i)).toBeInTheDocument();
  });
});
```

### Integration Testing

Verify end-to-end workflows:

1. Test authentication flow (login, logout, multi-provider)
2. Test data fetching and display
3. Test backup creation and restore
4. Test theme switching
5. Test responsive design

## Phase 6: Production Deployment

### Pre-Deployment Checklist

Before deploying, verify:

- [ ] All tests passing (100% pass rate)
- [ ] No TypeScript errors or warnings
- [ ] All pages render correctly
- [ ] Dark mode works on all pages
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Authentication flows working
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] GitHub repository synced

### Create Final Checkpoint

Save a production-ready checkpoint:

```bash
webdev_save_checkpoint description="Phase 1 Complete: Production-ready dashboard with all core features"
```

### Commit to GitHub

Push all code to your repository:

```bash
git add -A
git commit -m "Phase 1 Complete: OpenClaw Mission Control Dashboard

- 11 pages fully implemented
- 18 database tables
- 69+ unit tests passing
- Multi-provider OAuth
- Backup/restore system
- Dark mode support
- Production-ready code"

git push user_github main
```

## Best Practices

### Code Organization

- Keep router files under 150 lines; split into `server/routers/<feature>.ts` for larger features
- Use database helpers in `server/db.ts` for all queries
- Create reusable components in `client/src/components/`
- Store page-specific logic in `client/src/pages/`

### Data Management

- Store all business timestamps as UTC Unix timestamps
- Use optimistic updates for instant UI feedback
- Implement proper error handling and loading states
- Use tRPC for all backend communication

### UI/UX

- Use shadcn/ui components for consistency
- Implement loading skeletons for better perceived performance
- Show empty states with helpful guidance
- Provide clear error messages with recovery options

### Security

- Never expose API keys in frontend code
- Use environment variables for sensitive configuration
- Validate all user input on backend
- Implement proper role-based access control

### Testing

- Write tests alongside implementation
- Aim for >80% code coverage
- Test both happy paths and error cases
- Include integration tests for critical workflows

## Common Patterns

### Creating a New Feature

1. **Define database schema** - Add table to `drizzle/schema.ts`
2. **Push migration** - Run `pnpm db:push`
3. **Create database helpers** - Add query functions to `server/db.ts`
4. **Create tRPC procedures** - Add router to `server/routers.ts`
5. **Build UI component** - Create page in `client/src/pages/`
6. **Add tests** - Create test file with >80% coverage
7. **Update navigation** - Add route to `client/src/App.tsx`

### Handling Real-time Data

1. **Configure API endpoint** - Store in database via API Configuration page
2. **Create polling service** - Fetch data at regular intervals
3. **Update database** - Store metrics in agentMetrics table
4. **Display in UI** - Query latest metrics and display with charts
5. **Trigger alerts** - Check metrics against thresholds

### Adding a New Page

1. Create component in `client/src/pages/NewPage.tsx`
2. Add route to `client/src/App.tsx`
3. Add navigation link to DashboardLayout
4. Create backend procedures if needed
5. Add tests for component

## Troubleshooting

### Navigation Errors

**Problem**: "Cannot update a component while rendering a different component"

**Solution**: Move navigation logic to `useEffect` hook:

```tsx
useEffect(() => {
  if (isAuthenticated) {
    navigate("/dashboard");
  }
}, [isAuthenticated]);
```

### Database Connection Issues

**Problem**: "Cannot connect to database"

**Solution**: Verify `DATABASE_URL` environment variable is set and database is running:

```bash
pnpm db:push  # This will fail if connection is broken
```

### Theme Not Applying

**Problem**: Dark mode CSS variables not working

**Solution**: Ensure ThemeProvider is enabled in `App.tsx`:

```tsx
<ThemeProvider defaultTheme="light" switchable>
  {/* App content */}
</ThemeProvider>
```

## Next Steps After Phase 1

### Phase 2: Real-time Data Streaming

- Implement WebSocket connections for live updates
- Build 24-hour trend charts with historical data
- Create alert management UI with email notifications
- Add metrics aggregation service

### Phase 3: Advanced Features

- Implement agent skill management
- Add performance analytics and reporting
- Create custom dashboard widgets
- Build API webhook support

### Phase 4: Scale & Optimize

- Implement caching strategies
- Optimize database queries
- Add performance monitoring
- Setup CI/CD pipeline

## Resources

For detailed information on specific topics, see the bundled references:

- **Workflows** - `references/workflows.md` - Sequential workflow patterns and decision trees
- **Component Patterns** - `references/component-patterns.md` - Reusable React component examples
- **API Integration** - `references/api-integration.md` - Best practices for external API connections
- **Testing Strategies** - `references/testing-strategies.md` - Comprehensive testing patterns
