import { cn } from '@/lib/utils';
import { tileInk } from '@/lib/sdg';
import { initials, personTint } from '@/lib/people';

// The product's mark: one square tile with a smaller tile lifted out of its corner.
export function BrandMark({ className }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('size-6 shrink-0', className)}>
            <path d="M0 0h16v8h8v16H0z" fill="currentColor" />
            <rect x="18" y="0" width="6" height="6" fill="currentColor" />
        </svg>
    );
}

export function Wordmark({ className }) {
    return (
        <span className={cn('inline-flex items-center gap-2.5 font-semibold tracking-tight', className)}>
            <BrandMark />
            SDG Project Manager
        </span>
    );
}

const TILE_SIZES = {
    xs: 'size-5 text-[11px]',
    sm: 'size-7 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-16 text-xl',
};

// An SDG goal as its official numbered colour tile.
export function GoalTile({ goal, size = 'sm', className, title }) {
    return (
        <span
            title={title ?? `SDG ${goal.n}: ${goal.name}`}
            className={cn('num inline-flex shrink-0 items-start justify-start p-[0.3em] font-bold leading-none', TILE_SIZES[size], className)}
            style={{ background: goal.colour, color: tileInk(goal) }}
        >
            {goal.n}
        </span>
    );
}

export function PersonDisc({ name, className }) {
    return (
        <span
            title={name}
            className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium', className)}
            style={personTint(name)}
        >
            {initials(name)}
        </span>
    );
}

const STATUS_STYLE = {
    'On Track': 'bg-pill-neutral text-pill-neutral-ink',
    Delayed: 'bg-pill-warning text-pill-warning-ink',
    Completed: 'bg-pill-positive text-pill-positive-ink',
};

export function StatusPill({ status }) {
    return (
        <span className={cn('inline-flex h-5 flex-none items-center whitespace-nowrap rounded-full px-2 text-xs font-medium', STATUS_STYLE[status] || STATUS_STYLE['On Track'])}>
            {status || 'On Track'}
        </span>
    );
}
