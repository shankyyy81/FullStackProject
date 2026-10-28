import { useAuth } from '../context/AuthContext';
import FacultyDashboard from './FacultyDashboard';
import StudentDashboard from './StudentDashboard';

export default function Dashboard() {
    const { user } = useAuth();
    if (!user) return null;
    return user.role === 'FACULTY' ? <FacultyDashboard /> : <StudentDashboard />;
}
