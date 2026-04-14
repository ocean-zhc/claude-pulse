import type { RenderContext } from '../types.js';
import { cyan, dim, magenta, yellow } from './colors.js';

/**
 * Renders row 2: project path + git status + config-file counts + session duration.
 */
export function renderProjectLine(ctx: RenderContext): string | null {
  const display = ctx.config?.display;
  const parts: string[] = [];

  if (ctx.stdin.cwd) {
    const segments = ctx.stdin.cwd.split(/[/\\]/).filter(Boolean);
    const pathLevels = ctx.config?.pathLevels ?? 1;
    const projectPath = segments.length > 0 ? segments.slice(-pathLevels).join('/') : '/';

    let gitPart = '';
    const gitConfig = ctx.config?.gitStatus;
    const showGit = gitConfig?.enabled ?? true;

    if (showGit && ctx.gitStatus) {
      const gitParts: string[] = [ctx.gitStatus.branch];

      if ((gitConfig?.showDirty ?? true) && ctx.gitStatus.isDirty) {
        gitParts.push('*');
      }

      if (gitConfig?.showAheadBehind) {
        if (ctx.gitStatus.ahead > 0) {
          gitParts.push(` ↑${ctx.gitStatus.ahead}`);
        }
        if (ctx.gitStatus.behind > 0) {
          gitParts.push(` ↓${ctx.gitStatus.behind}`);
        }
      }

      gitPart = ` ${magenta('git:(')}${cyan(gitParts.join(''))}${magenta(')')}`;
    }

    parts.push(`${yellow(projectPath)}${gitPart}`);
  }

  if (display?.showConfigCounts !== false) {
    if (ctx.claudeMdCount > 0) parts.push(dim(`${ctx.claudeMdCount} CLAUDE.md`));
    if (ctx.rulesCount > 0) parts.push(dim(`${ctx.rulesCount} rules`));
    if (ctx.mcpCount > 0) parts.push(dim(`${ctx.mcpCount} MCPs`));
    if (ctx.hooksCount > 0) parts.push(dim(`${ctx.hooksCount} hooks`));
  }

  if (display?.showDuration !== false && ctx.sessionDuration) {
    parts.push(dim(`⏱️  ${ctx.sessionDuration}`));
  }

  return parts.length > 0 ? parts.join(' | ') : null;
}
