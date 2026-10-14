// Planes que se cobran con MercadoPago y qué módulos activa cada uno.
// Lo usan las dos funciones (crear el pago y recibir el aviso de MercadoPago),
// así el precio y los módulos salen siempre del servidor y nunca del navegador.

export type PlanName = 'esencial' | 'premium';

export const PLANS: Record<PlanName, { title: string; priceColumn: string; fallbackPrice: number; modules: string[] }> = {
  esencial: {
    title: 'Plan Invitación Digital EventPix',
    priceColumn: 'plan_esencial_price',
    fallbackPrice: 45000,
    modules: ['invitation_pro'],
  },
  premium: {
    title: 'Plan Ingreso VIP EventPix',
    priceColumn: 'plan_premium_price',
    fallbackPrice: 85000,
    modules: ['invitation_pro', 'vip_access'],
  },
};

export const isPlanName = (value: unknown): value is PlanName =>
  value === 'esencial' || value === 'premium';
