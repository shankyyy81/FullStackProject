import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { FolderKanban, LogOut, Menu, Moon, Plus, Sun } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PersonDisc, Wordmark, BrandMark } from './marks';

function navItems(user) {
    const items = [{ to: '/dashboard', label: 'Projects', icon: FolderKanban }];
    if (user?.role === 'FACULTY') items.push({ to: '/project/new', label: 'New project', icon: Plus });
    return items;
}

function scopeOf(user) {
    const dept = user?.faculty_profile?.department || user?.student_profile?.department;
    const role = user?.role === 'FACULTY' ? 'Faculty' : 'Student';
    return dept ? `${dept} · ${role}` : role;
}

function SidebarBody({ onNavigate }) {
    const { user, logout } = useAuth();
    const { resolvedTheme, setTheme } = useTheme();
    const navigate = useNavigate();
    const dark = resolvedTheme === 'dark';

    return (
        <div className="flex h-full flex-col gap-8 px-3 py-5">
            <div className="px-2">
                <Link to="/dashboard" onClick={onNavigate} className="text-[15px] text-foreground">
                    <Wordmark />
                </Link>
                <p className="mt-1.5 truncate pl-[34px] text-xs text-muted-foreground">{scopeOf(user)}</p>
            </div>

            <nav aria-label="Main" className="flex flex-col gap-0.5">
                {navItems(user).map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            cn(
                                'flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground',
                                isActive && 'bg-sidebar-accent text-foreground'
                            )
                        }
                    >
                        <Icon className="size-4" strokeWidth={1.6} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto flex flex-col gap-1">
                <button
                    type="button"
                    onClick={() => setTheme(dark ? 'light' : 'dark')}
                    className="flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
                >
                    {dark ? <Sun className="size-4" strokeWidth={1.6} /> : <Moon className="size-4" strokeWidth={1.6} />}
                    {dark ? 'Light mode' : 'Dark mode'}
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left outline-none transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-ring">
                        <PersonDisc name={user?.full_name} />
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{user?.full_name}</span>
                            <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
                        </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" className="w-56">
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{scopeOf(user)}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => {
                                logout();
                                navigate('/login');
                            }}
                        >
                            <LogOut /> Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

const PAGE_NAMES = { '/dashboard': 'Projects', '/project/new': 'New project' };

export default function AppShell() {
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();

    return (
        <div className="min-h-svh bg-background lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
            <aside className="sticky top-0 hidden h-svh border-r border-sidebar-border bg-sidebar lg:block">
                <SidebarBody />
            </aside>

            {/* Phone and tablet: the sidebar folds into a 48px bar and a sheet */}
            <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b bg-background px-4 lg:hidden">
                <Link to="/dashboard" aria-label="SDG Project Manager home">
                    <BrandMark className="size-5" />
                </Link>
                <span className="truncate text-sm font-medium">{PAGE_NAMES[pathname] || 'Workspace'}</span>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto size-11" aria-label="Open menu">
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[85vw] max-w-80 bg-sidebar p-0">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Menu</SheetTitle>
                        </SheetHeader>
                        <SidebarBody onNavigate={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>
            </header>

            <main className="min-w-0 px-4 pt-6 pb-16 sm:px-8 lg:px-10 lg:pt-9">
                <div className="mx-auto w-full max-w-[1240px]">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
