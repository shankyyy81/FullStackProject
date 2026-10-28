import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getMyProjectsView, getProjectWorkspace } from '../api/projects';
import { goalsOfProject } from '@/lib/sdg';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GoalTile, PersonDisc, StatusPill } from '@/components/marks';

export default function StudentDashboard() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [tasksById, setTasksById] = useState({});

    const loadProjects = async () => {
        setLoadError('');
        try {
            const list = await getMyProjectsView();
            setProjects(list);
            // Progress per project comes from its workspace; a failed one just shows no bar.
            const entries = await Promise.all(
                list.map((p) => getProjectWorkspace(p.id).then((w) => [p.id, w.tasks || []]).catch(() => [p.id, null]))
            );
            setTasksById(Object.fromEntries(entries));
        } catch (error) {
            setLoadError(error.message || 'Could not load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const subline = loading
        ? 'Loading your projects…'
        : projects.length === 0
            ? 'You are not on a project team yet.'
            : `You are on ${projects.length} project ${projects.length === 1 ? 'team' : 'teams'}.`;

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1 className="text-2xl font-semibold tracking-[-0.01em]">My projects</h1>
                <p className="mt-1 text-sm text-muted-foreground">{subline}</p>
            </header>

            {loading ? (
                <div className="rounded-[var(--radius-card)] border bg-card p-6" aria-hidden="true">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="mt-3 h-4 w-2/3" />
                    <Skeleton className="mt-6 h-10 w-40" />
                </div>
            ) : loadError ? (
                <div className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border bg-card px-5 py-4 text-sm">
                    <span>Couldn’t load your projects. {loadError}.</span>
                    <Button variant="ghost" size="sm" onClick={() => { setLoading(true); loadProjects(); }}>Retry</Button>
                </div>
            ) : projects.length === 0 ? (
                <div className="rounded-[var(--radius-card)] border border-dashed bg-card px-5 py-4 text-sm text-muted-foreground">
                    Your faculty adds you when they assign a team. The project then appears here with its board and chat.
                </div>
            ) : (
                projects.map((project) => <ProjectCard key={project.id} project={project} tasks={tasksById[project.id]} />)
            )}
        </div>
    );
}

function ProjectCard({ project, tasks }) {
    const goals = goalsOfProject(project);
    const members = project.member_names || [];

    return (
        <article className="grid rounded-[var(--radius-card)] border bg-card lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex flex-col gap-4 p-6">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-medium">{project.title}</h2>
                    <StatusPill status={project.status} />
                </div>
                <p className="max-w-[68ch] text-sm leading-6 text-muted-foreground">{project.problem_statement}</p>
                <ul className="flex flex-col gap-2">
                    {goals.map((g) => (
                        <li key={g.n} className="flex items-center gap-2.5 text-sm">
                            <GoalTile goal={g} size="sm" />
                            SDG {g.n}: {g.name}
                        </li>
                    ))}
                </ul>
                {tasks && <TaskProgress tasks={tasks} />}
                <Button asChild className="mt-2 self-start">
                    <Link to={`/project/${project.id}/workspace`}>Open workspace <ArrowRight /></Link>
                </Button>
            </div>

            <dl className="grid content-start gap-4 border-t p-6 text-sm lg:border-t-0 lg:border-l">
                <div>
                    <dt className="text-muted-foreground">Faculty</dt>
                    <dd className="mt-1">{project.faculty_name || '—'}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Team</dt>
                    <dd className="mt-1">{project.team_name || '—'}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">People</dt>
                    <dd className="mt-2 flex flex-col gap-2">
                        {project.leader_name && (
                            <span className="flex items-center gap-2.5">
                                <PersonDisc name={project.leader_name} />
                                {project.leader_name}
                                <span className="text-muted-foreground">leader</span>
                            </span>
                        )}
                        {members.map((m) => (
                            <span key={m} className="flex items-center gap-2.5">
                                <PersonDisc name={m} /> {m}
                            </span>
                        ))}
                        {!project.leader_name && members.length === 0 && <span className="text-muted-foreground">—</span>}
                    </dd>
                </div>
            </dl>
        </article>
    );
}

function TaskProgress({ tasks }) {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const doing = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const pct = (n) => (total ? (n / total) * 100 : 0);

    return (
        <div className="max-w-md">
            <p className="num text-sm">
                {done}<span className="text-muted-foreground"> of {total} tasks done · {doing} in progress</span>
            </p>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted" role="meter" aria-label="Tasks done" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
                <div className="h-full bg-data" style={{ width: `${pct(done)}%` }} />
                <div className="h-full bg-data/35" style={{ width: `${pct(doing)}%` }} />
            </div>
        </div>
    );
}
