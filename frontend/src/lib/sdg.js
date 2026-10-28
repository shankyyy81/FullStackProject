// The 17 UN Sustainable Development Goals: official colours, short names,
// target counts (169 in total) and the goal statements.
export const GOALS = [
    { n: 1, name: 'No Poverty', colour: '#E5243B', targets: 7, statement: 'End poverty in all its forms everywhere.' },
    { n: 2, name: 'Zero Hunger', colour: '#DDA63A', targets: 8, statement: 'End hunger, achieve food security and improved nutrition and promote sustainable agriculture.' },
    { n: 3, name: 'Good Health and Well-being', colour: '#4C9F38', targets: 13, statement: 'Ensure healthy lives and promote well-being for all at all ages.' },
    { n: 4, name: 'Quality Education', colour: '#C5192D', targets: 10, statement: 'Ensure inclusive and equitable quality education and promote lifelong learning for all.' },
    { n: 5, name: 'Gender Equality', colour: '#FF3A21', targets: 9, statement: 'Achieve gender equality and empower all women and girls.' },
    { n: 6, name: 'Clean Water and Sanitation', colour: '#26BDE2', targets: 8, statement: 'Ensure availability and sustainable management of water and sanitation for all.' },
    { n: 7, name: 'Affordable and Clean Energy', colour: '#FCC30B', targets: 5, statement: 'Ensure access to affordable, reliable, sustainable and modern energy for all.' },
    { n: 8, name: 'Decent Work and Economic Growth', colour: '#A21942', targets: 12, statement: 'Promote sustained, inclusive economic growth, full employment and decent work for all.' },
    { n: 9, name: 'Industry, Innovation and Infrastructure', colour: '#FD6925', targets: 8, statement: 'Build resilient infrastructure, promote sustainable industrialisation and foster innovation.' },
    { n: 10, name: 'Reduced Inequalities', colour: '#DD1367', targets: 10, statement: 'Reduce inequality within and among countries.' },
    { n: 11, name: 'Sustainable Cities and Communities', colour: '#FD9D24', targets: 10, statement: 'Make cities and human settlements inclusive, safe, resilient and sustainable.' },
    { n: 12, name: 'Responsible Consumption and Production', colour: '#BF8B2E', targets: 11, statement: 'Ensure sustainable consumption and production patterns.' },
    { n: 13, name: 'Climate Action', colour: '#3F7E44', targets: 5, statement: 'Take urgent action to combat climate change and its impacts.' },
    { n: 14, name: 'Life Below Water', colour: '#0A97D9', targets: 10, statement: 'Conserve and sustainably use the oceans, seas and marine resources.' },
    { n: 15, name: 'Life on Land', colour: '#56C02B', targets: 12, statement: 'Protect and restore land ecosystems, manage forests, combat desertification and halt biodiversity loss.' },
    { n: 16, name: 'Peace, Justice and Strong Institutions', colour: '#00689D', targets: 12, statement: 'Promote peaceful, inclusive societies, justice for all and accountable institutions.' },
    { n: 17, name: 'Partnerships for the Goals', colour: '#19486A', targets: 19, statement: 'Strengthen the means of implementation and revitalise the global partnership.' },
];

export const TOTAL_TARGETS = GOALS.reduce((sum, g) => sum + g.targets, 0);
console.assert(TOTAL_TARGETS === 169, 'SDG targets must sum to 169');

// On these light goal colours a white number falls under 3:1, so they take ink instead.
const INK_ON = new Set([2, 6, 7, 11, 15]);
export const tileInk = (goal) => (INK_ON.has(goal.n) ? '#1c1c1c' : '#ffffff');

// Backend labels look like "SDG 4: Quality Education" (or a bare "SDG 4").
export function goalFromLabel(label) {
    const match = /SDG\s*(\d{1,2})/i.exec(String(label || ''));
    return match ? GOALS[Number(match[1]) - 1] || null : null;
}

// A project's sdg_mapping is { "SDG 4: ...": "SDG 4: ..." }; keys and values both carry the label.
export function goalsOfProject(project) {
    const labels = Object.values(project?.sdg_mapping || {});
    const seen = new Set();
    return labels
        .map(goalFromLabel)
        .filter((g) => g && !seen.has(g.n) && seen.add(g.n));
}
