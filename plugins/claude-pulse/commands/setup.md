---
name: setup
description: Configure claude-pulse as your statusline
allowed-tools: Bash, Read, Edit, AskUserQuestion
---

This command wires claude-pulse into `~/.claude/settings.json` as the active statusLine.

**Tip — terminal one-liner**: outside of Claude Code you can install in one shot with:

```bash
curl -fsSL https://raw.githubusercontent.com/hyeongjun-dev/claude-pulse/main/plugins/claude-pulse/scripts/setup-statusline.sh | bash
```

The slash-command flow below does the same thing but runs the bundled installer directly from the locally-installed plugin cache.

## Step 0: Enable Plugin

Check if claude-pulse is enabled in `~/.claude/settings.json`:

```bash
grep -o '"claude-pulse@claude-pulse": *[^,}]*' ~/.claude/settings.json
```

If the result shows `false` or no result, use the Edit tool to set it to `true` in `enabledPlugins`:

```json
{
  "enabledPlugins": {
    "claude-pulse@claude-pulse": true
  }
}
```

## Step 1: Locate the bundled installer

```bash
ls -td ~/.claude/plugins/cache/claude-pulse/claude-pulse/*/ 2>/dev/null | head -1
```

If empty, the plugin is not installed yet. Tell the user to run:

```
/plugin marketplace add hyeongjun-dev/claude-pulse
/plugin install claude-pulse
```

**On Linux only**, if the install errors with `EXDEV: cross-device link not permitted`, suggest:

```bash
mkdir -p ~/.cache/tmp && TMPDIR=~/.cache/tmp /plugin install claude-pulse
```

Then re-check the plugin path.

## Step 2: Run the installer

```bash
bash "$(ls -td ~/.claude/plugins/cache/claude-pulse/claude-pulse/*/ 2>/dev/null | head -1)scripts/setup-statusline.sh"
```

The installer:

- Validates `~/.claude/settings.json` is valid JSON (refuses to mutate broken files).
- Detects `bun` (preferred) or `node` and picks the right entry point (`src/index.ts` or `dist/index.js`).
- Builds a self-resolving statusLine command so future plugin updates are picked up automatically.
- Detects an existing statusLine and prompts before replacing it. Idempotent — re-running is safe.
- Writes settings via tempfile + atomic replace, preserving all other keys.

If the installer prints `claude-pulse statusline already configured`, the user is done.

If it asks `Replace it with claude-pulse statusline? [Y/n]`, relay that prompt to the user and pass their answer back to the running command.

## Step 3: Verify it works

Tell the user:

1. Start a new Claude Code session (or restart current one)
2. Look for the status line appearing below the input field
3. The status line should show: context %, cost tracking, tool activity

If the status line doesn't appear:

- Check `~/.claude/settings.json` has the `statusLine` key
- Re-run the installer to see any errors
- Ensure the plugin is installed: `ls ~/.claude/plugins/cache/claude-pulse/`

If you see a `513` error after switching Claude accounts, remove the `statusLine` entry from `~/.claude/settings.json`, restart Claude Code, then re-run this command.

## Features Enabled

After setup completes, you'll have:

- **Real-time Cost Tracking**: See exactly how much you're spending per session
- **Session Analytics**: Tool success rates, error tracking, performance metrics
- **Smart Context Alerts**: Get warned at 70%, 85%, and 95% context usage
- **Activity Monitoring**: Track tools, agents, and todos in real-time

## Choose Your Preset

Select a display preset that matches your workflow:

| Preset | Description |
|--------|-------------|
| **Full** (Default) | Everything: cost, stats, tools, agents, todos, alerts |
| **Essential** | Balanced: context, cost, key metrics |
| **Minimal** | Clean: just model and context percentage |

## Commands

| Command | Description |
|---------|-------------|
| `/claude-pulse:configure` | Customize display settings |
| `/claude-pulse:stats` | View detailed session statistics |

## Need Help?

- GitHub: https://github.com/hyeongjun-dev/claude-pulse

Your pulse is ready. Happy coding!
