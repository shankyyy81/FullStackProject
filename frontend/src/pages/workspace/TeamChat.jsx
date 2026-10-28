import { useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PersonDisc } from '@/components/marks';

const timeOf = (iso) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function TeamChat({ open, onOpenChange, teamName, people, messages, userId, text, setText, sending, onSend }) {
    const endRef = useRef(null);

    useEffect(() => {
        if (open) endRef.current?.scrollIntoView({ block: 'end' });
    }, [open, messages.length]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
                <SheetHeader className="border-b px-5 py-4">
                    <SheetTitle>{teamName || 'Team chat'}</SheetTitle>
                    <SheetDescription>
                        {people.length ? `${people.length} ${people.length === 1 ? 'person' : 'people'} and the faculty` : 'No team assigned yet'}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {messages.length === 0 ? (
                        <p className="rounded-md border border-dashed px-3 py-2.5 text-[13px] text-muted-foreground">
                            No messages yet. Say what you are working on.
                        </p>
                    ) : (
                        <ol className="flex flex-col gap-4">
                            {messages.map((m) => {
                                const mine = String(m.sender_id || '') === String(userId || '');
                                return (
                                    <li key={m.id} className={cn('flex gap-2.5', mine && 'flex-row-reverse')}>
                                        {!mine && <PersonDisc name={m.sender_name || 'Unknown'} />}
                                        <div className={cn('flex max-w-[80%] flex-col gap-1', mine && 'items-end')}>
                                            <span className="text-xs text-muted-foreground">
                                                {mine ? 'You' : m.sender_name || 'Unknown'}
                                                {!mine && m.sender_role === 'FACULTY' && ' · faculty'}
                                                {m.created_at && <span className="num"> · {timeOf(m.created_at)}</span>}
                                            </span>
                                            <p className={cn(
                                                'rounded-lg px-3 py-2 text-sm leading-5 whitespace-pre-wrap break-words',
                                                mine ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                            )}>
                                                {m.message}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                    <div ref={endRef} />
                </div>

                <form onSubmit={onSend} className="flex gap-2 border-t p-3">
                    <Input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Message the team"
                        aria-label="Message"
                    />
                    <Button type="submit" size="icon" aria-label="Send" disabled={sending || !text.trim()}>
                        <ArrowUp />
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}
