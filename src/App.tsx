import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import EventsList from './pages/admin/EventsList';
import EventDetails from './pages/admin/EventDetails';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />

                    {/* Admin Routes */}
                    <Route path="/admin" element={<ProtectedRoute />}>
                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="dashboard" element={<EventsList />} />
                        <Route path="event/:id" element={<EventDetails />} />
                    </Route>

                    {/* Guest Routes */}
                    <Route path="/evento/:id" element={<div>Evento (WIP)</div>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
