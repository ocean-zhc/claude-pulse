# Claude Pulse

> **Feel the heartbeat of your Claude Code sessions.** Real-time cost tracking, session analytics, and smart context alerts.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-v1.0.80+-purple.svg)](https://claude.ai/code)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## The Problem

Ever run a complex task in Claude Code and wonder:
- *"Is this going to cost me $5 or $50?"*
- *"Why is my context suddenly at 95%?"*
- *"Did that tool call fail, or is it still running?"*

**Claude Pulse** gives you complete visibility into your AI coding sessions.

---

## Features at a Glance

| Feature | What It Does |
|---------|--------------|
| **Real-time Cost Tracking** | See exactly how much you're spending, per-token breakdown |
| **Rate Limit Bars** | 5h and 7d quota bars with reset countdowns, read directly from Claude Code stdin |
| **Session Analytics** | Tool success rates, error tracking, performance metrics |
| **Smart Context Alerts** | Get warned before your context window fills up |
| **Activity Monitoring** | Track tools, agents, and todos in real-time |
| **One-line Installer** | `curl \| bash` from your terminal — atomic, idempotent, JSON-safe |

---

## Live Preview

```
[Opus 4.6 (1M context)] ███░░░░░░░ 27% | 5h █████░░░░░ 50% (35m) | 7d █░░░░░░░░░ 9% (6d2h)
my-project git:(main*) | 2 CLAUDE.md | ⏱  32m
💰 Cost: $0.66 (in: 220k, cache: 197k)
📊 Tools: 95/102 (93%) | avg: 441ms | top: Bash:34, Read:25 | 2 errors
✓ Bash ×34 | ✓ Read ×25 | ✓ Edit ×14 | ✓ TaskUpdate ×10 | ✗ 2 errors
⚠️ Context at 85% — Consider using /compact or starting a new session
```

Three percentage bars (context · 5h · 7d) align on row 1; project, git status, and duration sit on row 2 so the bar row never wraps off-screen.

---

## Quick Start

### Option A — Inside Claude Code (3 commands)

```bash
# 1. Add the marketplace
/plugin marketplace add ocean-zhc/claude-pulse

# 2. Install
/plugin install claude-pulse

# 3. Wire the statusLine
/claude-pulse:setup
```

The pulse starts immediately. No restart required.

### Option B — One-line terminal install

Already installed the plugin? Wire the statusLine in one shot from your terminal — no Claude Code session needed:

```bash
curl -fsSL https://raw.githubusercontent.com/ocean-zhc/claude-pulse/main/plugins/claude-pulse/scripts/setup-statusline.sh | bash
```

The installer:

- Validates `~/.claude/settings.json` is valid JSON before any mutation (refuses to touch broken files)
- Detects `bun` (preferred) or `node`, picks the right entry point
- Generates a self-resolving `$(ls ...)` command so future plugin upgrades are picked up automatically — no need to re-run after `/plugin update`
- Detects an existing statusLine and prompts before replacing it
- Refuses to overwrite without a tty (safe in `curl | bash` flows)
- Writes atomically via tempfile + `os.replace`, preserving every other key in `settings.json`
- Idempotent — re-running is a no-op

---

## Why I Built This

I've been using Claude Code daily for months. Great tool, but I had no visibility:
- No idea how much each session cost until the bill arrived
- Context would fill up without warning
- Couldn't tell if operations were succeeding or failing

So I built Claude Pulse — real-time monitoring for what matters.

---

## Feature Deep Dive

### Real-time Cost Tracking

Know exactly what you're spending:

```
💰 Cost: $0.42 (in: 89k, out: 4.2k, cache: 156k)
```

- Automatic model detection (Opus, Sonnet, Haiku)
- Detailed token breakdown (input, output, cache)

**Supported Models:**
| Model | Input | Output | Cache Read | Cache Write |
|-------|-------|--------|------------|-------------|
| Opus 4.5 | $15/M | $75/M | $1.50/M | $18.75/M |
| Sonnet 4 | $3/M | $15/M | $0.30/M | $3.75/M |
| Haiku 3.5 | $0.80/M | $4/M | $0.08/M | $1.00/M |

### Session Analytics

Track your productivity metrics:

```
📊 Tools: 47/49 (96%) | avg: 1.1s | top: Read:28, Edit:12
```

- Tool call success/failure rates
- Average operation duration
- Most-used tools ranking
- Error detection and tracking

### Rate Limit Bars (5h / 7d)

See your plan quotas as colored progress bars next to the context bar:

```
5h █████░░░░░ 50% (35m) | 7d █░░░░░░░░░ 9% (6d2h)
```

- Reads `rate_limits.{five_hour,seven_day}` directly from the Claude Code stdin payload — no extra API calls, works on macOS where credentials live in Keychain
- Falls back to the OAuth usage API only when stdin lacks the field (older Claude Code versions)
- Day-aware reset countdown: `35m`, `4h10m`, `1d21h`, `6d2h`
- Color thresholds: green &lt;70%, yellow 70–84%, red ≥85%

### Smart Context Alerts

Never hit the context limit unexpectedly:

| Threshold | Alert Level | Action Suggested |
|-----------|-------------|------------------|
| 70% | Warning | "Consider summarizing soon" |
| 85% | Critical | "Use /compact or compress context" |
| 95% | Danger | "Immediate action required" |

Optional: Enable terminal bell sounds for critical alerts.

---

## Configuration

### Presets

Choose your starting point:

| Preset | Description |
|--------|-------------|
| **Full** | Everything on — cost, stats, alerts, all activity |
| **Essential** | Balanced — context, cost, key metrics |
| **Minimal** | Clean — just model and context percentage |

### Customize Anytime

```bash
/claude-pulse:configure
```

**All Options:**

```json
{
  "layout": "default",
  "display": {
    "showCost": true,
    "showStats": true,
    "showTools": true,
    "showAgents": true,
    "showTodos": true
  },
  "alerts": {
    "enabled": true,
    "level": "critical",
    "soundEnabled": false
  },
  "cost": {
    "enabled": true,
    "showBreakdown": true
  }
}
```

---

## Commands

| Command | Description |
|---------|-------------|
| `/claude-pulse:setup` | Initial setup and configuration |
| `/claude-pulse:configure` | Customize display options |
| `/claude-pulse:stats` | View detailed session statistics |

---

## Detailed Statistics

Run `/claude-pulse:stats` for a full breakdown:

```
╔══════════════════════════════════════════════════════╗
║           Claude Code Session Statistics             ║
╠══════════════════════════════════════════════════════╣
║  Session Duration:  1h 23m                           ║
║  Total Cost:        $2.47                            ║
║  Context Usage:     67% (134k / 200k tokens)         ║
╚══════════════════════════════════════════════════════╝

🔧 Tool Usage (127 calls)
  Read            ████████████████████  52 (41.0%)
  Edit            ████████████          24 (18.9%)
  Grep            ██████████            20 (15.7%)
  Success Rate:   97.6%
  Avg Duration:   892ms
```

---

## Requirements

- Claude Code v1.0.80 or later
- Node.js 18+ or Bun

---

## Development

The repository root is a Claude Code marketplace manifest. The actual npm/TypeScript package lives under `plugins/claude-pulse/` — all build commands must run from there.

```bash
# Clone
git clone https://github.com/ocean-zhc/claude-pulse
cd claude-pulse/plugins/claude-pulse

# Install & build
npm install
npm run build          # tsc -> dist/
npm run dev            # tsc --watch

# Smoke test with a fake statusline payload
echo '{"model":{"display_name":"Opus"},"context_window":{"current_usage":{"input_tokens":45000},"context_window_size":200000},"rate_limits":{"five_hour":{"used_percentage":42,"resets_at":9999999999},"seven_day":{"used_percentage":9,"resets_at":9999999999}}}' | node dist/index.js
```

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ideas for contribution:**
- Additional currency support
- Custom alert sounds
- Export session reports
- Integration with other tools

---

## License

MIT — see [LICENSE](LICENSE)

---

## Star History

If this helps your workflow, consider giving it a star!

---

<p align="center">
  <b>Feel the pulse. Stay in control.</b><br>
  <sub>Built for developers who want visibility into their AI-assisted coding sessions.</sub>
</p>
