import { MapPin, Car } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
    title: string;
    description?: string;
    locationName: string;
    address: string;
    startTime: string;
    mapUrl?: string;
    icon?: 'church' | 'party';
    themeColor: string; // Recibimos el color primario del tema
    lat?: number | string;
    lng?: number | string;
}

export default function EventCardRenderer({ title, description, locationName, address, startTime, mapUrl, icon, themeColor, lat, lng }: Props) {
    const date = startTime ? new Date(startTime) : null;

    // Fallback color si viniera vacío, aunque debería venir del padre
    const primaryColor = themeColor || '#849b89';

    // Iconos SVG personalizados según tipo (NUEVOS diseños)
    const IconSvg = icon === 'church'
        ? (
            // Anillos entrelazados (Ceremonia)
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="12" r="4" />
                <circle cx="15" cy="12" r="4" />
            </svg>
        )
        : (
            // Gorro de fiesta con confeti (Fiesta)
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5.5 4L2 14l7 1.5L12 22l3-6.5L22 14l-3.5-10z" />
                <path d="M12 4v3" />
                <path d="M9 7l-2-2" />
                <path d="M15 7l2-2" />
                <circle cx="17" cy="5" r="0.5" fill="currentColor" />
                <circle cx="19" cy="8" r="0.5" fill="currentColor" />
                <circle cx="5" cy="5" r="0.5" fill="currentColor" />
                <circle cx="7" cy="8" r="0.5" fill="currentColor" />
            </svg>
        );

    // Generar enlace de Google Calendar (compatible con todos los dispositivos)
    const generateCalendarLink = () => {
        if (!date) return '#';
        const endDate = new Date(date.getTime() + 4 * 60 * 60 * 1000); // 4 horas después
        const startStr = format(date, "yyyyMMdd'T'HHmmss");
        const endStr = format(endDate, "yyyyMMdd'T'HHmmss");

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(description || '')}&location=${encodeURIComponent(address)}`;
    };

    const getUberLink = () => {
        // Universal Uber link
        if (!lat || !lng) return undefined;
        // Updated to use a simpler universal link that often behaves better for just "Going Here"
        // If pickup is set to my_location, sometimes it fails if permission doesn't grant immediately.
        // Let's remove specific action to let the app decide, or just set dropoff.
        const nickname = encodeURIComponent(locationName);
        const formattedAddress = encodeURIComponent(address);

        // Format: https://m.uber.com/ul/?action=setPickup&client_id=<CLIENT_ID>&pickup=my_location&dropoff[latitude]=<LAT>&dropoff[longitude]=<LONG>&dropoff[nickname]=<NAME>&dropoff[formatted_address]=<ADDRESS>
        return `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${nickname}&dropoff[formatted_address]=${formattedAddress}`;
    };

    const getCabifyLink = () => {
        // Cabify doesn't have a public deep link API as open as Uber, 
        // usually just opening the app or falling back to web.
        // Web: https://cabify.com/
        // Actually, explicit destination deep links are harder to guarantee across OS.
        // Let's stick to Maps if we can't reliably link, but for now let's just use Google Maps Directions as fallback or try a waze link.
        // Waze: https://waze.com/ul?ll=<LAT>,<LONG>&navigate=yes
        if (!lat || !lng) return undefined;
        return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    };

    const uberUrl = getUberLink();
    const wazeUrl = getCabifyLink(); // Using Waze as "Cabify/Logistics" alternative for now or explicit Waze button

    return (
        <div className="relative flex flex-col items-center text-center px-4 group">
            {/* Elemento Decorativo Flotante (Icono Circular) */}
            <div className="w-28 h-28 bg-white rounded-full shadow-xl flex items-center justify-center text-slate-600 mb-6 z-10 transform group-hover:scale-105 transition-transform duration-500 ease-out border border-slate-50">
                <div style={{ color: primaryColor }}>
                    {IconSvg}
                </div>
            </div>

            {/* Cinta (Ribbon) Título */}
            <div className="relative w-full max-w-[320px] z-0 mb-8 filter drop-shadow-md">
                <div
                    className="text-white py-3 px-6 flex items-center justify-center transition-colors duration-500"
                    style={{
                        backgroundColor: primaryColor,
                        clipPath: 'polygon(0% 0%, 100% 0%, 95% 50%, 100% 100%, 0% 100%, 5% 50%)'
                    }}
                >
                    <h3 className="text-base md:text-lg font-serif pt-1 leading-relaxed text-center" style={{ fontFamily: '"Great Vibes", cursive' }}>
                        {title}
                    </h3>
                </div>
            </div>

            {/* Contenido */}
            <div className="w-full space-y-6">

                {/* Día y Hora */}
                {date && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        <h4 className="text-xl font-bold text-slate-700 mb-1 uppercase tracking-wider">Día</h4>
                        <p className="text-slate-500 font-light text-lg">
                            <span className="capitalize">{format(date, "EEEE d 'de' MMMM", { locale: es })}</span>
                            <span className="mx-2">•</span>
                            <span>{format(date, "HH:mm")} hs</span>
                        </p>

                        {/* Botón Agendar - Abre Google Calendar */}
                        <a
                            href={generateCalendarLink()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-block border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-8 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm hover:shadow transition-all transform hover:-translate-y-0.5"
                        >
                            AGENDAR
                        </a>
                    </div>
                )}

                {/* Separador sutil */}
                <div className="w-12 h-px bg-slate-200 mx-auto"></div>

                {/* Lugar */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <h4 className="text-xl font-bold text-slate-700 mb-1 uppercase tracking-wider">Lugar</h4>
                    <p className="font-medium text-slate-800 text-lg mb-1">{locationName}</p>
                    <p className="text-slate-500 text-sm font-light max-w-xs mx-auto leading-relaxed">{address}</p>

                    {mapUrl && (
                        <div className="flex flex-col gap-3 items-center mt-4 w-full">
                            <a
                                href={mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 w-full justify-center max-w-[250px]"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = primaryColor;
                                    e.currentTarget.style.borderColor = primaryColor;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#475569';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                <MapPin size={14} />
                                CÓMO LLEGAR (MAPS)
                            </a>

                            {/* Logistics Buttons */}
                            {(uberUrl || wazeUrl) && (
                                <div className="flex gap-2 w-full max-w-[250px] justify-center">
                                    {uberUrl && (
                                        <a href={uberUrl} target="_blank" rel="noopener noreferrer"
                                            className="flex-1 bg-black text-white py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-1 shadow-md">
                                            <Car size={12} /> Uber
                                        </a>
                                    )}
                                    {wazeUrl && (
                                        <a href={wazeUrl} target="_blank" rel="noopener noreferrer"
                                            className="flex-1 bg-blue-500 text-white py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center justify-center gap-1 shadow-md">
                                            <MapPin size={12} /> Waze
                                        </a>
                                    )}
                                </div>
                            )}

                            {/*
                            <a
                                href="#rsvp-section"
                                className="inline-flex items-center gap-2 bg-slate-900 border border-slate-900 text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm hover:shadow-md hover:bg-slate-800 transition-all transform hover:-translate-y-0.5 w-full justify-center max-w-[250px]"
                            >
                                CONFIRMAR ASISTENCIA
                            </a>
                            */}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
