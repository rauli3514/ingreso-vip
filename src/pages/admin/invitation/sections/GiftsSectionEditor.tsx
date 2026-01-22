import { InvitationData } from '../../../../types';
import { CreditCard, ShoppingBag, Plus, Trash2 } from 'lucide-react';

interface Props {
    invitation: Partial<InvitationData>;
    onChange: (updates: Partial<InvitationData>) => void;
}

export default function GiftsSectionEditor({ invitation, onChange }: Props) {
    const sectionData = (invitation as any).gifts_section || {
        show: true,
        title: 'Regalos',
        subtitle: 'Si deseas regalarnos algo más que tu hermosa presencia...',
        content: '', // Mantener por compatibilidad
        bank: '',
        owner: '',
        cbu: '',
        alias: '',
        mercadopago_link: '',
        gifts_links: []
    };

    const updateSection = (updates: any) => {
        onChange({
            ['gifts_section' as any]: {
                ...sectionData,
                ...updates
            }
        });
    };

    const addRegistryLink = () => {
        const currentLinks = sectionData.gifts_links || [];
        updateSection({
            gifts_links: [...currentLinks, { store: '', url: '' }]
        });
    };

    const updateRegistryLink = (index: number, field: 'store' | 'url', value: string) => {
        const currentLinks = [...(sectionData.gifts_links || [])];
        currentLinks[index] = { ...currentLinks[index], [field]: value };
        updateSection({ gifts_links: currentLinks });
    };

    const removeRegistryLink = (index: number) => {
        const currentLinks = (sectionData.gifts_links || []).filter((_: any, i: number) => i !== index);
        updateSection({ gifts_links: currentLinks });
    };

    const inputBaseClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400";
    const bgWhiteClass = "bg-white " + inputBaseClass;
    const bgGrayClass = "bg-slate-50 " + inputBaseClass;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Sección de Regalos</h3>
                        <p className="text-sm text-slate-500">Configura tus opciones de regalos.</p>
                    </div>

                    <div className="flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={sectionData.show ?? true}
                                onChange={(e) => updateSection({ show: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            <span className="ml-3 text-sm font-medium text-slate-900">
                                {sectionData.show ? 'Visible' : 'Oculto'}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Content */}
                <div className={`space-y-8 transition-all duration-300 ${!sectionData.show ? 'opacity-50 pointer-events-none grayscale' : ''}`}>

                    {/* Textos Generales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                            <input type="text" value={sectionData.title || ''} onChange={(e) => updateSection({ title: e.target.value })} placeholder="Regalos" className={bgGrayClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Subtítulo</label>
                            <input type="text" value={sectionData.subtitle || ''} onChange={(e) => updateSection({ subtitle: e.target.value })} placeholder="Frase corta..." className={bgGrayClass} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mensaje Adicional ("Contenido")</label>
                            <textarea rows={2} value={sectionData.content || ''} onChange={(e) => updateSection({ content: e.target.value })} placeholder="Mensaje opcional que aparecerá arriba en el modal..." className={bgGrayClass + " resize-none"} />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-6"></div>

                    {/* 1. Datos Bancarios */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard size={18} className="text-blue-600" />
                            <h4 className="font-bold text-slate-800">Datos Bancarios</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Banco</label>
                                <input type="text" value={sectionData.bank || ''} onChange={(e) => updateSection({ bank: e.target.value })} placeholder="Ej: Galicia" className={bgWhiteClass} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Titular</label>
                                <input type="text" value={sectionData.owner || ''} onChange={(e) => updateSection({ owner: e.target.value })} placeholder="Nombre Apellido" className={bgWhiteClass} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">CBU / CVU</label>
                                <input type="text" value={sectionData.cbu || ''} onChange={(e) => updateSection({ cbu: e.target.value })} placeholder="000000..." className={bgWhiteClass + " font-mono"} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Alias</label>
                                <input type="text" value={sectionData.alias || ''} onChange={(e) => updateSection({ alias: e.target.value })} placeholder="mi.alias.mp" className={bgWhiteClass + " font-bold !text-blue-900"} />
                            </div>
                        </div>
                    </div>

                    {/* 2. MercadoPago */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 bg-cyan-500 rounded flex items-center justify-center text-[10px] text-white font-bold">MP</div>
                            <h4 className="font-bold text-slate-800">MercadoPago Link</h4>
                        </div>
                        <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Link de Pago o Alias</label>
                            <input type="text" value={sectionData.mercadopago_link || ''} onChange={(e) => updateSection({ mercadopago_link: e.target.value })} placeholder="https://mpago.la/..." className={bgWhiteClass} />
                            <p className="text-[10px] text-slate-500 mt-1">Pega aquí tu link de pago generado en MercadoPago.</p>
                        </div>
                    </div>

                    {/* 3. Lista de Regalos */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <ShoppingBag size={18} className="text-purple-600" />
                                <h4 className="font-bold text-slate-800">Lista de Regalos (Links)</h4>
                            </div>
                            <button onClick={addRegistryLink} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold hover:bg-purple-200 transition-colors flex items-center gap-1">
                                <Plus size={14} /> Agregar
                            </button>
                        </div>

                        <div className="space-y-2">
                            {(sectionData.gifts_links || []).map((link: any, index: number) => (
                                <div key={index} className="flex gap-2 items-start bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            value={link.store}
                                            onChange={(e) => updateRegistryLink(index, 'store', e.target.value)}
                                            placeholder="Nombre Tienda (ej: Frávega)"
                                            className={bgWhiteClass}
                                        />
                                        <input
                                            type="text"
                                            value={link.url}
                                            onChange={(e) => updateRegistryLink(index, 'url', e.target.value)}
                                            placeholder="https://..."
                                            className={bgWhiteClass}
                                        />
                                    </div>
                                    <button onClick={() => removeRegistryLink(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {(sectionData.gifts_links || []).length === 0 && (
                                <div className="text-center py-4 text-slate-400 text-sm italic border border-dashed border-slate-300 rounded-lg">
                                    No hay links agregados.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
