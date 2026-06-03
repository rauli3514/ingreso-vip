import React from 'react';

export default function GlobalFooter() {
    return (
        <footer className="w-full bg-slate-950 border-t border-slate-900 py-6 mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <p className="text-sm font-medium text-slate-500">
                    &copy; {new Date().getFullYear()} EventPix. Todos los derechos reservados.
                </p>
                <p className="text-xs text-slate-600 mt-1">
                    Un producto de TecnoEvento.
                </p>
            </div>
        </footer>
    );
}
