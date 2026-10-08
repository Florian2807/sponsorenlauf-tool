import { useEffect, useLayoutEffect, useId, useRef, useState } from 'react';

export default function LiveFilterMenu({ label, icon, value, options, groups = [], onChange }) {
    const [open, setOpen] = useState(false);
    const root = useRef(null);
    const trigger = useRef(null);
    const menu = useRef(null);
    const popover = useRef(null);
    const menuId = useId();
    const allOptions = [...options, ...groups.flatMap(group => [group.option, ...group.options])];
    const selected = allOptions.find(option => option.value === value);
    const close = (restore = false) => { setOpen(false); if (restore) trigger.current?.focus(); };
    useEffect(() => {
        if (!open) return;
        menu.current?.querySelector('[aria-checked="true"]')?.focus();
        const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
        document.addEventListener('pointerdown', outside);
        return () => { document.removeEventListener('pointerdown', outside); };
    }, [open]);
    useLayoutEffect(() => {
        if (!open) return;
        const position = () => {
            const panel = popover.current;
            if (!panel || !root.current) return;
            const bounds = panel.getBoundingClientRect();
            const rootBounds = root.current.getBoundingClientRect();
            const left = Math.max(12, Math.min(bounds.left, window.innerWidth - bounds.width - 12));
            panel.style.left = `${left - rootBounds.left}px`;
            panel.style.right = 'auto';
        };
        position();
        window.addEventListener('resize', position);
        window.addEventListener('scroll', position, true);
        return () => {
            window.removeEventListener('resize', position);
            window.removeEventListener('scroll', position, true);
        };
    }, [open]);
    const renderOption = (option, className) => <button key={option.value} type="button" role="menuitemradio" aria-label={option.label}
        className={className} aria-checked={option.value === value} tabIndex={option.value === value ? 0 : -1}
        onClick={() => { onChange(option.value); close(true); }}>
        <span>{option.shortLabel || option.label}</span>{option.value === value && <i className="fa-solid fa-check" aria-hidden="true" />}
    </button>;
    return <div ref={root} className="live-filter-menu" onBlur={event => {
        // Outside pointer presses close the menu even when the browser provides no focus target.
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }} onKeyDown={event => {
        if (!open) return;
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
        if (['ArrowDown', 'ArrowUp', 'Home', 'End', ...(groups.length ? ['ArrowLeft', 'ArrowRight'] : [])].includes(event.key)) {
            event.preventDefault();
            const items = [...menu.current.querySelectorAll('[role="menuitemradio"]')];
            const current = items.indexOf(document.activeElement);
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + items.length) % items.length;
            items[next]?.focus();
        }
    }}>
        <button type="button" ref={trigger} className={`live-filter-trigger${value !== 'all' ? ' live-filter-active' : ''}`} aria-label={`${label}: ${selected?.label || label}`}
            aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
            onPointerDown={event => {
                // Keep focus in the menu until click toggles it; an earlier blur can close and reopen it.
                if (open && event.button === 0) event.preventDefault();
            }}
            onClick={() => { if (open) close(true); else setOpen(true); }} onKeyDown={event => {
                if (!open && ['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen(true); }
            }}>
            <i className={`fa-solid ${icon}`} aria-hidden="true" /><span>{selected?.label || label}</span><i className="fa-solid fa-chevron-down live-filter-chevron" aria-hidden="true" />
        </button>
        {open && <div ref={popover} className={`live-filter-popover${groups.length ? ' live-class-popover' : ''}`}><p>{label} auswählen</p><div ref={menu} id={menuId} role="menu" aria-label={`${label} auswählen`}>
            {options.map(option => renderOption(option))}
            {groups.map(group => <div key={group.label} className="live-class-group" role="group" aria-label={group.label}>
                <div className="live-class-group-heading"><span>{group.label}</span>{renderOption(group.option, 'live-grade-select')}</div>
                <div className="live-class-chips">{group.options.map(option => renderOption(option, 'live-class-chip'))}</div>
            </div>)}
        </div></div>}
    </div>;
}
