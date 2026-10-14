// ¿El evento tiene un plan pago? Se mira planner_data.active_modules, que solo
// cambia el servidor (aviso de MercadoPago) o el superadmin: un trigger en la
// base impide que el navegador lo modifique (migrations/2026_10_cobro_seguro_planes.sql).
export const PAID_MODULES = ['invitation_pro', 'vip_access'];

export const hasPaidPlan = (plannerData: { active_modules?: string[] } | null | undefined): boolean =>
    (plannerData?.active_modules || []).some(m => PAID_MODULES.includes(m));
