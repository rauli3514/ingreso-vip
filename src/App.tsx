import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalFooter from './components/GlobalFooter';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import EventsList from './pages/admin/EventsList';
import EventDetails from './pages/admin/EventDetails';
import UsersList from './pages/admin/UsersList';
import InvitationEditor from './pages/admin/invitation/InvitationEditor';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';

import GuestApp from './pages/guest/GuestApp';
import InvitationRenderer from './pages/public/invitation/InvitationRenderer';
import PhotoKioskPage from './pages/public/PhotoKioskPage';
import EventPlanner from './pages/public/EventPlanner';

import AdminLayout from './pages/admin/AdminLayout';
import Analytics from './pages/admin/Analytics';
import Leads from './pages/admin/Leads';
import Providers from './pages/admin/Providers';
import Premium from './pages/admin/Premium';
import Conversions from './pages/admin/Conversions';
import Clients from './pages/admin/Clients';
import EventsAdmin from './pages/admin/EventsAdmin';
import UsageMetrics from './pages/admin/UsageMetrics';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <div className="flex flex-col min-h-screen w-full bg-slate-950">
                    <div className="flex-grow flex flex-col relative">
                        <Routes>
                            <Route path="/" element={window.location.hostname.includes('vip') ? <Landing /> : <EventPlanner />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* Admin Routes */}
                            <Route path="/admin" element={<ProtectedRoute />}>
                                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                                <Route path="dashboard" element={<EventsList />} />
                                <Route path="users" element={<UsersList />} />
                                <Route path="event/:id" element={<EventDetails />} />
                                <Route path="event/:id/invitation" element={<InvitationEditor />} />
                                <Route path="metrics" element={<AnalyticsDashboard />} />
                            </Route>

                            {/* EventPix Admin Routes */}
                            <Route path="/admin-ep" element={<ProtectedRoute />}>
                                <Route element={<AdminLayout />}>
                                    <Route index element={<Navigate to="/admin-ep/analytics" replace />} />
                                    <Route path="analytics" element={<Analytics />} />
                                    <Route path="leads" element={<Leads />} />
                                    <Route path="providers" element={<Providers />} />
                                    <Route path="premium" element={<Premium />} />
                                    <Route path="conversions" element={<Conversions />} />
                                    <Route path="clients" element={<Clients />} />
                                    <Route path="events" element={<EventsAdmin />} />
                                    <Route path="metrics" element={<UsageMetrics />} />
                                </Route>
                            </Route>

                            {/* Guest Routes */}
                            <Route path="/evento/:id" element={<GuestApp />} />
                            <Route path="/invitacion/:id" element={<InvitationRenderer />} />
                            <Route path="/invitation/:id" element={<InvitationRenderer />} />
                            <Route path="/kiosco/:id" element={<PhotoKioskPage />} />

                            {/* EventPlanner Public SPA Routes */}
                            <Route path="/planificador" element={<EventPlanner />} />
                            <Route path="/planner" element={<EventPlanner />} />
                        </Routes>
                    </div>
                    <GlobalFooter />
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
