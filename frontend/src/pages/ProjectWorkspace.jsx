import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    createProjectTask,
    getProjectWorkspace,
    updateProjectTask,
    getProjectChat,
    postProjectChat,
    queryRagAnswer,
    listLiteratureDocuments,
    uploadLiteratureDocument,
    deleteLiteratureDocument,
    downloadLiteratureDocument,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
} from '../api/projects';
import { useAuth } from '../context/AuthContext';
import { goalsOfProject } from '@/lib/sdg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GoalTile, PersonDisc, StatusPill } from '@/components/marks';
import TaskBoard, { BOARD_COLUMNS } from './workspace/TaskBoard';
import LiteraturePanel from './workspace/LiteraturePanel';
import TeamChat from './workspace/TeamChat';
import { DeleteProjectDialog } from './FacultyDashboard';

const EMPTY_TASK = { title: '', description: '', status: 'TODO', assignee_id: '', due_date: '' };
const UNASSIGNED = 'none'; // Radix Select items cannot use an empty value

export default function ProjectWorkspace() {
    const { projectId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isFaculty = user?.role === 'FACULTY';
    const [workspace, setWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [saving, setSaving] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatText, setChatText] = useState('');
    const [chatSending, setChatSending] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [ragQuery, setRagQuery] = useState('');
    const [ragAnswer, setRagAnswer] = useState('');
    const [ragLoading, setRagLoading] = useState(false);
    const [ragDocs, setRagDocs] = useState([]);
    const [ragUploadLoading, setRagUploadLoading] = useState(false);
    const [newTask, setNewTask] = useState(EMPTY_TASK);
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [deletingProject, setDeletingProject] = useState(null);
    // attachment upload state: { [taskId]: { uploading: bool, error: string } }
    const [attachState, setAttachState] = useState({});

    const loadWorkspace = async () => {
        setLoadError('');
        try {
            setWorkspace(await getProjectWorkspace(projectId));
        } catch (err) {
            setLoadError(err.message || 'Failed to load project workspace');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        loadWorkspace();
    }, [projectId]);

    useEffect(() => {
        const loadChat = async () => {
            try {
                setChatMessages(await getProjectChat(projectId));
            } catch {
                // Keep workspace usable even if chat polling fails transiently.
            }
        };
        loadChat();
        const intervalId = setInterval(loadChat, 5000);
        return () => clearInterval(intervalId);
    }, [projectId]);

    useEffect(() => {
        listLiteratureDocuments(projectId).then(setRagDocs).catch(() => setRagDocs([]));
    }, [projectId]);

    const groupedTasks = useMemo(() => {
        const groups = { TODO: [], IN_PROGRESS: [], DONE: [] };
        (workspace?.tasks || []).forEach((task) => {
            if (groups[task.status]) groups[task.status].push(task);
        });
        return groups;
    }, [workspace]);

    const openTaskDialog = (task = null) => {
        setEditingTask(task);
        setNewTask(task ? {
            title: task.title,
            description: task.description || '',
            status: task.status,
            assignee_id: task.assignee_id || '',
            due_date: task.due_date || '',
        } : EMPTY_TASK);
        setTaskDialogOpen(true);
    };

    const handleSaveTask = async (e) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;
        setSaving(true);
        const payload = {
            title: newTask.title.trim(),
            description: newTask.description.trim(),
            status: newTask.status,
            // Only faculty may assign; the backend rejects these fields from students.
            ...(isFaculty && { assignee_id: newTask.assignee_id || null, due_date: newTask.due_date || null }),
        };
        try {
            if (editingTask) {
                const updatedTask = await updateProjectTask(projectId, editingTask.id, payload);
                setWorkspace((prev) => ({
                    ...prev,
                    tasks: prev.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
                }));
            } else {
                await createProjectTask(projectId, payload);
                await loadWorkspace();
            }
            setNewTask(EMPTY_TASK);
            setTaskDialogOpen(false);
        } catch (err) {
            toast.error(err.message || 'Failed to save task');
        } finally {
            setSaving(false);
        }
    };

    const handleMoveTask = async (taskId, status) => {
        try {
            const updatedTask = await updateProjectTask(projectId, taskId, { status });
            setWorkspace((prev) => ({
                ...prev,
                tasks: prev.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
            }));
        } catch (err) {
            toast.error(err.message || 'Failed to update task');
        }
    };

    const handleUpload = async (taskId, file) => {
        if (!file) return;
        setAttachState((prev) => ({ ...prev, [taskId]: { uploading: true, error: '' } }));
        try {
            const newAtt = await uploadAttachment(projectId, taskId, file);
            setWorkspace((prev) => ({
                ...prev,
                tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, attachments: [...(t.attachments || []), newAtt] } : t)),
            }));
            setAttachState((prev) => ({ ...prev, [taskId]: { uploading: false, error: '' } }));
        } catch (err) {
            setAttachState((prev) => ({ ...prev, [taskId]: { uploading: false, error: err.message } }));
        }
    };

    const handleDeleteAttachment = async (taskId, attachmentId) => {
        try {
            await deleteAttachment(projectId, taskId, attachmentId);
            setWorkspace((prev) => ({
                ...prev,
                tasks: prev.tasks.map((t) =>
                    t.id === taskId ? { ...t, attachments: (t.attachments || []).filter((a) => a.id !== attachmentId) } : t
                ),
            }));
        } catch (err) {
            toast.error(err.message || 'Failed to delete attachment');
        }
    };

    const handleDownloadAttachment = (taskId, att) =>
        downloadAttachment(projectId, taskId, att.id, att.original_name).catch((err) => toast.error(err.message));

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const message = chatText.trim();
        if (!message) return;
        setChatSending(true);
        try {
            const saved = await postProjectChat(projectId, { message });
            setChatMessages((prev) => [...prev, saved]);
            setChatText('');
        } catch (err) {
            toast.error(err.message || 'Failed to send message');
        } finally {
            setChatSending(false);
        }
    };

    const handleAskRag = async (e) => {
        e.preventDefault();
        const question = ragQuery.trim();
        if (!question) return;
        setRagLoading(true);
        setRagAnswer('');
        try {
            setRagAnswer(await queryRagAnswer(projectId, question, 4));
        } catch (err) {
            toast.error(err.message || 'Failed to get AI answer');
        } finally {
            setRagLoading(false);
        }
    };

    const handleLiteratureUpload = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setRagUploadLoading(true);
        try {
            await uploadLiteratureDocument(projectId, file);
            setRagDocs(await listLiteratureDocuments(projectId));
        } catch (err) {
            toast.error(err.message || 'Failed to upload literature document');
        } finally {
            setRagUploadLoading(false);
        }
    };

    const handleDeleteLiteratureDoc = async (documentId) => {
        try {
            await deleteLiteratureDocument(projectId, documentId);
            setRagDocs((prev) => prev.filter((d) => d.id !== documentId));
        } catch (err) {
            toast.error(err.message || 'Failed to delete literature document');
        }
    };

    if (loading) return <WorkspaceSkeleton />;
    if (!workspace) {
        return (
            <div className="flex flex-col gap-4">
                <Breadcrumb title="Workspace" />
                <div className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] border bg-card px-5 py-4 text-sm">
                    <span>Couldn’t open this workspace. {loadError}.</span>
                    <Button variant="ghost" size="sm" onClick={() => { setLoading(true); loadWorkspace(); }}>Retry</Button>
                </div>
            </div>
        );
    }

    const goals = goalsOfProject(workspace);
    const tasks = workspace.tasks || [];
    const people = [workspace.leader_name, ...(workspace.member_names || [])].filter(Boolean);

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-4">
                <Breadcrumb title={workspace.title} />
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-semibold tracking-[-0.01em]">{workspace.title}</h1>
                            <StatusPill status={workspace.status} />
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground" title={workspace.problem_statement}>
                            {workspace.problem_statement}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsChatOpen(true)}>
                            <MessageSquare /> Team chat
                            {chatMessages.length > 0 && <span className="num text-muted-foreground">{chatMessages.length}</span>}
                        </Button>
                        <Button onClick={() => openTaskDialog()}>
                            <Plus /> Add task
                        </Button>
                        {isFaculty && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" aria-label="Delete project" onClick={() => setDeletingProject(workspace)}>
                                        <Trash2 />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete project</TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </div>
            </header>

            {/* Progress against the plan, then who is on the project, in one divided card */}
            <section aria-label="Project summary" className="grid rounded-[var(--radius-card)] border bg-card lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1.3fr)]">
                <Progress tasks={tasks} groupedTasks={groupedTasks} />
                <div className="flex flex-col gap-3 border-t p-5 lg:border-t-0 lg:border-l">
                    <h2 className="text-sm text-muted-foreground">Goals</h2>
                    {goals.length ? (
                        <ul className="flex flex-col gap-2">
                            {goals.map((g) => (
                                <li key={g.n} className="flex items-center gap-2.5 text-sm">
                                    <GoalTile goal={g} size="sm" /> {g.name}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                    )}
                </div>
                <div className="flex flex-col gap-3 border-t p-5 lg:border-t-0 lg:border-l">
                    <h2 className="flex items-baseline justify-between text-sm text-muted-foreground">
                        Team
                        <span className="text-foreground">{workspace.team_name || 'Not assigned'}</span>
                    </h2>
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                        <li className="flex min-w-0 items-center gap-2.5">
                            <PersonDisc name={workspace.faculty_name || '?'} />
                            <span className="min-w-0">
                                <span className="block truncate">{workspace.faculty_name || '—'}</span>
                                <span className="block text-xs text-muted-foreground">Faculty</span>
                            </span>
                        </li>
                        {people.map((name, i) => (
                            <li key={`${name}-${i}`} className="flex min-w-0 items-center gap-2.5">
                                <PersonDisc name={name} />
                                <span className="min-w-0">
                                    <span className="block truncate">{name}</span>
                                    <span className="block text-xs text-muted-foreground">{i === 0 && workspace.leader_name ? 'Leader' : 'Member'}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <Tabs defaultValue="board" className="gap-4">
                <TabsList variant="line" className="h-9 w-full justify-start border-b">
                    <TabsTrigger value="board" className="flex-none px-2">
                        {user?.role === 'FACULTY' ? 'Task board' : 'Team board'}
                        <span className="num font-normal text-muted-foreground">{tasks.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="literature" className="flex-none px-2">
                        Literature assistant
                        <span className="num font-normal text-muted-foreground">{ragDocs.length}</span>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="board">
                    <TaskBoard
                        groupedTasks={groupedTasks}
                        userId={user?.id}
                        onMove={handleMoveTask}
                        onEdit={openTaskDialog}
                        onUpload={handleUpload}
                        onDeleteAttachment={handleDeleteAttachment}
                        onDownloadAttachment={handleDownloadAttachment}
                        attachState={attachState}
                    />
                </TabsContent>
                <TabsContent value="literature">
                    <LiteraturePanel
                        docs={ragDocs}
                        uploading={ragUploadLoading}
                        onUpload={handleLiteratureUpload}
                        onDelete={handleDeleteLiteratureDoc}
                        onDownload={(d) => downloadLiteratureDocument(projectId, d.id, d.filename).catch((err) => toast.error(err.message))}
                        query={ragQuery}
                        setQuery={setRagQuery}
                        answer={ragAnswer}
                        asking={ragLoading}
                        onAsk={handleAskRag}
                    />
                </TabsContent>
            </Tabs>

            <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleSaveTask} className="grid gap-5">
                        <DialogHeader>
                            <DialogTitle>{editingTask ? 'Edit task' : 'Add a task'}</DialogTitle>
                            <DialogDescription className="truncate">
                                {editingTask?.created_by ? `Added by ${editingTask.created_by}` : workspace.title}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-2">
                            <Label htmlFor="task-title">Title</Label>
                            <Input
                                id="task-title"
                                value={newTask.title}
                                onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                                placeholder="Test filter flow rate at the pilot school"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="task-description">Notes</Label>
                            <Textarea
                                id="task-description"
                                rows={3}
                                value={newTask.description}
                                onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="What counts as done"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label id="task-status-label">Column</Label>
                            <ToggleGroup
                                type="single"
                                variant="outline"
                                value={newTask.status}
                                onValueChange={(v) => v && setNewTask((prev) => ({ ...prev, status: v }))}
                                aria-labelledby="task-status-label"
                                className="justify-start"
                            >
                                {BOARD_COLUMNS.map((col) => (
                                    <ToggleGroupItem key={col.key} value={col.key} className="px-3">{col.label}</ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </div>
                        {isFaculty ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="task-assignee">Assignee</Label>
                                    <Select
                                        value={newTask.assignee_id || UNASSIGNED}
                                        onValueChange={(v) => setNewTask((prev) => ({ ...prev, assignee_id: v === UNASSIGNED ? '' : v }))}
                                        disabled={!workspace.team_members?.length}
                                    >
                                        <SelectTrigger id="task-assignee" className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                                            {(workspace.team_members || []).map((m) => (
                                                <SelectItem key={m.id} value={m.id}>{m.name}{m.role === 'Leader' ? ' (leader)' : ''}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {!workspace.team_members?.length && (
                                        <p className="text-xs text-muted-foreground">Assign a team to this project first.</p>
                                    )}
                                </div>
                                <div className="grid content-start gap-2">
                                    <Label htmlFor="task-due">Due date</Label>
                                    <Input
                                        id="task-due"
                                        type="date"
                                        value={newTask.due_date}
                                        onChange={(e) => setNewTask((prev) => ({ ...prev, due_date: e.target.value }))}
                                    />
                                </div>
                            </div>
                        ) : editingTask?.assignee_name || editingTask?.due_date ? (
                            <p className="text-sm text-muted-foreground">
                                {[editingTask.assignee_name && `Assigned to ${editingTask.assignee_name}`, editingTask.due_date && `due ${editingTask.due_date}`].filter(Boolean).join(', ')}.
                                {' '}Only faculty can change the assignment.
                            </p>
                        ) : null}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={saving || !newTask.title.trim()}>
                                {saving ? 'Saving…' : editingTask ? 'Save task' : 'Add task'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteProjectDialog
                project={deletingProject}
                onClose={() => setDeletingProject(null)}
                onDeleted={() => navigate('/dashboard', { replace: true })}
            />

            <TeamChat
                open={isChatOpen}
                onOpenChange={setIsChatOpen}
                teamName={workspace.team_name}
                people={people}
                messages={chatMessages}
                userId={user?.id}
                text={chatText}
                setText={setChatText}
                sending={chatSending}
                onSend={handleSendMessage}
            />
        </div>
    );
}

function Breadcrumb({ title }) {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-foreground">Projects</Link>
            <ChevronRight className="size-3.5" />
            <span className="truncate text-foreground">{title}</span>
        </nav>
    );
}

// The plan bar: done in the data hue, in progress as a lighter step, to do as the track.
function Progress({ tasks, groupedTasks }) {
    const total = tasks.length;
    const done = groupedTasks.DONE.length;
    const doing = groupedTasks.IN_PROGRESS.length;
    const todo = groupedTasks.TODO.length;
    const pct = (n) => (total ? (n / total) * 100 : 0);

    return (
        <div className="flex flex-col gap-3 p-5">
            <h2 className="text-sm text-muted-foreground">Progress</h2>
            <p className="num text-[30px] leading-[30px]">
                {done}<span className="text-base text-muted-foreground"> of {total} tasks done</span>
            </p>
            <div
                className="flex h-2 overflow-hidden rounded-full bg-muted"
                role="meter"
                aria-label="Tasks done"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={done}
            >
                <div className="h-full bg-data transition-[width] duration-500" style={{ width: `${pct(done)}%` }} />
                <div className="h-full bg-data/35 transition-[width] duration-500" style={{ width: `${pct(doing)}%` }} />
            </div>
            <dl className="num flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-data" /><dt>Done</dt><dd className="text-foreground">{done}</dd></div>
                <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-data/35" /><dt>In progress</dt><dd className="text-foreground">{doing}</dd></div>
                <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-muted ring-1 ring-input" /><dt>To do</dt><dd className="text-foreground">{todo}</dd></div>
            </dl>
        </div>
    );
}

function WorkspaceSkeleton() {
    return (
        <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading workspace">
            <Skeleton className="h-4 w-48" />
            <div className="space-y-2">
                <Skeleton className="h-7 w-80" />
                <Skeleton className="h-4 w-full max-w-2xl" />
            </div>
            <Skeleton className="h-40 w-full rounded-[var(--radius-card)]" />
            <div className="grid gap-3 md:grid-cols-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-[var(--radius-card)]" />)}
            </div>
        </div>
    );
}
