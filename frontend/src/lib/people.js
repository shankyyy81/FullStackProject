export function initials(name) {
    const parts = String(name || '?').trim().split(/\s+/).filter((p) => !/^(dr|prof)\.?$/i.test(p));
    return ((parts[0]?.[0] || '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

// A stable pale tint per person: identity, not data. Hues sit about 60° apart, skipping violet.
const HUES = [20, 80, 140, 200, 330];
export function personTint(name) {
    let h = 0;
    for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const hue = HUES[h % HUES.length];
    return { background: `hsl(${hue} 45% 90%)`, color: `hsl(${hue} 45% 22%)` };
}
