import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { analyzeSDG } from '../api/projects';
import { GOALS, TOTAL_TARGETS, goalFromLabel, tileInk } from '@/lib/sdg';
import { initials, personTint } from '@/lib/people';
import { cn } from '@/lib/utils';
import { Wordmark } from '@/components/marks';

/*
 * Landing page. Direction (taste-skill, seed 200818415): "One motif".
 * On this page, the numbered square SDG goal tile becomes the one shape: the giant cropped
 * square in the hero, the square buttons, the bullets of the goal list, the photo frames
 * and the footer mark built from 17 blocks sized by each goal's number of UN targets.
 * The live thing: the hero square runs the real SDG-BERT endpoint on a problem statement.
 */

const EASE_OUT = [0.22, 1, 0.36, 1];
const EASE_EXPO = [0.16, 1, 0.3, 1];
const EASE_IN_OUT = [0.76, 0, 0.24, 1];

const rise = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '0px 0px -10% 0px' },
    transition: { duration: 0.8, ease: EASE_OUT, delay },
});

const SAMPLE_STATEMENT =
    'Rural primary schools in our district have no safe drinking water. Children carry water from open wells and miss class with stomach illness. We will build and test low-cost solar water purifiers that a school can maintain itself.';

const CREDITS = [
    { what: 'Students at the OTHBim-XR Laboratory in Regensburg', who: 'Daylightchaos', licence: 'CC BY-SA 4.0', href: 'https://commons.wikimedia.org/wiki/File:Students_at_the_OTHBim-XR_Laboratory_in_Regensburg.jpg' },
    { what: 'School Girl Ghana', who: 'Amuzujoe', licence: 'CC BY-SA 4.0', href: 'https://commons.wikimedia.org/wiki/File:School_Girl_Ghana.jpg' },
    { what: 'Technicians working on a solar panel installation', who: 'Stephen Yang / The Solutions Project', licence: 'CC BY 2.0', href: 'https://commons.wikimedia.org/wiki/File:Technicians_working_on_a_solar_panel_installation_(9229).jpg' },
    { what: 'A water well in Marika village', who: 'Saiphani02', licence: 'CC BY-SA 4.0', href: 'https://commons.wikimedia.org/wiki/File:A_water_well_in_Marika_village.jpg' },
    { what: 'Video of a tube-well in Chugawan village, Moga district, Punjab', who: 'MaplesyrupSushi', licence: 'CC BY-SA 4.0', href: 'https://commons.wikimedia.org/wiki/File:Video_of_a_tube-well_in_Chugawan_village,_Moga_tehsil,_Moga_district,_Punjab,_India,_19_April_2023.webm' },
];

export default function Home() {
    return (
        <div className="bg-field-slate text-ink">
            <Hero />
            <HowItMoves />
            <Roles />
            <PhotoBand />
            <GoalList />
            <Workspace />
            <Footer />
        </div>
    );
}

/* ───────────────────────── Hero: the giant square and the live model ───────────────────────── */

function NavLinks({ className }) {
    return (
        <nav aria-label="Main" className={cn('items-center gap-7 text-[15px]', className)}>
            <a href="#how" className="hidden hover:underline hover:underline-offset-4 sm:inline">How it works</a>
            <a href="#goals" className="hidden hover:underline hover:underline-offset-4 sm:inline">The 17 goals</a>
            <Link to="/login" className="font-medium hover:underline hover:underline-offset-4">Sign in</Link>
        </nav>
    );
}

function Hero() {
    return (
        <section className="grid lg:min-h-[min(100svh,880px)] lg:grid-cols-[46%_54%]">
            <div className="px-page flex flex-col">
                <header className="flex h-20 items-center justify-between">
                    <Link to="/" className="text-[18px]"><Wordmark /></Link>
                    <NavLinks className="flex lg:hidden" />
                </header>
                <div className="flex flex-1 flex-col justify-center pt-10 pb-14 lg:pt-0 lg:pr-12 lg:pb-20">
                    <h1 className="text-[clamp(3.25rem,6vw,5.75rem)] leading-[0.98] font-semibold tracking-[-0.035em]">
                        {['Problems in,', 'goals out'].map((line, i) => (
                            <span key={line} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
                                <motion.span
                                    className="block"
                                    initial={{ y: '105%' }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.15 + i * 0.11 }}
                                >
                                    {line}
                                </motion.span>
                            </span>
                        ))}
                    </h1>
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.45 }}
                        className="mt-8 max-w-[34ch] text-[18px] leading-[1.55]"
                    >
                        Faculty write a problem statement, a fine-tuned SDG-BERT model maps it to the UN goals, and a student team runs it to done.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.55 }}
                        className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4"
                    >
                        <SquareButton to="/register">Create account</SquareButton>
                        <Link to="/login" className="text-[18px] font-medium underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current">
                            Sign in
                        </Link>
                    </motion.div>
                </div>
            </div>

            <Analyzer />
        </section>
    );
}

function SquareButton({ to, children, tone = 'olive', className }) {
    return (
        <Link
            to={to}
            className={cn(
                'inline-flex h-14 items-center px-7 text-[18px] font-medium transition-[transform,background-color] duration-150 ease-out active:scale-[0.97]',
                tone === 'olive' ? 'bg-olive text-olive-ink hover:bg-[#3a4630]' : 'bg-olive-ink text-olive hover:bg-white',
                className
            )}
        >
            {children}
        </Link>
    );
}

// The live thing: the hero's olive square runs the real /ml/analyze endpoint and lights the goals it finds.
function Analyzer() {
    const [text, setText] = useState(SAMPLE_STATEMENT);
    const [state, setState] = useState({ status: 'idle', results: [] });

    const run = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setState({ status: 'loading', results: [] });
        try {
            const data = await analyzeSDG(text);
            const results = (data.applied_sdgs || [])
                .map((s) => ({ goal: goalFromLabel(s.sdg), confidence: s.confidence }))
                .filter((r) => r.goal);
            setState({ status: 'done', results });
        } catch {
            setState({ status: 'error', results: [] });
        }
    };

    const lit = new Map(state.results.map((r) => [r.goal.n, r.confidence]));

    return (
        <motion.section
            aria-labelledby="try-heading"
            initial={{ clipPath: 'inset(0 0 0 100%)' }}
            animate={{ clipPath: 'inset(0 0 0 0%)' }}
            transition={{ duration: 1.2, ease: EASE_EXPO, delay: 0.1 }}
            className="px-page flex flex-col bg-olive pb-14 text-olive-ink lg:pr-[clamp(1rem,2.2vw,2rem)] lg:pb-16 lg:pl-14"
        >
            <header className="hidden h-20 items-center justify-end lg:flex">
                <NavLinks className="flex" />
            </header>
            <div className="flex flex-1 flex-col justify-center pt-12 lg:pt-0">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.6 }}
                    className="max-w-[680px]"
                >
                    <h2 id="try-heading" className="text-[28px] leading-tight font-semibold tracking-[-0.015em]">Try the model</h2>
                    <form onSubmit={run} className="mt-5">
                        <label htmlFor="try-statement" className="sr-only">Problem statement</label>
                        <textarea
                            id="try-statement"
                            rows={4}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="block min-h-32 w-full resize-none bg-olive-step p-4 text-[18px] leading-[1.5] text-olive-ink [field-sizing:content] placeholder:text-olive-ink/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive-ink"
                        />
                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                            <button
                                type="submit"
                                disabled={state.status === 'loading' || !text.trim()}
                                className="inline-flex h-12 items-center gap-2 bg-olive-ink px-6 text-[18px] font-medium text-olive transition-[transform,background-color] duration-150 hover:bg-white active:scale-[0.97] disabled:opacity-70"
                            >
                                {state.status === 'loading' && <Loader2 className="size-4 animate-spin" />}
                                {state.status === 'loading' ? 'Reading…' : 'Map to goals'}
                            </button>
                            <p className="text-[15px]" aria-live="polite">
                                {state.status === 'idle' && 'Runs the same SDG-BERT model the app uses.'}
                                {state.status === 'done' && (state.results.length
                                    ? `${state.results.length} of 17 goals scored above 30%.`
                                    : 'No goal scored above 30%. Add who is affected and what changes.')}
                                {state.status === 'error' && 'The model is offline. Start the backend, or sign in and try it on a project.'}
                            </p>
                        </div>
                    </form>

                    <ul className="mt-8 grid grid-cols-6 gap-1.5 sm:grid-cols-9" aria-label="The 17 goals">
                        {GOALS.map((g, i) => {
                            const conf = lit.get(g.n);
                            const on = conf !== undefined;
                            return (
                                <motion.li
                                    key={g.n}
                                    initial={{ opacity: 0, scale: 0.85 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.8 + i * 0.025 }}
                                    title={`SDG ${g.n}: ${g.name}${on ? `, ${conf.toFixed(1)}%` : ''}`}
                                    className="flex aspect-square flex-col justify-between p-[0.45em] text-[15px] leading-none font-bold transition-colors duration-500"
                                    style={on ? { background: g.colour, color: tileInk(g) } : { background: '#3a4630', color: '#e3e2da' }}
                                >
                                    {g.n}
                                    {on && <span className="num font-medium">{Math.round(conf)}%</span>}
                                </motion.li>
                            );
                        })}
                    </ul>

                    {state.results.length > 0 && (
                        <ol className="mt-6 flex flex-col gap-1.5 text-[15px]">
                            {[...state.results].sort((a, b) => b.confidence - a.confidence).slice(0, 4).map((r) => (
                                <li key={r.goal.n} className="flex items-baseline justify-between gap-4">
                                    <span>SDG {r.goal.n}: {r.goal.name}</span>
                                    <span className="num">{r.confidence.toFixed(1)}%</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </motion.div>
            </div>
        </motion.section>
    );
}

/* ───────────────────────── How it works: one card, four fields ───────────────────────── */

const PROJECT = {
    title: 'Solar water purifiers for rural schools',
    statement: 'Primary schools have no safe drinking water; children miss class with stomach illness.',
    faculty: 'Dr. Meera Iyer',
    team: 'Clearwater',
    people: ['Arjun Rao', 'Kavya Nair', 'Rohan Das', 'Sana Qureshi'],
    goals: [{ n: 6, conf: 91.2 }, { n: 7, conf: 78.4 }],
    tasks: 12,
};

const FIELDS = [
    { bg: 'bg-field-sage', ink: 'text-ink', clause: ['First, a problem', 'is written down.'], stage: 0 },
    { bg: 'bg-field-blush', ink: 'text-ink', clause: ['Then the model', 'reads it.'], stage: 1 },
    { bg: 'bg-field-slate', ink: 'text-ink', clause: ['Then a team', 'takes it on.'], stage: 2 },
    { bg: 'bg-olive', ink: 'text-olive-ink', clause: ['Then it gets', 'done.'], stage: 3 },
];

function HowItMoves() {
    return (
        <section id="how" aria-labelledby="how-heading" className="grid md:grid-cols-2 xl:grid-cols-4">
            {FIELDS.map((f, i) => (
                <div key={i} className={cn('relative flex min-h-[64svh] flex-col px-5 py-7 md:min-h-[560px] md:px-6 xl:min-h-[max(84svh,640px)]', f.bg, f.ink)}>
                    {i === 0 && (
                        <h2 id="how-heading" className="text-[28px] leading-[1.1] font-bold tracking-[-0.02em]">
                            How a project moves
                        </h2>
                    )}
                    <motion.div {...rise(0.08 * i)} className="mt-8 flex flex-1 items-start md:mt-0 md:items-center md:justify-center">
                        <ProjectCard stage={f.stage} />
                    </motion.div>
                    <p className="mt-8 text-[28px] leading-[1.15] font-medium tracking-[-0.015em] md:mt-0">
                        {f.clause[0]}<br />{f.clause[1]}
                    </p>
                </div>
            ))}
        </section>
    );
}

function Disc({ name, className }) {
    return (
        <span className={cn('inline-flex size-[1.9em] shrink-0 items-center justify-center rounded-full text-[0.68em] font-medium', className)} style={personTint(name)}>
            {initials(name)}
        </span>
    );
}

// The same project card, further along in every field. A real fragment of the app, so data-ui.
function ProjectCard({ stage }) {
    return (
        <article
            data-ui
            className="w-full max-w-[260px] rounded-lg bg-white p-4 text-[13px] leading-[1.45] text-[#0a0a0a] transition-transform duration-150 ease-out hover:-translate-y-1.5"
        >
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-[14px] leading-5 font-medium">{PROJECT.title}</h3>
                {stage === 3 && <span className="h-5 shrink-0 rounded-full bg-[#dcfae5] px-2 text-[12px] leading-5 font-medium text-[#04250e]">Completed</span>}
            </div>

            {stage === 0 && (
                <>
                    <p className="mt-2 text-[#5e625e]">{PROJECT.statement}</p>
                    <p className="mt-3 flex items-center gap-2 text-[12px] text-[#5e625e]">
                        <Disc name={PROJECT.faculty} /> Draft by {PROJECT.faculty}
                    </p>
                </>
            )}

            {stage >= 1 && (
                <ul className="mt-3 flex flex-col gap-2">
                    {PROJECT.goals.map(({ n, conf }) => {
                        const g = GOALS[n - 1];
                        return (
                            <li key={n} className="flex items-center gap-2">
                                <span className="num flex size-6 shrink-0 items-start p-[3px] text-[11px] leading-none font-bold" style={{ background: g.colour, color: tileInk(g) }}>{n}</span>
                                <span className="min-w-0 flex-1 truncate">{g.name}</span>
                                {stage === 1 && <span className="num text-[#5e625e]">{conf.toFixed(1)}%</span>}
                            </li>
                        );
                    })}
                </ul>
            )}

            {stage >= 2 && (
                <div className="mt-3 flex items-center gap-2 border-t border-[#eef1ee] pt-3">{/* taste-skill-ignore: app card rule inside a data-ui fragment */}
                    <span className="flex">
                        {PROJECT.people.map((p, i) => <Disc key={p} name={p} className={cn('ring-2 ring-white', i > 0 && '-ml-1.5')} />)}
                    </span>
                    <span className="text-[12px]">Team {PROJECT.team}</span>
                </div>
            )}

            {stage === 2 && (
                <p className="num mt-2 text-[12px] text-[#5e625e]">0 of {PROJECT.tasks} tasks done</p>
            )}

            {stage === 3 && (
                <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-[#1d5fbf]" />
                    <p className="num mt-1.5 text-[12px] text-[#5e625e]">{PROJECT.tasks} of {PROJECT.tasks} tasks done</p>
                </div>
            )}
        </article>
    );
}

/* ───────────────────────── Roles: square plate, spare text ───────────────────────── */

const ROLES = [
    {
        id: 'faculty',
        tab: 'Faculty',
        title: 'Set the problem',
        body: 'Write what is wrong and who it hurts. The model proposes goals and UN targets, each with a confidence. You confirm one, then pick a leader and members from your students.',
        img: '/images/university-lab.jpg',
        alt: 'Students working with VR headsets in a university laboratory',
        w: 1200, h: 900,
    },
    {
        id: 'students',
        tab: 'Students',
        title: 'Work the board',
        body: 'Your team shares one board: to do, in progress, done. Move tasks across, attach drafts and data to each one, and talk to your faculty in the project chat.',
        img: '/images/classroom-ghana.jpg',
        alt: 'A schoolgirl in a blue uniform laughing in a classroom in Ghana',
        w: 1200, h: 801,
    },
    {
        id: 'research',
        tab: 'Research',
        title: 'Read before you build',
        body: 'Upload the papers you are reading as PDF, text or Markdown. Ask a question and the literature assistant answers from those papers, so the survey stays with the project.',
        img: '/images/solar-technicians.jpg',
        alt: 'Two technicians wiring a ground-mounted solar panel array',
        w: 1200, h: 800,
    },
];

function Roles() {
    const [active, setActive] = useState(ROLES[0].id);
    const role = ROLES.find((r) => r.id === active);

    return (
        <section aria-labelledby="role-title" className="px-page grid gap-10 bg-field-blush py-16 md:min-h-[max(88svh,680px)] md:grid-cols-2 md:gap-0 md:py-0">
            <div className="flex items-center md:py-10 md:pr-10">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={role.id}
                        className="relative aspect-square w-full overflow-hidden"
                        initial={{ clipPath: 'inset(0 0 100% 0)' }}
                        whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
                        exit={{ clipPath: 'inset(100% 0 0 0)', transition: { duration: 0.35, ease: [0.55, 0.055, 0.675, 0.19] } }}
                        viewport={{ once: true, margin: '0px 0px -15% 0px' }}
                        transition={{ duration: 1.1, ease: EASE_IN_OUT }}
                    >
                        <img
                            src={role.img}
                            width={role.w}
                            height={role.h}
                            alt={role.alt}
                            loading="lazy"
                            className="drift size-full object-cover grayscale"
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex flex-col justify-between gap-10 md:py-10 md:pl-10">
                <div id="role-panel" role="tabpanel" aria-labelledby={`tab-${role.id}`}>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div key={role.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: EASE_OUT }}>
                            <h2 id="role-title" className="text-[clamp(2rem,3.4vw,3.125rem)] leading-[1.02] font-bold tracking-[-0.03em]">{role.title}</h2>
                            <p className="mt-8 max-w-[34ch] text-[18px] leading-[1.55]">{role.body}</p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div role="tablist" aria-label="Who it is for" className="flex gap-5 md:order-first">
                    {ROLES.map((r) => (
                        <button
                            key={r.id}
                            role="tab"
                            id={`tab-${r.id}`}
                            aria-selected={r.id === active}
                            aria-controls="role-panel"
                            onClick={() => setActive(r.id)}
                            className="group flex flex-col items-start gap-2 text-[15px]"
                        >
                            <img
                                src={r.img}
                                width={r.w}
                                height={r.h}
                                alt=""
                                loading="lazy"
                                className="size-16 object-cover grayscale transition-transform duration-200 ease-out group-hover:-translate-y-1"
                            />
                            <span className={cn('border-b-4 pb-1 transition-colors', r.id === active ? 'border-ink font-medium text-ink' : 'border-transparent text-ink-soft group-hover:text-ink')}>
                                {r.tab}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Link to="/register" className="flex h-[60px] items-center whitespace-nowrap bg-ink px-6 text-[18px] font-medium text-white transition-[transform,background-color] duration-150 hover:bg-[#333] active:scale-[0.98] md:h-[72px]">
                        Create account
                    </Link>
                    <Link to="/login" className="flex h-[60px] items-center whitespace-nowrap bg-[#c9b5a8] px-6 text-[18px] font-medium transition-[transform,background-color] duration-150 hover:bg-[#bfaa9c] active:scale-[0.98] md:h-[72px]">
                        Sign in
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ───────────────────────── A full-width picture between the roles and the goals ───────────────────────── */

function PhotoBand() {
    return (
        <figure className="relative h-[clamp(320px,58vh,640px)] overflow-hidden bg-ink">
            <motion.img
                src="/images/solar-technicians.jpg"
                width={1200}
                height={800}
                alt="Two technicians wiring a ground-mounted solar panel array in a muddy field"
                loading="lazy"
                initial={{ scale: 1.08 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: [0.33, 1, 0.68, 1] }}
                className="size-full object-cover object-[50%_40%] grayscale"
            />
            <figcaption className="px-page absolute inset-x-0 bottom-0 bg-black/55 py-4 text-[15px] text-white">
                Fieldwork for SDG 7: technicians wiring a ground-mounted solar array.
            </figcaption>
        </figure>
    );
}

/* ───────────────────────── The 17 goals: a two-column list, tiles as bullets ───────────────────────── */

function GoalList() {
    return (
        <section id="goals" aria-labelledby="goals-heading" className="px-page py-24 md:py-36">
            <div className="flex items-baseline justify-between gap-6">
                <h2 id="goals-heading" className="text-[clamp(2rem,3.4vw,3.125rem)] leading-[1.02] font-bold tracking-[-0.03em]">The 17 goals</h2>
                <span className="num text-[15px]">{TOTAL_TARGETS} targets</span>
            </div>
            <p className="mt-5 max-w-[56ch] text-[18px] leading-[1.55]">
                Every problem statement is scored against all seventeen. The figure on the right is the number of UN targets under each goal; the model proposes the ones that fit.
            </p>
            <ol className="mt-12 grid gap-x-16 gap-y-9 md:grid-cols-2">
                {GOALS.map((g, i) => (
                    <motion.li
                        key={g.n}
                        {...rise(Math.min(i % 2, 1) * 0.07)}
                        className="grid grid-cols-[52px_minmax(0,1fr)] gap-5 md:grid-cols-[64px_minmax(0,1fr)]"
                    >
                        <span
                            className="num flex aspect-square items-start p-2 text-[18px] leading-none font-bold"
                            style={{ background: g.colour, color: tileInk(g) }}
                            aria-hidden="true"
                        >
                            {g.n}
                        </span>
                        <div>
                            <div className="flex items-baseline justify-between gap-4">
                                <h3 className="text-[18px] leading-6 font-bold">
                                    <span className="sr-only">Goal {g.n}: </span>{g.name}
                                </h3>
                                <span className="num shrink-0 text-[15px]">{g.targets} targets</span>
                            </div>
                            <p className="mt-1 max-w-[40ch] text-[18px] leading-[1.45]">{g.statement}</p>
                        </div>
                    </motion.li>
                ))}
            </ol>
        </section>
    );
}

/* ───────────────────────── Inside the workspace: close-ups on a board ───────────────────────── */

function Tile({ className, caption, line, children, tone = 'bg-white', delay = 0 }) {
    return (
        <motion.div {...rise(delay)} className={cn('relative overflow-hidden', tone, className)}>
            {children}
            {caption && (
                <div className="absolute bottom-5 left-5 right-5">
                    <p className="text-[18px] leading-6 font-medium">{caption}</p>
                    <p className="mt-0.5 text-[15px] leading-5 opacity-85">{line}</p>
                </div>
            )}
        </motion.div>
    );
}

function Workspace() {
    const reduceMotion = useReducedMotion();
    return (
        <section aria-labelledby="ws-heading" className="px-page bg-field-sage py-[clamp(1rem,2.2vw,2rem)]">
            <div className="grid grid-cols-2 gap-1.5 [grid-auto-rows:28vw] md:grid-cols-12 md:gap-2 md:[grid-auto-rows:104px]">
                {/* Heading tile, 6×2 */}
                <Tile tone="bg-olive text-olive-ink" className="col-span-2 row-span-2 p-6 md:col-span-6">
                    <h2 id="ws-heading" className="max-w-[12ch] text-[clamp(2rem,3.4vw,3.125rem)] leading-[1.02] font-bold tracking-[-0.03em]">
                        Inside the workspace
                    </h2>
                </Tile>

                {/* Task board column, 6×4 */}
                <Tile tone="bg-white text-ink" className="col-span-2 row-span-3 md:col-span-6 md:row-span-4" caption="Task board" line="To do, in progress, done. Drag a task across or move it from its menu." delay={0.06}>
                    <div data-ui className="absolute top-[-8%] left-[38%] w-[520px] text-[19px] text-[#0a0a0a]">
                        <div className="rounded-[10px] bg-[#eef1ee] p-3">
                            <p className="flex justify-between px-2 pb-2 text-[18px] font-medium">In progress <span className="num font-normal text-[#5e625e]">3</span></p>
                            {['Pilot filter at Kallur school', 'Measure flow rate per hour', 'Survey parents on illness days'].map((t, i) => (
                                <div key={t} className="mb-2 rounded-lg border border-[#e1e6e1] bg-white p-4">
                                    <p className="font-medium">{t}</p>
                                    <p className="mt-2 flex items-center gap-2 text-[15px] text-[#5e625e]">
                                        <Disc name={PROJECT.people[i]} /> {PROJECT.people[i]}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Tile>

                {/* Confidence figure, 3×2 */}
                <Tile tone="bg-field-blush text-ink" className="row-span-2 md:col-span-3" caption="Confidence" line="Every goal carries its score." delay={0.1}>
                    <div data-ui className="absolute -top-3 -right-4 flex items-start gap-2">
                        <span className="num flex size-16 items-start p-1.5 text-[24px] leading-none font-bold" style={{ background: GOALS[5].colour, color: tileInk(GOALS[5]) }}>6</span>
                        <span className="num text-[64px] leading-none font-medium tracking-[-0.03em]">91.2%</span>
                    </div>
                </Tile>

                {/* Team discs over a classroom, 3×2 */}
                <Tile tone="bg-field-slate text-white" className="row-span-2 md:col-span-3" caption="Teams" line="A leader and members." delay={0.14}>
                    <img
                        src="/images/classroom-ghana.jpg"
                        width={1200}
                        height={801}
                        alt="Pupils in blue uniforms at their desks in a classroom"
                        loading="lazy"
                        className="absolute inset-0 size-full object-cover object-[50%_30%] grayscale"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-3/5 bg-black/50" aria-hidden="true" />
                    <div data-ui className="absolute -top-5 -right-6 flex text-[46px]">
                        {PROJECT.people.map((p, i) => <Disc key={p} name={p} className={cn('ring-4 ring-white', i > 0 && '-ml-4')} />)}
                    </div>
                </Tile>

                {/* Chat, 3×4 */}
                <Tile tone="bg-ink text-white" className="col-span-2 row-span-3 md:col-span-3 md:row-span-4" caption="Project chat" line="Faculty and team in one thread." delay={0.06}>
                    <ol data-ui className="absolute top-6 -right-10 left-6 flex flex-col gap-3 text-[18px] leading-[1.35]">
                        <li className="max-w-[85%] self-start rounded-xl bg-[#2a2a2a] px-4 py-3">Flow test at Kallur came in at 38 litres an hour.</li>
                        <li className="max-w-[85%] self-end rounded-xl bg-white px-4 py-3 text-ink">Enough for 120 pupils. Log it on the board.</li>
                    </ol>
                </Tile>

                {/* Fieldwork photograph, 3×4 */}
                <Tile tone="bg-field-slate text-white" className="row-span-3 md:col-span-3 md:row-span-4" caption="Attachments" line="Photos, data and drafts on any task." delay={0.1}>
                    <video
                        src="/images/tube-well.webm"
                        poster="/images/village-well.jpg"
                        autoPlay={!reduceMotion}
                        muted
                        loop
                        playsInline
                        aria-label="A tube-well pumping water in a village in Punjab"
                        className="absolute inset-0 size-full object-cover grayscale"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-black/45" aria-hidden="true" />
                </Tile>

                {/* Literature chips, 6×2 */}
                <Tile tone="bg-field-blush text-ink" className="row-span-2 md:col-span-6" caption="Literature assistant" line="Answers drawn from your own papers." delay={0.14}>
                    <ul data-ui className="absolute -top-2 left-[42%] flex flex-col gap-2 text-[20px] text-[#0a0a0a]">
                        {[['solar-disinfection-review.pdf', '2.4 MB'], ['rural-school-wash-survey.pdf', '860 KB']].map(([f, s]) => (
                            <li key={f} className="flex items-center gap-4 rounded-md bg-white px-4 py-3 whitespace-nowrap">
                                {f} <span className="num text-[#5e625e]">{s}</span>
                            </li>
                        ))}
                    </ul>
                </Tile>

                {/* Progress, 6×2 */}
                <Tile tone="bg-white text-ink" className="col-span-2 row-span-2 md:col-span-6" caption="Progress" line="Done and in progress, at their true share." delay={0.18}>
                    <div data-ui className="absolute top-6 left-[38%] -right-12">
                        <p className="num text-[44px] leading-none font-medium tracking-[-0.02em]">7 <span className="text-[24px] text-[#5e625e]">of 12 done</span></p>
                        <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-[#eef1ee]">
                            <span className="h-full bg-[#1d5fbf]" style={{ width: `${(7 / 12) * 100}%` }} />
                            <span className="h-full bg-[#1d5fbf]/35" style={{ width: `${(3 / 12) * 100}%` }} />
                        </div>
                    </div>
                </Tile>
            </div>
        </section>
    );
}

/* ───────────────────────── Footer: the mark built large ───────────────────────── */

function Footer() {
    const min = Math.min(...GOALS.map((g) => g.targets));
    const max = Math.max(...GOALS.map((g) => g.targets));

    return (
        <footer className="px-page bg-olive pt-20 pb-8 text-olive-ink md:pt-28">
            <figure>
                <div className="flex h-[22svh] items-end gap-1 md:h-[34svh]" aria-hidden="true">
                    {GOALS.map((g, i) => (
                        <motion.span
                            key={g.n}
                            initial={{ scaleY: 0 }}
                            whileInView={{ scaleY: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, ease: EASE_EXPO, delay: i * 0.035 }}
                            className="num flex flex-1 origin-bottom items-start p-[0.4vw] text-[clamp(10px,1.2vw,20px)] leading-none font-bold"
                            style={{
                                height: `${60 + (40 * (g.targets - min)) / (max - min)}%`,
                                background: g.colour,
                                color: tileInk(g),
                            }}
                        >
                            {g.n}
                        </motion.span>
                    ))}
                </div>
                <figcaption className="mt-4 text-[15px]">
                    The 17 goals, each block as tall as its count of UN targets: {min} to {max}, {TOTAL_TARGETS} in all.
                </figcaption>
            </figure>

            <div className="mt-14 grid gap-10 text-[15px] md:grid-cols-12">
                <nav aria-label="Footer" className="grid grid-cols-2 gap-8 md:col-span-5">
                    <div className="flex flex-col gap-2">
                        <p className="font-medium">Product</p>
                        <a href="#how" className="hover:underline hover:underline-offset-4">How it works</a>
                        <a href="#goals" className="hover:underline hover:underline-offset-4">The 17 goals</a>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="font-medium">Account</p>
                        <Link to="/login" className="hover:underline hover:underline-offset-4">Sign in</Link>
                        <Link to="/register" className="hover:underline hover:underline-offset-4">Create account</Link>
                    </div>
                </nav>
                <div className="md:col-span-7">
                    <p className="font-medium">Photographs and footage</p>
                    <ul className="mt-2 flex flex-col gap-1.5">
                        {CREDITS.map((c) => (
                            <li key={c.href}>
                                <a href={c.href} target="_blank" rel="noreferrer" className="hover:underline hover:underline-offset-4">“{c.what}”</a>{' '}
                                by {c.who}, {c.licence}, via Wikimedia Commons
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mt-14 flex flex-wrap items-center justify-between gap-4 text-[15px]">
                <p>SDG Project Manager, built for the SDG Hackathon.</p>
                <SquareButton to="/register" tone="ink" className="h-11 px-5 text-[15px]">Create account</SquareButton>
            </div>
        </footer>
    );
}
