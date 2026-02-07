# 🦞 OpenClaw Mission Control Builder

A comprehensive AI agent management dashboard and reusable skill for OpenClaw deployments. Monitor, control, and manage your AI agents with real-time metrics, task management, financial tracking, and intelligent backup/restore capabilities.

**Status**: ✅ Production Ready | **Version**: 1.0.0 | **License**: MIT

---

## 🎯 Overview

OpenClaw Mission Control Builder is a full-featured web application that provides a unified control plane for managing OpenClaw deployments. Whether you're running a single agent or orchestrating multiple AI assistants across different channels, this dashboard gives you complete visibility and control.

### What's Included

- **Mission Control Dashboard** - Real-time agent status, heartbeat monitoring, and bandwidth metrics
- **Workshop Kanban Board** - Task management with momentum-based ranking system
- **Financial Tracking** - Real-time API usage costs and spending analytics
- **Cron Jobs Manager** - Schedule and deploy automated 24-hour tasks
- **DocuDigest** - High-speed PDF processing and document management
- **Agent Hub** - Agent hierarchy visualization and inter-agent communication logs
- **Backup & Restore System** - Disaster recovery with merge/replace strategies and S3 versioning
- **API Configuration** - Secure endpoint management for your OpenClaw deployment
- **Dark Mode** - Beautiful light/dark theme switching with persistent preferences
- **Multi-Provider Auth** - Sign in with Google, Microsoft, Apple, or X/Twitter

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 22
- OpenClaw installed and running
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/lazydadtech/ClawManager.git
cd openclaw-mission-control

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local

# Start development server
pnpm dev
```

The dashboard will be available at `http://localhost:3000`

### Production Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

---

## 📋 Features

### Phase 1: MVP (Current)

#### Mission Control Dashboard
- Real-time agent status indicators
- Heartbeat countdown timers
- Bandwidth metrics visualization
- Current activity tracking
- Apple-inspired liquid glass UI aesthetic

#### Workshop Kanban Board
- Three-column task management (Queued, In Progress, Completed)
- Draggable task cards with momentum-based ranking
- Task detail modals for viewing completed work
- Task editing interface for queued items
- Deploy-to-workshop functionality

#### Financial Dashboard
- Real-time API usage cost tracking
- Daily, weekly, and monthly cost visualizations
- Spending alerts and threshold notifications
- Historical cost data view
- Budget tracking and projections

#### Cron Jobs Manager
- Scheduled task listing with descriptions
- Execution history and status tracking
- Twitter use-case skill example
- Email-style use case suggestions
- One-click deploy-to-workshop functionality

#### DocuDigest
- PDF upload interface
- High-speed document processing display
- Processing status indicators
- Document management view
- Digestion progress tracking

#### Agent Hub
- Jarvis commander agent display
- Sub-agent listing with personality profiles
- Inter-agent communication log
- Agent status indicators
- Planned work and discussion tracking

#### Backup & Restore System
- **Manual Backups**: Create on-demand with custom labels
- **Automatic Scheduling**: Daily, weekly, monthly with retention policies
- **Dual Storage**: S3 cloud + local database snapshots
- **Selective Backup**: Choose what to include (agents, tasks, documents, metrics, cron jobs, use cases, budget alerts)
- **Merge Strategy**: Intelligently combine backup data with current state
- **Replace Strategy**: Completely overwrite with backup state
- **Restore History**: Full audit log of all restore operations
- **Rollback Support**: Undo failed restores within 24 hours
- **Verification**: Checksum validation and integrity checks

#### API Configuration
- Secure form for OpenClaw API endpoints
- Multiple authentication methods (API Key, Bearer Token, OAuth)
- Polling interval configuration
- Connection test functionality
- Encrypted credential storage

#### Authentication
- Multi-provider OAuth (Google, Microsoft, Apple, X/Twitter)
- Manus OAuth integration
- Role-based access control (admin/user)
- Session persistence
- Secure token management

#### Dark Mode
- Theme toggle in user dropdown menu
- Smooth transition animations
- localStorage persistence
- OKLCH color system for superior color accuracy
- Complete component support

---

## 🏗️ Architecture

### Technology Stack

**Frontend**
- React 19 with TypeScript
- Tailwind CSS 4 with OKLCH colors
- Vite for build optimization
- Recharts for data visualization
- Shadcn/ui components
- Framer Motion for animations

**Backend**
- Express 4 server
- tRPC 11 for type-safe APIs
- Drizzle ORM for database
- MySQL/TiDB database
- SuperJSON for serialization

**Infrastructure**
- Docker-ready configuration
- S3 storage integration
- Tailscale Serve/Funnel support
- GitHub integration
- Environment-based configuration

### Database Schema

18 tables covering:
- User management and authentication
- Agent and task tracking
- Financial metrics and costs
- Backup and restore operations
- Monitoring configuration
- Alert management
- API credentials
- Communication logs

---

## 📦 Installation on Existing OpenClaw Deployments

### Step 1: Install as OpenClaw Skill

```bash
# Copy skill to OpenClaw workspace
cp -r docs/skills/openclaw-mission-control-builder ~/.openclaw/workspace/skills/

# Verify installation
ls ~/.openclaw/workspace/skills/openclaw-mission-control-builder/SKILL.md
```

### Step 2: Deploy Dashboard Application

```bash
# Configure for your OpenClaw deployment
export VITE_OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789
export DATABASE_URL=mysql://user:password@localhost/openclaw_dashboard

# Build and run
pnpm build
pnpm start
```

### Step 3: Connect to Gateway

1. Navigate to **API Configuration** page
2. Enter your OpenClaw Gateway URL
3. Click **Test Connection**
4. Dashboard will begin receiving real-time updates

### Deployment Scenarios

**Local Development**
```bash
VITE_OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789 pnpm dev
```

**Remote Gateway (via Tailscale)**
```bash
VITE_OPENCLAW_GATEWAY_URL=wss://openclaw.example.com:18789 pnpm start
```

**Docker**
```bash
docker build -t openclaw-mission-control .
docker run -e VITE_OPENCLAW_GATEWAY_URL=ws://openclaw-gateway:18789 -p 3000:3000 openclaw-mission-control
```

**Kubernetes**
```bash
kubectl apply -f k8s/deployment.yaml
```

---

## 🔌 Integration Guide

### Connect to OpenClaw Gateway

The dashboard automatically connects to your OpenClaw Gateway WebSocket:

```typescript
// Automatic connection to Gateway
const gatewayUrl = process.env.VITE_OPENCLAW_GATEWAY_URL;
const ws = new WebSocket(gatewayUrl);

// Available methods:
// - sessions.list: Get all active sessions
// - sessions.history: Fetch session transcripts
// - sessions_send: Message other sessions
// - gateway.status: Get gateway health
// - cron.list: List scheduled tasks
```

### API Configuration

Store your OpenClaw API credentials securely:

```json
{
  "endpoint": "https://openclaw.example.com:1980",
  "authMethod": "apiKey",
  "apiKey": "your-api-key",
  "pollingInterval": 30000
}
```

### Real-time Monitoring

The dashboard polls your OpenClaw API for:
- Agent health and uptime
- CPU/memory usage per agent
- Task queue status
- Financial metrics
- Error rates and alerts

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Watch mode
pnpm test -- --watch
```

### Test Coverage

- 69+ unit tests (100% passing)
- Backup system (31 tests)
- OAuth integration (21 tests)
- Auth logout (1 test)
- Monitoring system (16 tests)

### Manual Testing

```bash
# Start dev server
pnpm dev

# In another terminal, test API endpoints
curl http://localhost:3000/api/trpc/auth.me

# Test backup creation
curl -X POST http://localhost:3000/api/trpc/backup.create
```

---

## 📚 Documentation

### Skill Documentation

The skill includes comprehensive documentation:

- **SKILL.md** - 6-phase workflow for building AI agent dashboards
- **workflows.md** - Sequential patterns for all feature types
- **component-patterns.md** - Reusable React component examples
- **api-integration.md** - API integration best practices

### API Reference

See [API_REFERENCE.md](./docs/API_REFERENCE.md) for complete tRPC procedure documentation.

### Deployment Guide

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for production deployment instructions.

### OpenClaw Compatibility

See [OPENCLAW_COMPATIBILITY.md](./docs/OPENCLAW_COMPATIBILITY.md) for integration details with existing OpenClaw deployments.

---

## 🔒 Security

### Authentication

- Manus OAuth with multi-provider support
- Role-based access control (admin/user)
- Session persistence with secure cookies
- JWT token signing

### Data Protection

- Encrypted credential storage in database
- S3 encryption for backup files
- Environment-based secrets management
- No hardcoded credentials

### Best Practices

- Regular security audits
- Dependency vulnerability scanning
- CORS protection
- CSRF token validation
- Input sanitization
- Rate limiting on API endpoints

---

## 📊 Phase 2 Roadmap

Planned enhancements for Phase 2:

### Real-time Data Streaming
- WebSocket connections for live metrics
- Server-Sent Events (SSE) fallback
- HTTP polling with configurable intervals
- Data aggregation services

### Advanced Alerts
- Real-time alert triggering
- Email notification integration
- Alert acknowledgment system
- Alert management UI

### Enhanced Metrics
- 24-hour trend charts with live updates
- Weekly/monthly performance reports
- Comparison views (current vs. historical)
- Data retention policies

### Additional Features
- Request latency and throughput tracking
- Queue depth monitoring
- Processing speed analytics
- Error rate visualization

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Install dependencies
pnpm install

# Start dev server with hot reload
pnpm dev

# Run linting
pnpm format

# Type checking
pnpm check

# Run tests
pnpm test
```

---

## 📝 License

This project is licensed under the MIT License. You are free to use, modify, and distribute this software for any purpose, provided you include the original copyright notice and license text.

### MIT License Text

```
MIT License

Copyright (c) 2026 OpenClaw Mission Control Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### What You Can Do

- Use the software for any purpose (commercial or personal)
- Change and improve the code
- Share the software with others
- Include in your own projects with your own license

### What You Must Do

- Include a copy of the MIT License in your project
- Keep the original copyright notice intact

### What You Cannot Do

- Hold the authors liable for any issues
- Remove or modify the license text

### Full License File

For the complete license text and legal details, see the [LICENSE](./LICENSE) file in the repository root.

### Third-Party Licenses

This project uses open-source libraries. See [THIRD_PARTY_LICENSES.md](./docs/THIRD_PARTY_LICENSES.md) for details on dependencies and their licenses.

---

## 📄 Additional Legal Information

### Disclaimer

This software is provided "as-is" without warranty of any kind. The authors and contributors are not responsible for any issues, damages, or losses arising from the use of this software.

### Contributing

By contributing to this project, you agree that your contributions will be licensed under the same MIT License.

### Attribution

If you use this software in your project, we appreciate (but do not require) attribution to the original authors.

---

## 🙋 Support

### Documentation
- [OpenClaw Documentation](https://github.com/openclaw/openclaw)
- [Skill Documentation](./docs/skills/SKILL.md)
- [API Reference](./docs/API_REFERENCE.md)

### Issues & Questions
- [GitHub Issues](https://github.com/lazydadtech/ClawManager/issues)
- [GitHub Discussions](https://github.com/lazydadtech/ClawManager/discussions)

### Community
- [OpenClaw Discord](https://discord.gg/openclaw)
- [OpenClaw Discussions](https://github.com/openclaw/openclaw/discussions)

---

## 🎓 Learning Resources

### For OpenClaw Users
- [OpenClaw Getting Started](https://github.com/openclaw/openclaw#getting-started)
- [OpenClaw Skills Guide](https://github.com/openclaw/openclaw/tree/main/docs)
- [ClawHub Skill Registry](https://github.com/openclaw/openclaw#skills-registry-clawhub)

### For Developers
- [Skill Development Guide](./docs/skills/SKILL.md)
- [Component Patterns](./docs/skills/references/component-patterns.md)
- [API Integration Guide](./docs/skills/references/api-integration.md)
- [Workflow Patterns](./docs/skills/references/workflows.md)

---

## 🎉 Acknowledgments

Built with ❤️ for the OpenClaw community. Special thanks to:

- [OpenClaw Team](https://github.com/openclaw/openclaw) for the amazing AI agent framework
- [Manus](https://manus.im) for the development platform and infrastructure
- All contributors and community members

---

## 📈 Project Statistics

- **Lines of Code**: 15,784 (TypeScript/React)
- **Database Tables**: 18
- **API Procedures**: 40+
- **React Components**: 60+
- **Unit Tests**: 69 (100% passing)
- **Test Coverage**: Comprehensive
- **Build Status**: ✅ Passing
- **Type Safety**: 100% TypeScript

---

## 🚀 Getting Started

Ready to manage your OpenClaw deployment? 

1. **[Installation](#-quick-start)** - Get the dashboard running in 5 minutes
2. **[Configuration](#-integration-guide)** - Connect to your OpenClaw Gateway
3. **[Usage](#-features)** - Explore all available features
4. **[Deployment](#-installation-on-existing-openclaw-deployments)** - Deploy to production

**Questions?** Check the [documentation](./docs) or open an [issue](https://github.com/lazydadtech/ClawManager/issues).

---

**Made with 🦞 for OpenClaw**
