import { isLimitReached } from '../types.js';
import { getContextPercent, getBufferedPercent, getModelName } from '../stdin.js';
import { coloredBar, cyan, dim, red, yellow, getContextColor, RESET } from './colors.js';
const DEBUG = process.env.DEBUG?.includes('claude-pulse') || process.env.DEBUG === '*';
/**
 * Renders row 1: model + context bar + percentage + 5h/7d rate-limit bars.
 */
export function renderSessionLine(ctx) {
    const model = getModelName(ctx.stdin);
    const rawPercent = getContextPercent(ctx.stdin);
    const bufferedPercent = getBufferedPercent(ctx.stdin);
    const autocompactMode = ctx.config?.display?.autocompactBuffer ?? 'enabled';
    const percent = autocompactMode === 'disabled' ? rawPercent : bufferedPercent;
    if (DEBUG && autocompactMode === 'disabled') {
        console.error(`[claude-pulse:context] autocompactBuffer=disabled, showing raw ${rawPercent}% (buffered would be ${bufferedPercent}%)`);
    }
    const bar = coloredBar(percent);
    const parts = [];
    const display = ctx.config?.display;
    if (display?.showModel !== false && display?.showContextBar !== false) {
        parts.push(`${cyan(`[${model}]`)} ${bar} ${getContextColor(percent)}${percent}%${RESET}`);
    }
    else if (display?.showModel !== false) {
        parts.push(`${cyan(`[${model}]`)} ${getContextColor(percent)}${percent}%${RESET}`);
    }
    else if (display?.showContextBar !== false) {
        parts.push(`${bar} ${getContextColor(percent)}${percent}%${RESET}`);
    }
    else {
        parts.push(`${getContextColor(percent)}${percent}%${RESET}`);
    }
    // Append 5h / 7d rate-limit bars to the same row
    const usage = ctx.usageData;
    if (display?.showUsage !== false && usage && (usage.fiveHour !== null || usage.sevenDay !== null)) {
        if (usage.apiUnavailable) {
            parts.push(yellow('usage: ⚠'));
        }
        else if (isLimitReached(usage)) {
            const resetTime = usage.fiveHour === 100
                ? formatResetTime(usage.fiveHourResetAt)
                : formatResetTime(usage.sevenDayResetAt);
            parts.push(red(`⚠ Limit reached${resetTime ? ` (resets ${resetTime})` : ''}`));
        }
        else {
            if (usage.fiveHour !== null) {
                parts.push(formatLimitSegment('5h', usage.fiveHour, usage.fiveHourResetAt));
            }
            if (usage.sevenDay !== null) {
                parts.push(formatLimitSegment('7d', usage.sevenDay, usage.sevenDayResetAt));
            }
        }
    }
    let line = parts.join(' | ');
    // Token breakdown at high context
    if (display?.showTokenBreakdown !== false && percent >= 85) {
        const ctxUsage = ctx.stdin.context_window?.current_usage;
        if (ctxUsage) {
            const input = formatTokens(ctxUsage.input_tokens ?? 0);
            const cache = formatTokens((ctxUsage.cache_creation_input_tokens ?? 0) + (ctxUsage.cache_read_input_tokens ?? 0));
            line += dim(` (in: ${input}, cache: ${cache})`);
        }
    }
    return line;
}
function formatLimitSegment(label, percent, resetAt) {
    const bar = coloredBar(percent);
    const color = getContextColor(percent);
    const reset = formatResetTime(resetAt);
    const tail = reset ? ` ${dim(`(${reset})`)}` : '';
    return `${dim(label)} ${bar} ${color}${percent}%${RESET}${tail}`;
}
function formatResetTime(resetAt) {
    if (!resetAt)
        return '';
    const diffMs = resetAt.getTime() - Date.now();
    if (diffMs <= 0)
        return '';
    const mins = Math.ceil(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days >= 1)
        return `${days}d${hours % 24}h`;
    if (hours >= 1)
        return `${hours}h${mins % 60}m`;
    return `${mins}m`;
}
function formatTokens(n) {
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)
        return `${(n / 1000).toFixed(0)}k`;
    return n.toString();
}
//# sourceMappingURL=session-line.js.map