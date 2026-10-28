import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/components/AuthLayout';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch {
            setError('That email and password do not match an account.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="Sign in to SDG Project Manager"
            subtitle="Open your projects, the team board and the literature assistant."
            photo={{ src: '/images/university-lab.jpg' }}
            footer={<>New here? <Link to="/register" className="font-medium text-ink underline underline-offset-4">Create an account</Link></>}
        >
            <form onSubmit={handleSubmit} className="grid gap-5">
                <div className="grid gap-2">
                    <Label htmlFor="email" className="text-[15px]">Email</Label>
                    <Input id="email" type="email" autoComplete="email" className="h-11 rounded-none border-0 bg-white text-base" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password" className="text-[15px]">Password</Label>
                    <Input id="password" type="password" autoComplete="current-password" className="h-11 rounded-none border-0 bg-white text-base" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <p className="text-[15px] font-medium text-[#831c1e]" role="alert">{error}</p>}
                <Button type="submit" disabled={submitting} className="mt-2 h-12 rounded-none bg-olive text-base text-olive-ink hover:bg-olive/90">
                    {submitting ? 'Signing in…' : 'Sign in'}
                </Button>
            </form>
        </AuthLayout>
    );
}
