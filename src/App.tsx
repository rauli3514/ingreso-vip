import { useState } from 'react'

function App() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <div className="glass p-8 rounded-2xl max-w-md w-full fade-in">
                <h1 className="text-4xl text-gold mb-2">Ingreso VIP</h1>
                <p className="text-muted text-sm mb-8 tracking-widest uppercase">by Tecno Eventos</p>

                <div className="space-y-4">
                    <p className="text-lg">Sistema de Gestión de Invitados y Eventos</p>

                    <div className="flex gap-4 justify-center mt-6">
                        <button className="btn btn-primary">Iniciar Sesión</button>
                        <button className="btn btn-outline">Demo Invitado</button>
                    </div>
                </div>
            </div>

            <footer className="mt-8 text-xs text-muted opacity-50">
                &copy; 2025 Tecno Eventos. Todos los derechos reservados.
            </footer>
        </div>
    )
}

export default App
