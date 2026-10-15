import DashboardLayout from '../../layouts/DashboardLayout';
import BusinessFunnel from '../../components/BusinessFunnel';

// Antes leía las visitas guardadas en el navegador de quien miraba la pantalla;
// ahora muestra el embudo real de la base.
export default function AnalyticsDashboard() {
    return (
        <DashboardLayout>
            <BusinessFunnel />
        </DashboardLayout>
    );
}
