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

    // Auto-save to LocalStorage AND Cloud (Debounced)
    useEffect(() => {
        if (step === 'dashboard') {
            localStorage.setItem('eventpix_data', JSON.stringify(eventData));
            
            // Sync to cloud if authenticated
            if (localStorage.getItem('eventpix_auth') === 'true') {
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
                                    .update({ planner_data: eventData })
                                    .eq('id', events[0].id);
                                
                                if (updateError) {
                                    console.error('Update error:', updateError);
                                    alert('Ups, error interno al actualizar: ' + updateError.message + '\nPor favor enviame captura!');
                                } else {
                                    console.log('Synced to cloud successfully');
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
                                    alert('Ups, error interno al guardar: ' + insertError.message + '\nPor favor enviame captura de esto!');
                                }
                                
                                if (!insertError && newEvent) {
                                    console.log('Created new event in cloud');
                                    // Update local state to know about this cloud ID
                                    setEventData(prev => ({ ...prev, cloudEventId: newEvent.id }));
                                }
                            }
                        } catch (err) {
                            console.error('Failed to sync to cloud', err);
                        }
                    }
                }, 1500); // 1.5 second debounce
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
