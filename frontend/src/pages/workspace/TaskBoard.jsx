import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Loader2, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PersonDisc } from '@/components/marks';

export const BOARD_COLUMNS = [
    { key: 'TODO', label: 'To do', empty: 'Nothing to do yet.' },
    { key: 'IN_PROGRESS', label: 'In progress', empty: 'Nothing in progress.' },
    { key: 'DONE', label: 'Done', empty: 'Nothing done yet.' },
];

export const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function TaskBoard({ groupedTasks, onMove, onUpload, onDeleteAttachment, onDownloadAttachment, attachState }) {
    const [dragOverCol, setDragOverCol] = useState(null);

    const handleDrop = (e, colKey) => {
        e.preventDefault();
        setDragOverCol(null);
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) onMove(taskId, colKey);
    };

    return (
        <div className="grid items-start gap-3 md:grid-cols-3">
            {BOARD_COLUMNS.map((column) => {
                const tasks = groupedTasks[column.key];
                return (
                    <section
                        key={column.key}
                        aria-label={column.label}
                        onDragOver={(e) => { e.preventDefault(); setDragOverCol(column.key); }}
                        onDragLeave={() => setDragOverCol(null)}
                        onDrop={(e) => handleDrop(e, column.key)}
                        className={cn(
                            'flex min-h-40 flex-col gap-2 rounded-[var(--radius-card)] bg-muted/70 p-2 transition-colors',
                            dragOverCol === column.key && 'bg-secondary outline-2 outline-dashed outline-input -outline-offset-2'
                        )}
                    >
                        <h3 className="flex items-baseline justify-between px-2 pt-1.5 pb-1 text-sm font-medium">
                            {column.label}
                            <span className="num text-xs font-normal text-muted-foreground">{tasks.length}</span>
                        </h3>
                        {tasks.length === 0 ? (
                            <p className="rounded-md border border-dashed border-input px-3 py-2.5 text-[13px] text-muted-foreground">{column.empty}</p>
                        ) : (
                            <AnimatePresence initial={false}>
                                {tasks.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onMove={onMove}
                                        onUpload={onUpload}
                                        onDeleteAttachment={onDeleteAttachment}
                                        onDownloadAttachment={onDownloadAttachment}
                                        attach={attachState[task.id]}
                                    />
                                ))}
                            </AnimatePresence>
                        )}
                    </section>
                );
            })}
        </div>
    );
}

function TaskCard({ task, onMove, onUpload, onDeleteAttachment, onDownloadAttachment, attach }) {
    const fileRef = useRef(null);
    const attachments = task.attachments || [];

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            draggable="true"
            onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
            className="cursor-grab rounded-md border bg-card p-3 transition-colors hover:border-input active:cursor-grabbing"
        >
            <h4 className="text-sm font-medium leading-5">{task.title}</h4>
            {task.description && <p className="mt-1 line-clamp-3 text-[13px] leading-5 text-muted-foreground">{task.description}</p>}

            {attachments.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1">
                    {attachments.map((att) => (
                        <li key={att.id} className="group/att flex items-center gap-2 rounded-sm bg-muted/70 py-1 pr-1 pl-2 text-xs">
                            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.6} />
                            <span className="min-w-0 flex-1 truncate" title={att.original_name}>{att.original_name}</span>
                            <span className="num shrink-0 text-muted-foreground">{formatBytes(att.size_bytes)}</span>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon-xs" aria-label={`Download ${att.original_name}`} onClick={() => onDownloadAttachment(task.id, att)}>
                                        <Download />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon-xs" aria-label={`Remove ${att.original_name}`} onClick={() => onDeleteAttachment(task.id, att.id)}>
                                        <X />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remove</TooltipContent>
                            </Tooltip>
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-3 flex items-center gap-2">
                {task.created_by && <PersonDisc name={task.created_by} className="size-6 text-[10px]" />}
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{task.created_by || 'Unknown'}</span>
                <input
                    type="file"
                    ref={fileRef}
                    className="hidden"
                    onChange={(e) => {
                        onUpload(task.id, e.target.files[0]);
                        e.target.value = '';
                    }}
                />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Attach a file"
                            disabled={attach?.uploading}
                            onClick={() => fileRef.current?.click()}
                        >
                            {attach?.uploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach a file</TooltipContent>
                </Tooltip>
                <Select value={task.status} onValueChange={(v) => onMove(task.id, v)}>
                    <SelectTrigger size="sm" className="h-7 text-xs" aria-label="Move task">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                        {BOARD_COLUMNS.map((col) => (
                            <SelectItem key={col.key} value={col.key}>{col.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {attach?.error && <p className="mt-2 text-xs text-destructive" role="alert">{attach.error}</p>}
        </motion.article>
    );
}
