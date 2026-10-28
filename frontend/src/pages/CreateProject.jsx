import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createProject, analyzeSDG } from '../api/projects';
import { GOALS, goalFromLabel } from '@/lib/sdg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GoalTile } from '@/components/marks';

export default function CreateProject() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ title: '', problem_statement: '' });
    const [analysisResults, setAnalysisResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(null);
    const [error, setError] = useState('');

    const handleAnalyze = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await analyzeSDG(formData.problem_statement);
            setAnalysisResults(data.most_suitable_sdgs || []);
            setStep(2);
        } catch {
            setError('The model could not read the statement. Check that the backend is running, then try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (suggestion) => {
        setCreating(suggestion.sdg);
        setError('');
        try {
            await createProject({
                title: formData.title,
                problem_statement: formData.problem_statement,
                sdg_mapping: { [suggestion.sdg]: suggestion.sdg },
                ml_confidence_scores: { [suggestion.sdg]: suggestion.confidence },
            });
            toast.success(`Created “${formData.title}”`);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to create project');
            setCreating(null);
        }
    };

    const matched = new Map(
        step === 2 ? analysisResults.map((s) => [goalFromLabel(s.sdg)?.n, s.confidence]) : []
    );

    return (
        <div className="flex flex-col gap-6">
            <header>
                <h1 className="text-2xl font-semibold tracking-[-0.01em]">New project</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {step === 1
                        ? 'Write the problem. SDG-BERT maps it to the goals, then you confirm one.'
                        : `The model found ${analysisResults.length} ${analysisResults.length === 1 ? 'goal' : 'goals'} for “${formData.title}”.`}
                </p>
            </header>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <section className="rounded-[var(--radius-card)] border bg-card">
                    {step === 1 ? (
                        <form onSubmit={handleAnalyze} className="grid gap-5 p-6">
                            <h2 className="text-base font-medium">The problem</h2>
                            <div className="grid gap-2">
                                <Label htmlFor="title">Project title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Solar water purifiers for rural schools"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-baseline justify-between">
                                    <Label htmlFor="problem">Problem statement</Label>
                                    <span className="num text-xs text-muted-foreground">{formData.problem_statement.length} characters</span>
                                </div>
                                <Textarea
                                    id="problem"
                                    rows={8}
                                    value={formData.problem_statement}
                                    onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
                                    placeholder="Who is affected, what goes wrong today, and what the project will build or test."
                                    className="min-h-44 text-sm leading-6"
                                    required
                                />
                            </div>
                            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                            <Button
                                type="submit"
                                className="justify-self-start"
                                disabled={!formData.title.trim() || !formData.problem_statement.trim() || loading}
                            >
                                {loading ? <><Loader2 className="animate-spin" /> Reading the statement…</> : 'Map to goals'}
                            </Button>
                        </form>
                    ) : (
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4">
                                <h2 className="text-base font-medium">Suggested goals</h2>
                                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                                    <ArrowLeft /> Edit the statement
                                </Button>
                            </div>
                            {error && <p className="px-6 pb-3 text-sm text-destructive" role="alert">{error}</p>}
                            {analysisResults.length === 0 ? (
                                <p className="mx-6 mb-6 rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">
                                    No goal passed the model’s confidence threshold. Add detail about who is affected and what changes, then try again.
                                </p>
                            ) : (
                                <ul className="border-t">
                                    {analysisResults.map((s, idx) => (
                                        <Suggestion
                                            key={s.sdg}
                                            suggestion={s}
                                            primary={idx === 0}
                                            creating={creating}
                                            onConfirm={() => handleConfirm(s)}
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </section>

                <aside className="rounded-[var(--radius-card)] border bg-card p-5" aria-label="Goal map">
                    <div className="flex items-baseline justify-between">
                        <h2 className="text-sm font-medium">The 17 goals</h2>
                        <span className="num text-xs text-muted-foreground">{matched.size} matched</span>
                    </div>
                    <ul className="mt-4 grid grid-cols-6 gap-1.5">
                        {GOALS.map((g) => {
                            const hit = matched.has(g.n);
                            return (
                                <li key={g.n} className="aspect-square">
                                    {hit ? (
                                        <GoalTile goal={g} size="md" className="size-full" title={`SDG ${g.n}: ${g.name}, ${matched.get(g.n).toFixed(1)}%`} />
                                    ) : (
                                        <span
                                            title={`SDG ${g.n}: ${g.name}`}
                                            className="num flex size-full items-start bg-muted p-[0.3em] text-sm font-bold leading-none text-muted-foreground"
                                        >
                                            {g.n}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    <p className="mt-4 text-xs leading-5 text-muted-foreground">
                        Goals score from the fine-tuned SDG-BERT model; targets come from Groq when a key is set on the backend.
                    </p>
                </aside>
            </div>
        </div>
    );
}

function Suggestion({ suggestion, primary, creating, onConfirm }) {
    const goal = goalFromLabel(suggestion.sdg);
    const pct = Math.max(0, Math.min(100, suggestion.confidence));

    return (
        <li className="grid gap-4 border-b border-rule px-6 py-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex min-w-0 gap-4">
                {goal && <GoalTile goal={goal} size="md" />}
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{suggestion.sdg}</p>
                    <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 max-w-60 flex-1 rounded-full bg-muted" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Model confidence">
                            <div className="h-full rounded-full bg-data" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="num text-sm">{suggestion.confidence.toFixed(1)}%</span>
                    </div>
                    {suggestion.targets?.length > 0 && (
                        <ul className="mt-4 flex flex-col gap-2 text-[13px] leading-5">
                            {suggestion.targets.map((t) => (
                                <li key={t.target_id} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] gap-3">
                                    <span className="num font-medium">{t.target_id}</span>
                                    <span className="text-muted-foreground">{t.description}</span>
                                    <span className="num text-right text-muted-foreground">{(t.confidence * 100).toFixed(0)}%</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <Button
                variant={primary ? 'default' : 'outline'}
                className="self-start"
                disabled={!!creating}
                onClick={onConfirm}
            >
                {creating === suggestion.sdg ? 'Creating…' : 'Create with this goal'}
            </Button>
        </li>
    );
}
