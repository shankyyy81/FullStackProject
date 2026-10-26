import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import AuthLayout from '@/components/AuthLayout';

const FIELD = 'h-11 rounded-none border-0 bg-white text-base';

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'STUDENT',
        department: '',
        year: '',
        skills: '',
        interests: '',
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const toList = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        // Construct payload matching backend schema
        const payload = {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            role: formData.role,
        };
        if (formData.role === 'FACULTY') {
            payload.faculty_profile = { department: formData.department, interests: toList(formData.interests) };
        } else {
            payload.student_profile = { department: formData.department, year: formData.year, skills: toList(formData.skills) };
        }

        try {
            const response = await fetch('http://localhost:8000/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                toast.success('Account created. Sign in to continue.');
                navigate('/login');
            } else {
                const err = await response.json().catch(() => ({}));
                setError(typeof err.detail === 'string' ? err.detail : 'Registration failed. Check the fields and try again.');
            }
        } catch {
            setError('The server could not be reached. Check that the backend is running.');
        } finally {
            setSubmitting(false);
        }
    };

    const faculty = formData.role === 'FACULTY';

    return (
        <AuthLayout
            title="Join SDG Project Manager"
            subtitle={faculty ? 'Write a problem, let the model map it to the UN goals, then assign a student team.' : 'Join a project team and work the board with your faculty.'}
            photo={{ src: '/images/classroom-ghana.jpg' }}
            footer={<>Already have an account? <Link to="/login" className="font-medium text-ink underline underline-offset-4">Sign in</Link></>}
        >
            <form onSubmit={handleSubmit} className="grid gap-5">
                <div className="grid gap-2">
                    <Label id="role-label" className="text-[15px]">I am</Label>
                    <ToggleGroup
                        type="single"
                        value={formData.role}
                        onValueChange={(v) => v && setFormData({ ...formData, role: v })}
                        aria-labelledby="role-label"
                        spacing={0}
                        className="grid w-full grid-cols-2"
                    >
                        {[['STUDENT', 'A student'], ['FACULTY', 'Faculty']].map(([value, label]) => (
                            <ToggleGroupItem
                                key={value}
                                value={value}
                                className="h-11 !rounded-none bg-white/50 text-base text-ink data-[state=on]:bg-olive data-[state=on]:text-olive-ink"
                            >
                                {label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="full_name" className="text-[15px]">Full name</Label>
                    <Input id="full_name" name="full_name" autoComplete="name" className={FIELD} onChange={handleChange} required />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-[15px]">Email</Label>
                        <Input id="email" name="email" type="email" autoComplete="email" className={FIELD} onChange={handleChange} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password" className="text-[15px]">Password</Label>
                        <Input id="password" name="password" type="password" autoComplete="new-password" className={FIELD} onChange={handleChange} required />
                    </div>
                </div>

                <div className={faculty ? 'grid gap-2' : 'grid gap-5 sm:grid-cols-[minmax(0,1fr)_8rem]'}>
                    <div className="grid gap-2">
                        <Label htmlFor="department" className="text-[15px]">Department</Label>
                        <Input id="department" name="department" placeholder="Computer Science" className={FIELD} onChange={handleChange} required />
                    </div>
                    {!faculty && (
                        <div className="grid gap-2">
                            <Label htmlFor="year" className="text-[15px]">Year</Label>
                            <Input id="year" name="year" placeholder="3rd" className={FIELD} onChange={handleChange} required />
                        </div>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor={faculty ? 'interests' : 'skills'} className="text-[15px]">
                        {faculty ? 'Research interests' : 'Skills'}
                    </Label>
                    <Input
                        id={faculty ? 'interests' : 'skills'}
                        name={faculty ? 'interests' : 'skills'}
                        key={faculty ? 'interests' : 'skills'}
                        placeholder={faculty ? 'Water quality, Renewable energy' : 'Python, React, Field surveys'}
                        className={FIELD}
                        onChange={handleChange}
                        aria-describedby="list-hint"
                    />
                    <p id="list-hint" className="text-sm text-ink-soft">Separate with commas.</p>
                </div>

                {error && <p className="text-[15px] font-medium text-[#831c1e]" role="alert">{error}</p>}

                <Button type="submit" disabled={submitting} className="mt-2 h-12 rounded-none bg-olive text-base text-olive-ink hover:bg-olive/90">
                    {submitting ? 'Creating account…' : 'Create account'}
                </Button>
            </form>
        </AuthLayout>
    );
}
