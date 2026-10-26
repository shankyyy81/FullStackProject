import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MoreHorizontal, Plus, Trash2, Users, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { getMyProjectsView, assignStudents, deleteProject } from '../api/projects';
import { getStudents } from '../api/users';
import { GOALS, goalsOfProject } from '@/lib/sdg';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GoalTile, PersonDisc, StatusPill } from '@/components/marks';

const MAX_ACTIVE = 5;
const EMPTY_ASSIGNMENT = { team_name: '', leader_id: '', member_ids: [] };

export default function FacultyDashboard() {
    const [projects, setProjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [assigningProject, setAssigningProject] = useState(null);
    const [deletingProject, setDeletingProject] = useState(null);
    const navigate = useNavigate();

    const loadData = async () => {
        setLoadError('');
        try {
            const [projectsData, studentsData] = await Promise.all([getMyProjectsView(), getStudents()]);
            setProjects(projectsData);
            setStudents(studentsData);
        } catch (error) {
            setLoadError(error.message || 'Could not load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const activeCount = projects.filter((p) => p.status !== 'Completed').length;
    const withoutTeam = projects.filter((p) => !p.team_name).length;
    const studentsOnTeams = useMemo(() => {
        const names = new Set();
        projects.forEach((p) => [p.leader_name, ...(p.member_names || [])].forEach((n) => n && names.add(n)));
        return names.size;
    }, [projects]);
    const covered = useMemo(() => new Set(projects.flatMap((p) => goalsOfProject(p).map((g) => g.n))), [projects]);
    const atLimit = activeCount >= MAX_ACTIVE;

    const finding = projects.length === 0
        ? 'No projects yet. Write a problem statement and the model maps it to the goals.'
        : withoutTeam > 0
            ? `${withoutTeam} ${withoutTeam === 1 ? 'project is' : 'projects are'} waiting for a student team.`
            : 'Every project has a team.';

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-[-0.01em]">Projects</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{loading ? 'Loading your projects…' : finding}</p>
                </div>
                {atLimit ? (
                    <p className="max-w-xs text-right text-sm text-muted-foreground">
                        All {MAX_ACTIVE} active slots are in use. Complete or delete a project to start another.
                    </p>
                ) : (
                    <Button asChild>
                        <Link to="/project/new"><Plus /> New project</Link>
                    </Button>
                )}
            </header>

            {/* One divided strip: two counts, then the goal coverage the projects add up to */}
            <section aria-label="Summary" className="grid grid-cols-2 rounded-[var(--radius-card)] border bg-card lg:grid-cols-[1fr_1fr_2fr]">
                <Stat label="Active projects" loading={loading}>
                    {activeCount}<span className="text-base font-normal text-muted-foreground"> /{MAX_ACTIVE}</span>
                </Stat>
                <Stat label="Students on teams" loading={loading} className="border-l">
                    {studentsOnTeams}
                </Stat>
                <div className="col-span-2 flex flex-col gap-3 border-t p-5 lg:col-span-1 lg:border-t-0 lg:border-l">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm text-muted-foreground">Goals covered</span>
                        <span className="num text-sm">
                            {covered.size}<span className="text-muted-foreground"> of 17</span>
                        </span>
                    </div>
                    <div className="grid grid-cols-[repeat(17,minmax(0,1fr))] gap-1">
                        {GOALS.map((g) =>
                            covered.has(g.n) ? (
                                <GoalTile key={g.n} goal={g} size="xs" className="aspect-square size-auto w-full" />
                            ) : (
                                <span
                                    key={g.n}
                                    title={`SDG ${g.n}: ${g.name}, not covered yet`}
                                    className="num flex aspect-square w-full items-start bg-muted p-[0.3em] text-[11px] leading-none text-muted-foreground"
                                >
                                    {g.n}
                                </span>
                            )
                        )}
                    </div>
                </div>
            </section>

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <section aria-labelledby="all-projects" className="rounded-[var(--radius-card)] border bg-card">
                <div className="flex items-baseline justify-between px-5 pt-4 pb-3">
                    <h2 id="all-projects" className="text-base font-medium">All projects</h2>
                    {!loading && <span className="num text-sm text-muted-foreground">{projects.length} total</span>}
                </div>

                {loading ? (
                    <ProjectRowsSkeleton />
                ) : loadError ? (
                    <div className="flex items-center justify-between gap-4 border-t px-5 py-4 text-sm">
                        <span>Couldn’t load projects. {loadError}.</span>
                        <Button variant="ghost" size="sm" onClick={() => { setLoading(true); loadData(); }}>Retry</Button>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="mx-5 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed px-4 py-3 text-sm">
                        <span className="text-muted-foreground">Your first project starts from a problem statement.</span>
                        <Link to="/project/new" className="font-medium underline-offset-4 hover:underline">+ New project</Link>
                    </div>
                ) : (
                    <ul className="border-t">
                        {projects.map((project) => (
                            <ProjectRow
                                key={project.id}
                                project={project}
                                onOpen={() => navigate(`/project/${project.id}/workspace`)}
                                onAssign={() => setAssigningProject(project)}
                                onDelete={() => setDeletingProject(project)}
                            />
                        ))}
                    </ul>
                )}
            </section>

            <StudentsPanel students={students} loading={loading} />
            </div>

            <AssignTeamDialog
                project={assigningProject}
                students={students}
                onClose={() => setAssigningProject(null)}
                onSaved={loadData}
            />
            <DeleteProjectDialog
                project={deletingProject}
                onClose={() => setDeletingProject(null)}
                onDeleted={loadData}
            />
        </div>
    );
}

// Who can still be put on a team: the question the next assignment starts from.
function StudentsPanel({ students, loading }) {
    const sorted = [...students].sort((a, b) => Number(a.is_assigned) - Number(b.is_assigned) || a.full_name.localeCompare(b.full_name));
    const available = students.filter((s) => !s.is_assigned).length;
    const shown = sorted.slice(0, 8);

    return (
        <section aria-labelledby="students-heading" className="rounded-[var(--radius-card)] border bg-card">
            <div className="flex items-baseline justify-between px-5 pt-4 pb-3">
                <h2 id="students-heading" className="text-base font-medium">Students</h2>
                {!loading && <span className="num text-sm text-muted-foreground">{available} without a team</span>}
            </div>
            {loading ? (
                <div className="space-y-3 border-t px-5 py-4" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-3/4" />)}
                </div>
            ) : students.length === 0 ? (
                <p className="mx-5 mb-5 rounded-md border border-dashed px-3 py-2.5 text-[13px] text-muted-foreground">
                    No students have registered yet.
                </p>
            ) : (
                <ul className="border-t">
                    {shown.map((s) => (
                        <li key={s.id} className="flex items-center gap-3 border-b border-rule px-5 py-2.5 last:border-b-0">
                            <PersonDisc name={s.full_name} />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm">{s.full_name}</span>
                                <span className="block truncate text-[13px] text-muted-foreground">
                                    {[s.student_profile?.year && `${s.student_profile.year} year`, s.student_profile?.department].filter(Boolean).join(' · ') || s.email}
                                </span>
                            </span>
                            <span className={cn('inline-flex h-5 flex-none items-center rounded-full px-2 text-xs font-medium', s.is_assigned ? 'bg-pill-neutral text-pill-neutral-ink' : 'bg-pill-positive text-pill-positive-ink')}>
                                {s.is_assigned ? 'On a team' : 'Available'}
                            </span>
                        </li>
                    ))}
                    {students.length > shown.length && (
                        <li className="num px-5 py-2.5 text-xs text-muted-foreground">and {students.length - shown.length} more</li>
                    )}
                </ul>
            )}
        </section>
    );
}

function Stat({ label, loading, children, className }) {
    return (
        <div className={cn('flex flex-col gap-1.5 p-5', className)}>
            <span className="text-sm text-muted-foreground">{label}</span>
            {loading ? <Skeleton className="h-[30px] w-16" /> : <span className="num text-[30px] leading-[30px]">{children}</span>}
        </div>
    );
}

function ProjectRow({ project, onOpen, onAssign, onDelete }) {
    const goals = goalsOfProject(project);
    const team = [project.leader_name, ...(project.member_names || [])].filter(Boolean);

    return (
        <li className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 border-b border-rule px-5 py-3.5 transition-colors last:border-b-0 hover:bg-muted/50 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_84px_36px]">
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex shrink-0 gap-0.5">
                    {goals.length ? goals.map((g) => <GoalTile key={g.n} goal={g} size="md" />) : <span className="size-10 bg-muted" />}
                </span>
                <button type="button" onClick={onOpen} className="min-w-0 text-left outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring">
                    <span className="block truncate text-sm font-medium">{project.title}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">
                        {goals.length ? goals.map((g) => `SDG ${g.n}: ${g.name}`).join(' · ') : 'No goal mapped'}
                    </span>
                </button>
            </div>

            <div className="relative order-3 col-span-2 min-w-0 pl-[52px] md:order-none md:col-span-1 md:pl-0">
                {project.team_name ? (
                    <span className="flex min-w-0 items-center gap-2.5">
                        {team[0] && <PersonDisc name={team[0]} />}
                        <span className="min-w-0">
                            <span className="block truncate text-sm">{project.team_name}</span>
                            <span className="block truncate text-[13px] text-muted-foreground">
                                {team.length ? `${team[0]}${team.length > 1 ? ` + ${team.length - 1}` : ''}` : 'No members yet'}
                            </span>
                        </span>
                    </span>
                ) : (
                    <button type="button" onClick={onAssign} className="relative text-sm font-medium underline-offset-4 hover:underline">
                        Assign a team
                    </button>
                )}
            </div>

            <div className="relative hidden md:block">
                <StatusPill status={project.status} />
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative order-2 md:order-none" aria-label={`Actions for ${project.title}`}>
                        <MoreHorizontal />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={onOpen}><ArrowUpRight /> Open workspace</DropdownMenuItem>
                    <DropdownMenuItem onSelect={onAssign}><Users /> {project.team_name ? 'Change team' : 'Assign team'}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={onDelete}><Trash2 /> Delete project</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </li>
    );
}

function ProjectRowsSkeleton() {
    return (
        <ul className="border-t" aria-hidden="true">
            {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-center gap-6 border-b border-rule px-5 py-4 last:border-b-0">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-2/5" />
                        <Skeleton className="h-3 w-3/5" />
                    </div>
                    <Skeleton className="size-7" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                </li>
            ))}
        </ul>
    );
}

function AssignTeamDialog({ project, students, onClose, onSaved }) {
    const [form, setForm] = useState(EMPTY_ASSIGNMENT);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (project) {
            setForm({ ...EMPTY_ASSIGNMENT, team_name: project.team_name || '' });
            setError('');
        }
    }, [project]);

    const available = project
        ? students.filter((s) => !s.is_assigned || String(s.assigned_project_id) === String(project.id))
        : [];

    const toggleMember = (id, checked) =>
        setForm((f) => ({ ...f, member_ids: checked ? [...f.member_ids, id] : f.member_ids.filter((m) => m !== id) }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await assignStudents(project.id, {
                team_name: form.team_name || undefined,
                leader_id: form.leader_id || undefined,
                member_ids: form.member_ids || [],
            });
            toast.success(`Team saved for “${project.title}”`);
            onClose();
            await onSaved();
        } catch (err) {
            setError(err.message || 'Failed to assign students');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSave} className="grid gap-5">
                    <DialogHeader>
                        <DialogTitle>Assign a team</DialogTitle>
                        <DialogDescription className="truncate">{project?.title}</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Label htmlFor="team-name">Team name</Label>
                        <Input
                            id="team-name"
                            value={form.team_name}
                            onChange={(e) => setForm((f) => ({ ...f, team_name: e.target.value }))}
                            placeholder="Clearwater"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="team-leader">Team leader</Label>
                        <Select value={form.leader_id} onValueChange={(v) => setForm((f) => ({ ...f, leader_id: v, member_ids: f.member_ids.filter((m) => m !== v) }))}>
                            <SelectTrigger id="team-leader" className="w-full">
                                <SelectValue placeholder={available.length ? 'Choose a student' : 'No students available'} />
                            </SelectTrigger>
                            <SelectContent>
                                {available.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>{s.full_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <fieldset className="grid gap-2">
                        <legend className="mb-2 flex w-full items-baseline justify-between text-sm font-medium">
                            Members
                            <span className="num text-xs font-normal text-muted-foreground">{form.member_ids.length} selected</span>
                        </legend>
                        {available.length === 0 ? (
                            <p className="rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
                                Every student is already on a team.
                            </p>
                        ) : (
                            <ScrollArea className="max-h-56 rounded-md border">
                                <ul className="p-1">
                                    {available.filter((s) => String(s.id) !== form.leader_id).map((s) => (
                                        <li key={s.id}>
                                            <label className="flex cursor-pointer items-center gap-3 rounded-sm px-2.5 py-2 hover:bg-muted">
                                                <Checkbox
                                                    checked={form.member_ids.includes(String(s.id))}
                                                    onCheckedChange={(c) => toggleMember(String(s.id), c === true)}
                                                />
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm">{s.full_name}</span>
                                                    <span className="block truncate text-[13px] text-muted-foreground">{s.email}</span>
                                                </span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        )}
                    </fieldset>

                    {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={saving || !form.leader_id}>
                            {saving ? 'Saving…' : form.leader_id ? 'Save team' : 'Choose a leader first'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteProjectDialog({ project, onClose, onDeleted }) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (e) => {
        e.preventDefault();
        setDeleting(true);
        try {
            await deleteProject(project.id);
            toast.success(`Deleted “${project.title}”`);
            onClose();
            await onDeleted();
        } catch (err) {
            toast.error(err.message || 'Failed to delete project');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <AlertDialog open={!!project} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete “{project?.title}”?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Its task board, chat and attachments go with it. This cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Keep project</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
                        {deleting ? 'Deleting…' : 'Delete project'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
