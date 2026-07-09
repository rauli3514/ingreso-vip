import { useState, useEffect, useRef } from 'react';
import LandingHero from './event_planner/LandingHero';
import OnboardingWizard from './event_planner/OnboardingWizard';
import Dashboard from './event_planner/Dashboard';
import SaveProgressModal from './event_planner/SaveProgressModal';
import { EventData, PlannerService } from './event_planner/types';
import { supabase } from '../../lib/supabase';

type PlannerStep = 'landing' | 'dashboard';

const defaultServices: PlannerService[] = [
    // Imprescindible
    { id: '1', category: 'Salón', name: 'Salón / Lugar', status: 'pending', cost: 0, note: '', group: 'imprescindible' },
    { id: '2', category: 'Mobiliario', name: 'Mesas y sillas', status: 'pending', cost: 0, note: '', group: 'imprescindible' },
    { id: '3', category: 'Catering', name: 'Comida / Catering', status: 'pending', cost: 0, note: '', group: 'imprescindible' },
    { id: '4', category: 'Bebidas', name: 'Bebidas', status: 'pending', cost: 0, note: '', group: 'imprescindible' },
    { id: '5', category: 'Música', name: 'Música / DJ', status: 'pending', cost: 0, note: '', group: 'imprescindible' },
    // Muy Importante
    { id: '6', category: 'Decoración', name: 'Decoración', status: 'pending', cost: 0, note: '', group: 'muy_importante' },
    { id: '7', category: 'Vajilla', name: 'Vajilla', status: 'pending', cost: 0, note: '', group: 'muy_importante' },
    { id: '10', category: 'Fotografía', name: 'Fotografía / Video', status: 'pending', cost: 0, note: '', group: 'muy_importante' },
    // Opcional
    { id: '11', category: 'Extras', name: 'Barra de Tragos', status: 'pending', cost: 0, note: '', group: 'opcional' },
    { id: '12', category: 'Extras', name: 'Living / ambientación premium', status: 'pending', cost: 0, note: '', group: 'opcional' },
    { id: '13', category: 'Extras', name: 'Pantalla LED', status: 'pending', cost: 0, note: '', group: 'opcional' },
    { id: '17', category: 'Extras', name: 'Entretenimiento / show', status: 'pending', cost: 0, note: '', group: 'opcional' },
];

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function EventPlanner() {
    const [step, setStep] = useState<PlannerStep>('landing');
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [authModalConfig, setAuthModalConfig] = useState<{isOpen: boolean, mode: 'login' | 'register', view: 'options' | 'email_form'}>({
        isOpen: false,
        mode: 'register',
        view: 'options'
    });
    
    // We lift this up so we can open the manual guest modal from the wizard
    const [openManualGuestInDashboard, setOpenManualGuestInDashboard] = useState(false);
    
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    
    const [eventData, setEventData] = useState<EventData>(() => {

        const saved = localStorage.getItem('eventpix_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                
                let finalServices = defaultServices;
                if (parsed.services) {
                    // If the lengths don't match or some items don't have a group, we migrate
                    // to ensure they see the new categories and structure.
                    finalServices = defaultServices.map(ds => {
                        // Try to find by exact name first
                        let existing = parsed.services.find((ps: any) => ps.name === ds.name);
                        
                        // Fallbacks for renamed items
                        if (!existing && ds.name === 'Comida / Catering') {
                            existing = parsed.services.find((ps: any) => ps.name === 'Vajilla / Catering');
                        }
                        
                        if (existing) {
                            return { ...ds, status: existing.status, cost: existing.cost, note: existing.note };
                        }
                        return ds;
                    });
                }

                return {
                    ...parsed,
                    guests: parsed.guests || [],
                    tables: parsed.tables || [],
                    services: finalServices,
                    estimatedBudget: parsed.estimatedBudget || 0
                };
            } catch (e) {
                console.error("Error parsing saved event data", e);
            }
        }
        return {
            name: '',
            date: '',
            guests: [],
            tables: [],
            services: defaultServices,
            estimatedBudget: 0,
            includesIva: false
        };
    });

    const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Check Supabase Auth State and hydrate from Cloud
    useEffect(() => {
        const checkAuthAndHydrate = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const legacyAuth = localStorage.getItem('eventpix_auth') === 'true';
            
            if (session || legacyAuth) {
                setStep('dashboard');
                if (session) {
                    localStorage.setItem('eventpix_auth', 'true');
                    
                    // Fetch event data from Supabase
                    try {
                        const { data: event } = await supabase
                            .from('events')
                            .select('id, planner_data')
                            .eq('owner_id', session.user.id)
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .single();
                            
                        if (event && event.planner_data) {
                            // Merge cloud data with default services (in case we added new defaults)
                            const cloudData = event.planner_data as EventData;
                            const finalServices = defaultServices.map(ds => {
                                const existing = cloudData.services?.find(ps => ps.name === ds.name);
                                if (existing) {
                                    return { ...ds, status: existing.status, cost: existing.cost, note: existing.note };
                                }
                                return ds;
                            });
                            
                            const hydratedData: EventData = {
                                ...cloudData,
                                guests: cloudData.guests || [],
                                tables: cloudData.tables || [],
                                cloudEventId: event.id,
                                services: finalServices
                            };
                            
                            setEventData(hydratedData);
                            localStorage.setItem('eventpix_data', JSON.stringify(hydratedData));
                        }
                    } catch (err) {
                        console.error('Error fetching cloud event data', err);
                    }
                }
            }
        };
        
        checkAuthAndHydrate();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                localStorage.setItem('eventpix_auth', 'true');
                setStep('dashboard');
                // Could re-hydrate here if needed, but usually page reloads handle it
            } else {
                localStorage.removeItem('eventpix_auth');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Handle MercadoPago Return
    useEffect(() => {
        const processPayment = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const paymentSuccess = urlParams.get('payment_success');
            const plan = urlParams.get('plan');

            if (paymentSuccess === 'true' && plan) {
                // Remove params from URL immediately
                window.history.replaceState({}, '', window.location.pathname);

                // Register payment in DB
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { data: event } = await supabase.from('events').select('id').eq('owner_id', session.user.id).order('created_at', { ascending: false }).limit(1).single();
                    if (event) {
                        const { data: settings } = await supabase.from('app_settings').select('plan_esencial_price, plan_premium_price').eq('id', 1).single();
                        const amount = plan === 'esencial' ? (settings?.plan_esencial_price || 45000) : (settings?.plan_premium_price || 85000);

                        await supabase.from('payments').insert({
                            event_id: event.id,
                            plan_name: plan,
                            amount: amount,
                            status: 'approved'
                        });
                    }
                }

                setEventData(prev => {
                    const modules = new Set(prev.active_modules || []);
                    if (plan === 'esencial') {
                        modules.add('invitation_pro');
                    } else if (plan === 'premium') {
                        modules.add('invitation_pro');
                        modules.add('vip_access');
                    }
                    return {
                        ...prev,
                        active_modules: Array.from(modules)
                    };
                });
                
                setTimeout(() => {
                    alert(`🎉 ¡Pago exitoso!\n\nTu plan ${plan === 'esencial' ? 'Invitación Digital' : 'Ingreso VIP'} ha sido activado correctamente. ¡Disfrútalo!`);
                }, 500);
            }
        };
        processPayment();
    }, []);

    // Auto-save to LocalStorage AND Cloud (Debounced)
    useEffect(() => {
        if (step === 'dashboard') {
            localStorage.setItem('eventpix_data', JSON.stringify(eventData));
            
            // Sync to cloud if authenticated
            if (localStorage.getItem('eventpix_auth') === 'true') {
                if (syncStatus !== 'saving') setSyncStatus('saving');
                if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
                
                syncTimerRef.current = setTimeout(async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        try {
                            const { data: events } = await supabase
                                .from('events')
                                .select('id')
                                .eq('owner_id', session.user.id)
                                .order('created_at', { ascending: false })
                                .limit(1);
                                
                            if (events && events.length > 0) {
                                const { error: updateError } = await supabase
                                    .from('events')
                                    .update({ 
                                        planner_data: eventData,
                                        name: eventData.name || 'Mi Evento',
                                        date: eventData.date || new Date().toISOString().split('T')[0]
                                    })
                                    .eq('id', events[0].id);
                                
                                if (updateError) {
                                    console.error('Update error:', updateError);
                                    setSyncStatus('error');
                                } else {
                                    console.log('Synced to cloud successfully');
                                    setSyncStatus('saved');
                                    setTimeout(() => setSyncStatus('idle'), 3000);
                                }
                            } else {
                                // If no event exists for this user, create one!
                                const { data: newEvent, error: insertError } = await supabase
                                    .from('events')
                                    .insert({
                                        owner_id: session.user.id,
                                        name: eventData.name || 'Mi Evento',
                                        date: eventData.date || new Date().toISOString().split('T')[0],
                                        planner_data: eventData
                                    })
                                    .select('id')
                                    .single();
                                
                                if (insertError) {
                                    console.error('Insert error:', insertError);
                                    setSyncStatus('error');
                                }
                                
                                if (!insertError && newEvent) {
                                    console.log('Created new event in cloud');
                                    setSyncStatus('saved');
                                    setTimeout(() => setSyncStatus('idle'), 3000);
                                    // Update local state to know about this cloud ID
                                    setEventData(prev => ({ ...prev, cloudEventId: newEvent.id }));
                                }
                            }
                        } catch (err) {
                            console.error('Failed to sync to cloud', err);
                            setSyncStatus('error');
                        }
                    } else {
                        setSyncStatus('idle');
                    }
                }, 1000); // 1 second debounce
            }
        }
    }, [eventData, step]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col">
            {step === 'landing' && (
                <>
                    <LandingHero 
                        onStart={() => setIsWizardOpen(true)} 
                        onLoginClick={() => setAuthModalConfig({ isOpen: true, mode: 'login', view: 'email_form' })}
                    />
                    
                    {isWizardOpen && (
                        <OnboardingWizard 
                            eventData={eventData} 
                            onChange={setEventData} 
                            onComplete={() => {
                                setIsWizardOpen(false);
                                setStep('dashboard');
                            }} 
                            onOpenManualGuest={() => setOpenManualGuestInDashboard(true)}
                        />
                    )}
                </>
            )}
            
            {step === 'dashboard' && (
                <div className="w-full flex-1 flex flex-col">
                    <Dashboard 
                        eventData={eventData} 
                        onChange={setEventData} 
                        initialOpenManualGuest={openManualGuestInDashboard}
                        onSaveRequest={() => setAuthModalConfig({ isOpen: true, mode: 'register', view: 'options' })}
                        syncStatus={syncStatus}
                    />
                </div>
            )}

            {authModalConfig.isOpen && (
                <SaveProgressModal 
                    isOpen={authModalConfig.isOpen}
                    onClose={() => setAuthModalConfig(prev => ({ ...prev, isOpen: false }))}
                    initialMode={authModalConfig.mode}
                    initialView={authModalConfig.view}
                />
            )}
        </div>
    );
}
