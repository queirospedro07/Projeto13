import React, { useState } from 'react';
import { Sun, Moon, Monitor, Bell, Shield, User, Check, LogOut } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/ui/Toast';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [chatMentions, setChatMentions] = useState(true);

  const handleSavePreferences = () => {
    toast({ title: 'Definições Guardadas', message: 'As suas preferências foram atualizadas com sucesso.', type: 'success' });
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10 animate-fade-in pb-16">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <Badge size="md" variant="primary">Configurações</Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Definições da Conta</h1>
        <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
          Gira as suas preferências visuais, notificações e dados de sessão.
        </p>
      </div>

      {/* 1. APPEARANCE & THEME */}
      <Card className="p-8 border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-xs">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Aparência & Tema</h3>
        <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6">Escolha o tema visual para a plataforma.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all cursor-pointer ${
              theme === 'light' 
                ? 'border-blue-600 bg-blue-50/50 dark:bg-neutral-900 shadow-xs ring-2 ring-blue-500/20' 
                : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <Sun className="w-5 h-5 text-amber-500" />
              {theme === 'light' && <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">Modo Claro (Padrão)</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Fundo branco puro & alto contraste</p>
            </div>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all cursor-pointer ${
              theme === 'dark' 
                ? 'border-blue-600 bg-blue-50/50 dark:bg-neutral-900 shadow-xs ring-2 ring-blue-500/20' 
                : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <Moon className="w-5 h-5 text-slate-600 dark:text-blue-400" />
              {theme === 'dark' && <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">Modo Escuro (Preto Puro)</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Preto OLED (#000000) & alto contraste</p>
            </div>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all cursor-pointer ${
              theme === 'system' 
                ? 'border-blue-600 bg-blue-50/50 dark:bg-neutral-900 shadow-xs ring-2 ring-blue-500/20' 
                : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <Monitor className="w-5 h-5 text-slate-600 dark:text-neutral-300" />
              {theme === 'system' && <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">Sincronizado com o Sistema</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Segue o sistema operativo</p>
            </div>
          </button>
        </div>
      </Card>

      {/* 2. NOTIFICATIONS PREFERENCES */}
      <Card className="p-8 flex flex-col gap-6 border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Notificações</h3>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Escolha quais os alertas que deseja receber.</p>
        </div>

        <div className="flex flex-col gap-4 divide-y divide-slate-100 dark:divide-neutral-850">
          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Novidades & Módulos nos Cursos</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Quando os instrutores publicam novas aulas ou conteúdos</p>
            </div>
            <input
              type="checkbox"
              checked={courseUpdates}
              onChange={(e) => setCourseUpdates(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Menções na Comunidade & Chat</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Quando alguém o menciona diretamente ou responde a uma mensagem sua</p>
            </div>
            <input
              type="checkbox"
              checked={chatMentions}
              onChange={(e) => setChatMentions(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Resumo Semanal de Progresso</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Resumo semanal do XP acumulado e estado das sequências</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifs}
              onChange={(e) => setEmailNotifs(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <Button onClick={handleSavePreferences} variant="primary" size="md" className="self-end mt-2 font-bold shadow-md shadow-blue-500/20">
          Guardar Preferências
        </Button>
      </Card>

      {/* 3. ACCOUNT & SESSION */}
      <Card className="p-7 flex items-center justify-between border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-xs">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">Gestão de Sessão</h4>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">Sessão iniciada como {user?.email} ({user?.role})</p>
        </div>
        <Button onClick={logout} variant="secondary" size="md" leftIcon={<LogOut className="w-4 h-4 text-red-600" />} className="font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:hover:border-red-900">
          Terminar Sessão
        </Button>
      </Card>

    </div>
  );
};
