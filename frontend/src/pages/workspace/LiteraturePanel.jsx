import { useRef } from 'react';
import { Download, FileText, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LiteraturePanel({
    docs, uploading, onUpload, onDelete, onDownload,
    query, setQuery, answer, asking, onAsk,
}) {
    const fileRef = useRef(null);
    const noDocs = docs.length === 0;

    return (
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-[var(--radius-card)] border bg-card p-5" aria-labelledby="ask-heading">
                <h3 id="ask-heading" className="text-base font-medium">Ask the literature</h3>
                <form onSubmit={onAsk} className="mt-4 flex flex-col gap-2">
                    <Label htmlFor="rag-query" className="sr-only">Question</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                            id="rag-query"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Which purification methods work without grid power?"
                            aria-describedby="rag-hint"
                        />
                        <Button type="submit" disabled={asking || !query.trim() || noDocs} className="shrink-0">
                            {asking ? <><Loader2 className="animate-spin" /> Reading…</> : 'Ask'}
                        </Button>
                    </div>
                    <p id="rag-hint" className="text-xs text-muted-foreground">
                        {noDocs ? 'Answers come from your indexed papers. Upload one to start.' : `Answers draw on the ${docs.length} indexed ${docs.length === 1 ? 'paper' : 'papers'}.`}
                    </p>
                </form>

                {asking ? (
                    <div className="mt-5 space-y-2" aria-live="polite">
                        <div className="h-3.5 w-11/12 rounded-sm bg-muted" />
                        <div className="h-3.5 w-4/5 rounded-sm bg-muted" />
                        <div className="h-3.5 w-3/5 rounded-sm bg-muted" />
                    </div>
                ) : answer ? (
                    <div className="mt-5 rounded-md bg-muted/70 p-4 text-sm leading-6 whitespace-pre-wrap" aria-live="polite">
                        {answer}
                    </div>
                ) : null}
            </section>

            <section className="rounded-[var(--radius-card)] border bg-card" aria-labelledby="docs-heading">
                <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
                    <h3 id="docs-heading" className="text-base font-medium">
                        Papers <span className="num font-normal text-muted-foreground">{docs.length}</span>
                    </h3>
                    <input type="file" accept=".pdf,.txt,.md" ref={fileRef} className="hidden" onChange={onUpload} />
                    <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                        {uploading ? <><Loader2 className="animate-spin" /> Indexing…</> : <><Upload /> Upload</>}
                    </Button>
                </div>
                {noDocs ? (
                    <p className="mx-5 mb-5 rounded-md border border-dashed px-3 py-2.5 text-[13px] text-muted-foreground">
                        No papers yet. PDF, TXT or Markdown.
                    </p>
                ) : (
                    <ul className="border-t">
                        {docs.map((d) => (
                            <li key={d.id} className="flex items-center gap-2.5 border-b border-rule py-2 pr-2 pl-5 text-sm last:border-b-0">
                                <FileText className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.6} />
                                <span className="min-w-0 flex-1 truncate" title={d.filename}>{d.filename}</span>
                                <Button variant="ghost" size="icon-sm" aria-label={`Download ${d.filename}`} onClick={() => onDownload(d)}>
                                    <Download />
                                </Button>
                                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${d.filename}`} onClick={() => onDelete(d.id)}>
                                    <X />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
