import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { MotionConfig } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppShell from './components/AppShell';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import ProjectWorkspace from './pages/ProjectWorkspace';

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? children : <Navigate to="/login" />;
}

const PUBLIC_PATHS = ['/', '/login', '/register'];

// The public pages carry their own fixed palette; only the app follows the theme toggle.
function Themed({ children }) {
    const { pathname } = useLocation();
    return (
        <ThemeProvider
            attribute="class"
            storageKey="theme"
            defaultTheme="light"
            enableSystem={false}
            forcedTheme={PUBLIC_PATHS.includes(pathname) ? 'light' : undefined}
        >
            {children}
        </ThemeProvider>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Themed>
                    <MotionConfig reducedMotion="user">
                        <TooltipProvider delayDuration={300}>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route element={<PrivateRoute><AppShell /></PrivateRoute>}>
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/project/new" element={<CreateProject />} />
                                    <Route path="/project/:projectId/workspace" element={<ProjectWorkspace />} />
                                </Route>
                            </Routes>
                            <Toaster position="bottom-right" />
                        </TooltipProvider>
                    </MotionConfig>
                </Themed>
            </Router>
        </AuthProvider>
    );
}
