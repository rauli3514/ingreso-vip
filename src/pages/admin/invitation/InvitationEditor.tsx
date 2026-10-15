import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../layouts/DashboardLayout';
import InvitationEditorPanel from './InvitationEditorPanel';

export default function InvitationEditor() {
    const { id } = useParams<{ id: string }>(); // Event ID
    const navigate = useNavigate();

    if (!id) return null;

    return (
        <DashboardLayout>
            <InvitationEditorPanel eventId={id} onBack={() => navigate('/admin/dashboard')} />
        </DashboardLayout>
    );
}
