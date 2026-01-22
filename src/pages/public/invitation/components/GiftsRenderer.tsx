import { useState } from 'react';
import { Gift, X, Copy, Check, ShoppingBag, CreditCard, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

interface GiftOption {
    type: 'transfer' | 'mercadopago' | 'registry' | 'custom';
    title: string;
    data: any;
}

interface Props {
    title?: string;
    subtitle?: string;
    content?: string;
    options?: GiftOption[];
    // Datos bancarios
    bank?: string;
    owner?: string;
    cbu?: string;
    alias?: string;
    // MercadoPago
    mercadopagoLink?: string;
    // Registry links
    registryLinks?: { store: string; url: string }[];
}

export default function GiftsRenderer({
    title = 'Regalos',
    subtitle,
    content,
    bank,
    owner,
    cbu,
    alias,
    mercadopagoLink,
    registryLinks = []
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Error copying:', err);
        }
    };

    const generateQR = async () => {
        if (!alias && !cbu) return;
        try {
            const text = alias || cbu || '';
            const dataUrl = await QRCode.toDataURL(text, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            setQrDataUrl(dataUrl);
        } catch (err) {
            console.error('Error generating QR:', err);
        }
    };

    const hasTransferData = !!(cbu || alias);
    const hasMercadoPago = !!mercadopagoLink;
    const hasRegistry = registryLinks.length > 0;

    return (
        <section className="py-20 bg-gradient-to-br from-rose-50 to-pink-50 text-center">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mb-6 text-rose-600">
                    <Gift size={32} strokeWidth={1.5} />
                </div>

                <h2 className="text-5xl md:text-7xl font-serif text-slate-900 mb-6 font-bold">{title}</h2>
                <p className="text-slate-600 font-light mb-8 text-lg max-w-xl mx-auto">
                    {subtitle || 'Si deseas regalarnos algo más que tu hermosa presencia...'}
                </p>

                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:from-rose-700 hover:to-pink-700 px-10 py-4 rounded-full text-sm font-bold tracking-wide transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    VER OPCIONES
                </button>
            </div>

            {/* Modal Mejorado */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>

                    {/* Wrapper relativo para el icono flotante */}
                    <div className="relative w-full max-w-2xl z-10 animate-in zoom-in-95 duration-300">

                        {/* Icono Flotante Superior (Fuera del scroll) */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl z-20 ring-4 ring-rose-100">
                            <Gift size={40} className="text-white" strokeWidth={1.5} />
                        </div>

                        {/* Contenedor del Modal con Scroll */}
                        <div className="bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto p-8 pt-16 pb-32 relative">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 bg-slate-100 rounded-full transition-colors z-30"
                            >
                                <X size={20} />
                            </button>

                            <div className="mt-8 space-y-6">
                                <h3 className="text-3xl font-serif text-slate-800 mb-6 text-center">{title}</h3>

                                {/* Mensaje personalizado (Solo si no es redundante) */}
                                {content && !((cbu && content.includes(cbu)) || (alias && content.includes(alias))) && (
                                    <div className="text-slate-600 leading-relaxed text-center bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 text-sm md:text-base">
                                        {content}
                                    </div>
                                )}

                                {/* Transferencia Bancaria */}
                                {hasTransferData && (
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 shadow-md">
                                        <div className="flex items-center gap-3 mb-4">
                                            <CreditCard className="text-blue-600" size={28} />
                                            <h4 className="text-xl font-bold text-blue-900">Transferencia Bancaria</h4>
                                        </div>

                                        <div className="space-y-3">
                                            {bank && (
                                                <div className="bg-white p-3 rounded-lg">
                                                    <p className="text-xs text-slate-500 mb-1">Banco</p>
                                                    <p className="font-semibold text-slate-800">{bank}</p>
                                                </div>
                                            )}
                                            {owner && (
                                                <div className="bg-white p-3 rounded-lg">
                                                    <p className="text-xs text-slate-500 mb-1">Titular</p>
                                                    <p className="font-semibold text-slate-800">{owner}</p>
                                                </div>
                                            )}
                                            {cbu && (
                                                <div className="bg-white p-3 rounded-lg flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-xs text-slate-500 mb-1">CBU</p>
                                                        <p className="font-mono text-sm text-slate-800">{cbu}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => copyToClipboard(cbu, 'cbu')}
                                                        className="ml-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                    >
                                                        {copiedField === 'cbu' ? (
                                                            <Check className="text-green-600" size={20} />
                                                        ) : (
                                                            <Copy className="text-slate-600" size={20} />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                            {alias && (
                                                <div className="bg-white p-3 rounded-lg flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-xs text-slate-500 mb-1">Alias</p>
                                                        <p className="font-semibold text-slate-800">{alias}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => copyToClipboard(alias, 'alias')}
                                                        className="ml-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                    >
                                                        {copiedField === 'alias' ? (
                                                            <Check className="text-green-600" size={20} />
                                                        ) : (
                                                            <Copy className="text-slate-600" size={20} />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Botón QR */}
                                        {!qrDataUrl && (
                                            <button
                                                onClick={generateQR}
                                                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                                            >
                                                <QrCode size={20} />
                                                Generar QR para Transferencia
                                            </button>
                                        )}

                                        {/* QR Code */}
                                        {qrDataUrl && (
                                            <div className="mt-4 bg-white p-4 rounded-lg text-center">
                                                <img src={qrDataUrl} alt="QR Code" className="mx-auto max-w-[200px]" />
                                                <p className="text-xs text-slate-500 mt-2">Escanea para copiar {alias ? 'alias' : 'CBU'}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* MercadoPago */}
                                {hasMercadoPago && (
                                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border-2 border-cyan-200 shadow-md">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
                                                MP
                                            </div>
                                            <h4 className="text-xl font-bold text-cyan-900">MercadoPago</h4>
                                        </div>
                                        <a
                                            href={mercadopagoLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full bg-cyan-600 hover:bg-cyan-700 text-white py-4 rounded-lg text-center font-bold transition-colors shadow-md"
                                        >
                                            Enviar Regalo vía MercadoPago
                                        </a>
                                    </div>
                                )}

                                {/* Lista de Regalos / Registry */}
                                {hasRegistry && (
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200 shadow-md">
                                        <div className="flex items-center gap-3 mb-4">
                                            <ShoppingBag className="text-purple-600" size={28} />
                                            <h4 className="text-xl font-bold text-purple-900">Lista de Regalos</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {registryLinks.map((link, index) => (
                                                <a
                                                    key={index}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block bg-white hover:bg-purple-50 p-4 rounded-lg border border-purple-200 transition-colors text-left"
                                                >
                                                    <p className="font-semibold text-purple-900">{link.store}</p>
                                                    <p className="text-sm text-slate-600 truncate">{link.url}</p>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
