import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { 
  Layers, 
  Hash, 
  Volume2, 
  FileText, 
  HelpCircle, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  X,
  Sparkles, 
  Eye, 
  BookOpen, 
  CheckCircle2, 
  DollarSign,
  Users, 
  Code2, 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  Clock, 
  Award, 
  Trophy, 
  Flame, 
  Star, 
  Shield, 
  Palette, 
  Download, 
  FolderArchive, 
  Bell,
  Megaphone,
  Mic,
  MicOff,
  Radio,
  FileBadge,
  SlidersHorizontal,
  Lock,
  Unlock,
  Copy,
  Monitor,
  Camera,
  ImagePlus,
  Loader2,
  FileEdit,
  Send
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { soundEffects } from '../../services/soundEffects';
import { api } from '../../services/api';
import { QuizQuestionType } from '../../types';

export type LessonType = 'video' | 'text' | 'quiz' | 'code' | 'project' | 'resource' | 'embed';

export interface CourseRoleItem {
  id: string;
  name: string;
  color: 'indigo' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'rose' | 'zinc';
  canPostAnnouncements: boolean;
  canSpeakInStage: boolean;
  canShareScreen: boolean;
  canModerateChat: boolean;
  canManageVoice: boolean;
  isSystem?: boolean;
}

export interface ChannelItem {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'qa' | 'showcase' | 'doc';
  accessMode?: 'discussion' | 'announcement' | 'qa';
  voiceMode?: 'open' | 'stage' | 'qa';
  topic: string;
  guidingQuestion: string;
  guidelines: string;
}

export interface QuizOptionItem {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestionItem {
  id: string;
  question: string;
  type: QuizQuestionType;
  explanation: string;
  points?: number;
  options: QuizOptionItem[];
  gradingMode?: 'auto' | 'teacher';
  keywords?: string[];
  minWords?: number;
  expectedAnswer?: string;
}

export const QuizLessonEditor: React.FC<{
  quiz?: LessonItem['quiz'];
  onChange: (quiz: NonNullable<LessonItem['quiz']>) => void;
}> = ({ quiz, onChange }) => {
  const currentQuiz: NonNullable<LessonItem['quiz']> = quiz || {
    title: 'Questionário de Avaliação',
    description: 'Responda às questões para validar a sua compreensão da aula.',
    passingScore: 70,
    xpReward: 50,
    questions: []
  };

  const handleUpdateField = <K extends keyof NonNullable<LessonItem['quiz']>>(
    field: K,
    value: NonNullable<LessonItem['quiz']>[K]
  ) => {
    onChange({
      ...currentQuiz,
      [field]: value
    });
  };

  const handleAddQuestion = (type: QuizQuestionType = 'single') => {
    soundEffects.play('click');
    const newQ: QuizQuestionItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      question: '',
      type,
      explanation: '',
      points: 10,
      options:
        type === 'true-false'
          ? [
              { id: 'opt-tf-1', text: 'Verdadeiro', isCorrect: true },
              { id: 'opt-tf-2', text: 'Falso', isCorrect: false }
            ]
          : type === 'open-ended'
          ? []
          : [
              { id: 'opt-1', text: 'Opção 1 (Correta)', isCorrect: true },
              { id: 'opt-2', text: 'Opção 2', isCorrect: false }
            ],
      gradingMode: type === 'open-ended' ? 'auto' : undefined,
      keywords: type === 'open-ended' ? [] : undefined,
      minWords: type === 'open-ended' ? 10 : undefined,
      expectedAnswer: ''
    };

    handleUpdateField('questions', [...currentQuiz.questions, newQ]);
  };

  const handleUpdateQuestion = (qId: string, updates: Partial<QuizQuestionItem>) => {
    const updated = currentQuiz.questions.map(q => {
      if (q.id !== qId) return q;
      const nextQ = { ...q, ...updates };

      if (updates.type === 'true-false' && (!nextQ.options || nextQ.options.length !== 2)) {
        nextQ.options = [
          { id: 'opt-tf-1', text: 'Verdadeiro', isCorrect: true },
          { id: 'opt-tf-2', text: 'Falso', isCorrect: false }
        ];
      } else if (
        updates.type &&
        updates.type !== 'true-false' &&
        updates.type !== 'open-ended' &&
        (!nextQ.options || nextQ.options.length === 0)
      ) {
        nextQ.options = [
          { id: 'opt-1', text: 'Opção 1', isCorrect: true },
          { id: 'opt-2', text: 'Opção 2', isCorrect: false }
        ];
      }

      return nextQ;
    });
    handleUpdateField('questions', updated);
  };

  const handleRemoveQuestion = (qId: string) => {
    soundEffects.play('click');
    handleUpdateField('questions', currentQuiz.questions.filter(q => q.id !== qId));
  };

  const handleAddOption = (qId: string) => {
    soundEffects.play('click');
    const question = currentQuiz.questions.find(q => q.id === qId);
    if (!question) return;

    const optCount = question.options.length + 1;
    const newOpt: QuizOptionItem = {
      id: `opt-${Date.now()}-${optCount}`,
      text: `Opção ${optCount}`,
      isCorrect: false
    };

    handleUpdateQuestion(qId, {
      options: [...question.options, newOpt]
    });
  };

  const handleUpdateOption = (qId: string, optId: string, text: string) => {
    const question = currentQuiz.questions.find(q => q.id === qId);
    if (!question) return;

    const options = question.options.map(o => (o.id === optId ? { ...o, text } : o));
    handleUpdateQuestion(qId, { options });
  };

  const handleToggleOptionCorrect = (qId: string, optId: string) => {
    soundEffects.play('click');
    const question = currentQuiz.questions.find(q => q.id === qId);
    if (!question) return;

    let options: QuizOptionItem[];
    if (question.type === 'single' || question.type === 'find-incorrect' || question.type === 'true-false') {
      options = question.options.map(o => ({
        ...o,
        isCorrect: o.id === optId
      }));
    } else {
      options = question.options.map(o => (o.id === optId ? { ...o, isCorrect: !o.isCorrect } : o));
      if (!options.some(o => o.isCorrect)) {
        options = options.map(o => (o.id === optId ? { ...o, isCorrect: true } : o));
      }
    }

    handleUpdateQuestion(qId, { options });
  };

  const handleRemoveOption = (qId: string, optId: string) => {
    soundEffects.play('click');
    const question = currentQuiz.questions.find(q => q.id === qId);
    if (!question || question.options.length <= 2) return;

    let remaining = question.options.filter(o => o.id !== optId);
    if (!remaining.some(o => o.isCorrect)) {
      remaining = remaining.map((o, idx) => (idx === 0 ? { ...o, isCorrect: true } : o));
    }

    handleUpdateQuestion(qId, { options: remaining });
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-[#242838] flex flex-col gap-4 text-xs">
      {/* Quiz Global Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#2b3044]">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Título do Questionário</label>
          <input
            type="text"
            value={currentQuiz.title}
            onChange={(e) => handleUpdateField('title', e.target.value)}
            placeholder="Ex: Avaliação de React e TypeScript"
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-[#2b3044] text-slate-900 dark:text-zinc-100 text-xs focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Nota Mínima Aprovação (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={currentQuiz.passingScore}
            onChange={(e) => handleUpdateField('passingScore', Number(e.target.value) || 0)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-[#2b3044] text-slate-900 dark:text-zinc-100 text-xs focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Recompensa (XP)</label>
          <input
            type="number"
            min={0}
            value={currentQuiz.xpReward}
            onChange={(e) => handleUpdateField('xpReward', Number(e.target.value) || 0)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-[#2b3044] text-slate-900 dark:text-zinc-100 text-xs focus:outline-none"
          />
        </div>
        <div className="sm:col-span-3 flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Instruções aos Alunos</label>
          <input
            type="text"
            value={currentQuiz.description}
            onChange={(e) => handleUpdateField('description', e.target.value)}
            placeholder="Ex: Responda com atenção a todas as perguntas para desbloquear a lição seguinte."
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-[#2b3044] text-slate-900 dark:text-zinc-100 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
            Perguntas ({currentQuiz.questions.length})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleAddQuestion('single')}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Pergunta</span>
            </button>
          </div>
        </div>

        {currentQuiz.questions.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-[#2b3044] text-center text-slate-500 dark:text-zinc-400">
            <p className="text-xs font-semibold">Nenhuma pergunta adicionada a este questionário.</p>
            <p className="text-[11px] mt-0.5">Clique em "Adicionar Pergunta" acima para começar.</p>
          </div>
        ) : (
          currentQuiz.questions.map((q, qIdx) => (
            <div
              key={q.id}
              className="p-4 rounded-xl bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-3 transition-colors shadow-xs"
            >
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-[#222636]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-black text-[11px] flex items-center justify-center border border-indigo-200 dark:border-indigo-800/40">
                    {qIdx + 1}
                  </span>
                  <select
                    value={q.type}
                    onChange={(e) => handleUpdateQuestion(q.id, { type: e.target.value as QuizQuestionType })}
                    className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-[#1c1f2b] border border-slate-200 dark:border-[#2e3346] text-slate-900 dark:text-zinc-100 text-xs font-bold cursor-pointer focus:outline-none"
                  >
                    <option value="single">Escolha Única (1 Correta)</option>
                    <option value="multiple">Múltipla Seleção (Várias Corretas)</option>
                    <option value="find-incorrect">Encontre o Erro (Assinalar a Incorreta)</option>
                    <option value="true-false">Verdadeiro ou Falso</option>
                    <option value="open-ended">Resposta por Extenso / Aberta</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                    <span>Pontos:</span>
                    <input
                      type="number"
                      min={1}
                      value={q.points || 10}
                      onChange={(e) => handleUpdateQuestion(q.id, { points: Number(e.target.value) || 1 })}
                      className="w-12 px-1.5 py-0.5 rounded bg-slate-50 dark:bg-[#1c1f2b] border border-slate-200 dark:border-[#2e3346] text-center text-slate-900 dark:text-zinc-100 text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(q.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Remover pergunta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Enunciado da Pergunta</label>
                <textarea
                  value={q.question}
                  onChange={(e) => handleUpdateQuestion(q.id, { question: e.target.value })}
                  rows={2}
                  placeholder="Introduza aqui o enunciado da questão..."
                  className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#2b3044] text-slate-900 dark:text-zinc-100 text-xs focus:outline-none resize-none"
                />
              </div>

              {/* Explanation / Pedagogy */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Explicação / Feedback Pedagógico (após responder)</label>
                <input
                  type="text"
                  value={q.explanation}
                  onChange={(e) => handleUpdateQuestion(q.id, { explanation: e.target.value })}
                  placeholder="Ex: Esta opção é a correta porque as Server Actions executam mutações seguras no servidor."
                  className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#2b3044] text-slate-900 dark:text-zinc-100 text-xs focus:outline-none"
                />
              </div>

              {/* Options Section */}
              {q.type === 'open-ended' ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#2b3044] flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                      Palavras-chave para Auto-Correção (separadas por vírgulas)
                    </label>
                    <input
                      type="text"
                      value={(q.keywords || []).join(', ')}
                      onChange={(e) => {
                        const kw = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        handleUpdateQuestion(q.id, { keywords: kw });
                      }}
                      placeholder="Ex: servidor, cliente, seguranca, renderizacao"
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#12141c] border border-slate-200 dark:border-[#2b3044] text-slate-900 dark:text-zinc-100 text-xs focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                      O sistema analisa a resposta do aluno com correspondência semântica e tolerância a acentos destas palavras-chave.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Número Mínimo de Palavras</label>
                      <input
                        type="number"
                        min={1}
                        value={q.minWords || 10}
                        onChange={(e) => handleUpdateQuestion(q.id, { minWords: Number(e.target.value) || 5 })}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#12141c] border border-slate-200 dark:border-[#2b3044] text-slate-900 dark:text-zinc-100 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Critério de Avaliação</label>
                      <select
                        value={q.gradingMode || 'auto'}
                        onChange={(e) => handleUpdateQuestion(q.id, { gradingMode: e.target.value as 'auto' | 'teacher' })}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#12141c] border border-slate-200 dark:border-[#2b3044] text-slate-900 dark:text-zinc-100 text-xs focus:outline-none"
                      >
                        <option value="auto">Automático (Palavras-chave)</option>
                        <option value="teacher">Avaliação do Instrutor</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Resposta Modelo Sugerida</label>
                    <textarea
                      value={q.expectedAnswer || ''}
                      onChange={(e) => handleUpdateQuestion(q.id, { expectedAnswer: e.target.value })}
                      rows={2}
                      placeholder="Exemplo de resposta ideal para referência pedagógica..."
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#12141c] border border-slate-200 dark:border-[#2b3044] text-slate-900 dark:text-zinc-100 text-xs focus:outline-none resize-none"
                    />
                  </div>
                </div>
              ) : q.type === 'true-false' ? (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                    Selecione qual é a resposta correta:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleToggleOptionCorrect(q.id, opt.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between font-bold text-xs transition-all cursor-pointer ${
                          opt.isCorrect
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs'
                            : 'bg-slate-50 dark:bg-[#181a24] border-slate-200 dark:border-[#2b3044] text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-[#383f58]'
                        }`}
                      >
                        <span>{opt.text}</span>
                        {opt.isCorrect && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                      {q.type === 'find-incorrect'
                        ? 'Selecione a afirmação FALSA (o erro que o aluno deve detetar):'
                        : q.type === 'multiple'
                        ? 'Selecione todas as opções CORRETAS:'
                        : 'Selecione a opção CORRETA:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddOption(q.id)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar Opção</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
                          opt.isCorrect
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40'
                            : 'bg-slate-50 dark:bg-[#181a24] border-slate-200 dark:border-[#2b3044]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleOptionCorrect(q.id, opt.id)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                            opt.isCorrect
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                              : 'bg-white dark:bg-[#1c1f2b] border-slate-300 dark:border-[#3b415a] text-transparent hover:border-slate-400'
                          }`}
                          title={opt.isCorrect ? 'Resposta correta' : 'Marcar como resposta correta'}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleUpdateOption(q.id, opt.id, e.target.value)}
                          placeholder={`Texto da Opção ${optIdx + 1}...`}
                          className="flex-1 bg-transparent text-xs text-slate-900 dark:text-zinc-100 focus:outline-none"
                        />

                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(q.id, opt.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                            title="Remover opção"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export interface VideoChapter {
  id: string;
  time: string;
  title: string;
}

export interface CodeChallengeData {
  language: 'typescript' | 'javascript' | 'python' | 'react' | 'html' | 'sql';
  initialCode: string;
  solutionCode: string;
  instructions: string;
  hints: string[];
}

export interface RichArticleData {
  markdown: string;
  calloutType: 'tip' | 'warning' | 'info' | 'challenge';
  calloutTitle: string;
  calloutText: string;
  checklist: { id: string; text: string }[];
}

export interface DownloadableResourceItem {
  id: string;
  name: string;
  url: string;
  size: string;
  type: 'pdf' | 'zip' | 'figma' | 'code' | 'doc';
}

export interface LessonItem {
  id: string;
  title: string;
  type: LessonType;
  durationMin: number;
  videoUrl?: string;
  content: string;
  xpReward?: number;
  videoChapters?: VideoChapter[];
  codeChallenge?: CodeChallengeData;
  richArticle?: RichArticleData;
  resources?: DownloadableResourceItem[];
  quiz?: {
    title: string;
    description: string;
    passingScore: number;
    xpReward: number;
    questions: QuizQuestionItem[];
  };
}

export interface ModuleItem {
  id: string;
  title: string;
  description: string;
  dripMode?: 'instant' | 'drip' | 'sequential';
  dripDays?: number;
  lessons: LessonItem[];
}

const PRESET_THUMBNAILS = [
  { label: 'Programação', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80' },
  { label: 'Design & UI/UX', url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=80' },
  { label: 'Inteligência Artificial', url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80' },
  { label: 'Negócios & Gestão', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80' }
];

export const CourseBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { courseId: editCourseId } = useParams<{ courseId: string }>();
  const isEditMode = !!editCourseId;
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Draft vs Published toggle
  const [isPublished, setIsPublished] = useState(true);

  // Step 1: Identity & Pricing
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('programming');
  const [difficulty, setDifficulty] = useState('Iniciante');
  const [language, setLanguage] = useState('Português');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountPrice, setDiscountPrice] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [durationHours, setDurationHours] = useState('10');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isCompressingThumb, setIsCompressingThumb] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [brandColor, setBrandColor] = useState<'indigo' | 'cyan' | 'emerald' | 'rose' | 'amber' | 'violet' | 'slate'>('indigo');

  // Gamification & Certificate
  const [badgeTitle, setBadgeTitle] = useState('');
  const [badgeIcon, setBadgeIcon] = useState<'trophy' | 'flame' | 'sparkles' | 'star' | 'shield' | 'award'>('award');
  const [badgeRarity, setBadgeRarity] = useState<'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'>('gold');
  const [courseCompletionXp, setCourseCompletionXp] = useState(500);

  const [certificateTitle, setCertificateTitle] = useState('Certificado de Conclusão e Competências');
  const [certificateInstructorSignature, setCertificateInstructorSignature] = useState(user?.name || '');
  const [certificateOrg, setCertificateOrg] = useState('LearnSpace Academy');
  const [certificateCustomMessage, setCertificateCustomMessage] = useState('Por ter concluído com sucesso todos os módulos teóricos, projetos práticos e avaliações.');
  const [certificateHasQrCode, setCertificateHasQrCode] = useState(true);

  // Step 2: Live Calls Settings
  const [defaultCallMode, setDefaultCallMode] = useState<'open' | 'stage' | 'qa'>('open');
  const [allowStudentScreenShare, setAllowStudentScreenShare] = useState(true);
  const [allowStudentCamera, setAllowStudentCamera] = useState(true);
  const [step2SubTab, setStep2SubTab] = useState<'channels' | 'calls' | 'roles'>('channels');

  // Step 2: Channels (clean default structure)
  const [channels, setChannels] = useState<ChannelItem[]>([
    {
      id: 'ch-anuncios',
      name: 'anuncios',
      type: 'text',
      accessMode: 'announcement',
      topic: 'Comunicados e avisos oficiais emitidos pelo instrutor e equipa pedagógica.',
      guidingQuestion: '',
      guidelines: 'Canal informativo reservado para publicações da equipa.',
    },
    {
      id: 'ch-geral',
      name: 'geral',
      type: 'text',
      accessMode: 'discussion',
      topic: 'Apresentações, convívio e debates gerais sobre os temas do curso.',
      guidingQuestion: 'Qual é o seu principal objetivo ao concluir este curso?',
      guidelines: 'Mantenha o respeito e uma comunicação colaborativa.',
    },
    {
      id: 'ch-duvidas',
      name: 'duvidas-aulas',
      type: 'qa',
      accessMode: 'qa',
      topic: 'Espaço dedicado a colocar questões e tirar dúvidas técnicas com suporte da turma.',
      guidingQuestion: 'Em que exercício ou lição encontrou dificuldade?',
      guidelines: 'Descreva a dúvida e inclua capturas ou blocos de código se aplicável.',
    },
    {
      id: 'ch-mentoria',
      name: 'sala-ao-vivo',
      type: 'voice',
      voiceMode: 'open',
      topic: 'Sala ao vivo para estudo coletivo, mentoria e transmissão de ecrã.',
      guidingQuestion: 'Que lição estão a rever em grupo?',
      guidelines: 'Mantenha o microfone silenciado quando não estiver a falar.',
    },
  ]);

  const [expandedChannelIds, setExpandedChannelIds] = useState<Set<string>>(new Set());

  // Step 2: Course Roles & Permissions (Custom Rules)
  const [customRoles, setCustomRoles] = useState<CourseRoleItem[]>([
    {
      id: 'role-instructor',
      name: 'Instrutor',
      color: 'indigo',
      canPostAnnouncements: true,
      canSpeakInStage: true,
      canShareScreen: true,
      canModerateChat: true,
      canManageVoice: true,
      isSystem: true
    },
    {
      id: 'role-tutor',
      name: 'Tutor / Moderador',
      color: 'emerald',
      canPostAnnouncements: true,
      canSpeakInStage: true,
      canShareScreen: true,
      canModerateChat: true,
      canManageVoice: true,
      isSystem: false
    },
    {
      id: 'role-monitor',
      name: 'Monitor de Dúvidas',
      color: 'amber',
      canPostAnnouncements: false,
      canSpeakInStage: true,
      canShareScreen: false,
      canModerateChat: false,
      canManageVoice: false,
      isSystem: false
    },
    {
      id: 'role-student',
      name: 'Estudante',
      color: 'zinc',
      canPostAnnouncements: false,
      canSpeakInStage: false,
      canShareScreen: true,
      canModerateChat: false,
      canManageVoice: false,
      isSystem: true
    }
  ]);

  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState<CourseRoleItem['color']>('indigo');
  const [newRoleAnnouncements, setNewRoleAnnouncements] = useState(false);
  const [newRoleSpeakStage, setNewRoleSpeakStage] = useState(true);
  const [newRoleShareScreen, setNewRoleShareScreen] = useState(true);
  const [newRoleModerateChat, setNewRoleModerateChat] = useState(false);
  const [newRoleManageVoice, setNewRoleManageVoice] = useState(false);

  // Step 3: Modules & Lessons (starts clean and professional)
  const [modules, setModules] = useState<ModuleItem[]>([]);

  // Toggle channel accordion
  const toggleChannelExpand = (id: string) => {
    setExpandedChannelIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Add new channel
  const handleAddChannel = (type: 'text' | 'voice' | 'qa') => {
    soundEffects.play('click');
    const count = channels.filter(c => c.type === type).length + 1;
    const newChan: ChannelItem = {
      id: `ch-${Date.now()}`,
      name: type === 'voice' ? `sala-ao-vivo-${count}` : `novo-canal-${count}`,
      type,
      accessMode: type === 'text' ? 'discussion' : type === 'qa' ? 'qa' : undefined,
      voiceMode: type === 'voice' ? defaultCallMode : undefined,
      topic: 'Canal de interação da comunidade.',
      guidingQuestion: '',
      guidelines: 'Comunique de forma cordial e profissional.',
    };
    setChannels(prev => [...prev, newChan]);
    toggleChannelExpand(newChan.id);
  };

  const handleUpdateChannel = (id: string, field: keyof ChannelItem, value: any) => {
    setChannels(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (field === 'name') {
        const formatted = String(value).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
        return { ...c, name: formatted };
      }
      return { ...c, [field]: value };
    }));
  };

  const handleRemoveChannel = (id: string) => {
    soundEffects.play('click');
    if (channels.length <= 1) {
      toast({ title: 'Atenção', message: 'O curso deve conter pelo menos 1 canal.', type: 'error' });
      return;
    }
    setChannels(prev => prev.filter(c => c.id !== id));
  };

  // Roles management
  const handleCreateCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const newRole: CourseRoleItem = {
      id: `role-${Date.now()}`,
      name: newRoleName.trim(),
      color: newRoleColor,
      canPostAnnouncements: newRoleAnnouncements,
      canSpeakInStage: newRoleSpeakStage,
      canShareScreen: newRoleShareScreen,
      canModerateChat: newRoleModerateChat,
      canManageVoice: newRoleManageVoice,
      isSystem: false
    };

    setCustomRoles(prev => [...prev, newRole]);
    setNewRoleName('');
    setShowNewRoleModal(false);
    toast({ title: 'Cargo Criado', message: `O cargo "${newRole.name}" foi adicionado com sucesso.`, type: 'success' });
  };

  const handleRemoveRole = (roleId: string) => {
    setCustomRoles(prev => prev.filter(r => r.id !== roleId));
    toast({ title: 'Cargo Removido', message: 'O cargo foi removido da configuração do curso.', type: 'info' });
  };

  // Modules & Lessons management
  const handleAddModule = () => {
    soundEffects.play('click');
    const newMod: ModuleItem = {
      id: `mod-${Date.now()}`,
      title: `Módulo ${modules.length + 1}: Novo Módulo`,
      description: '',
      dripMode: 'instant',
      dripDays: 0,
      lessons: [],
    };
    setModules(prev => [...prev, newMod]);
  };

  const handleLoadBoilerplateModules = () => {
    soundEffects.play('click');
    setModules([
      {
        id: `mod-${Date.now()}-1`,
        title: 'Módulo 1: Fundamentos & Apresentação',
        description: 'Introdução aos conceitos e configuração inicial.',
        dripMode: 'instant',
        dripDays: 0,
        lessons: [
          {
            id: `les-${Date.now()}-1`,
            title: '1.1 Boas-vindas e Visão Geral do Curso',
            type: 'video',
            durationMin: 10,
            videoUrl: '',
            content: 'Apresentação detalhada da metodologia do curso.',
            xpReward: 25,
            videoChapters: [{ id: 'vc-1', time: '00:00', title: 'Boas-vindas' }]
          },
          {
            id: `les-${Date.now()}-2`,
            title: '1.2 Guia Prático de Estudo',
            type: 'text',
            durationMin: 15,
            content: '',
            xpReward: 20,
            richArticle: {
              markdown: '### Plano de Aprendizagem\n\nAqui encontra as orientações para aproveitar este curso ao máximo.',
              calloutType: 'tip',
              calloutTitle: 'Dica do Instrutor',
              calloutText: 'Pratique diariamente e utilize as salas de mentoria ao vivo.',
              checklist: [{ id: 'cl-1', text: 'Entrar nos canais da comunidade' }]
            }
          }
        ]
      }
    ]);
    toast({ title: 'Estrutura Inicial Carregada', message: 'Módulo de exemplo adicionado. Pode editá-lo à vontade.', type: 'info' });
  };

  const handleUpdateModule = (modId: string, field: keyof ModuleItem, value: any) => {
    setModules(prev => prev.map(m => (m.id === modId ? { ...m, [field]: value } : m)));
  };

  const handleRemoveModule = (modId: string) => {
    soundEffects.play('click');
    setModules(prev => prev.filter(m => m.id !== modId));
  };

  const handleAddLesson = (modId: string, lessonType: LessonType = 'video') => {
    soundEffects.play('click');
    setModules(prev =>
      prev.map(m => {
        if (m.id !== modId) return m;
        const count = m.lessons.length + 1;
        const newLes: LessonItem = {
          id: `les-${Date.now()}`,
          title: `Aula ${count}: Nova Lição`,
          type: lessonType,
          durationMin: 15,
          videoUrl: '',
          content: '',
          xpReward: 25,
        };

        if (lessonType === 'video') {
          newLes.videoChapters = [{ id: 'vc-1', time: '00:00', title: 'Introdução' }];
        } else if (lessonType === 'code') {
          newLes.codeChallenge = {
            language: 'typescript',
            initialCode: '// Escreva a sua solução aqui\nfunction solucao() {\n  return true;\n}',
            solutionCode: 'function solucao() {\n  return true;\n}',
            instructions: 'Resolva o desafio proposto.',
            hints: ['Pense no caso base do algoritmo.']
          };
        } else if (lessonType === 'text') {
          newLes.richArticle = {
            markdown: '### Tópico da Aula\n\nIntroduza os conceitos teóricos e práticos com exemplos claros.',
            calloutType: 'tip',
            calloutTitle: 'Dica Prática',
            calloutText: 'Registe as suas notas durante o estudo.',
            checklist: [{ id: 'cl-1', text: 'Rever documentação de apoio' }]
          };
        } else if (lessonType === 'quiz') {
          newLes.quiz = {
            title: 'Questionário de Avaliação',
            description: 'Valide a sua compreensão respondendo às perguntas abaixo.',
            passingScore: 70,
            xpReward: 50,
            questions: [
              {
                id: `q-${Date.now()}`,
                type: 'single',
                question: 'Introduza aqui o enunciado da questão...',
                explanation: 'Explicação detalhada da resposta correta.',
                points: 10,
                options: [
                  { id: 'opt-1', text: 'Opção Correta', isCorrect: true },
                  { id: 'opt-2', text: 'Opção Incorreta', isCorrect: false }
                ]
              }
            ]
          };
        }

        return { ...m, lessons: [...m.lessons, newLes] };
      })
    );
  };

  const handleUpdateLesson = (modId: string, lesId: string, field: keyof LessonItem, value: any) => {
    setModules(prev =>
      prev.map(m => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: m.lessons.map(l => {
            if (l.id !== lesId) return l;
            return { ...l, [field]: value };
          }),
        };
      })
    );
  };

  const handleRemoveLesson = (modId: string, lesId: string) => {
    soundEffects.play('click');
    setModules(prev =>
      prev.map(m => {
        if (m.id !== modId) return m;
        return { ...m, lessons: m.lessons.filter(l => l.id !== lesId) };
      })
    );
  };

  // ── Edit mode: load existing course data ─────────────────────────────────────
  useEffect(() => {
    if (!isEditMode || !editCourseId) return;

    api.getCreatorCourse(editCourseId).then(course => {
      if (!course) return;
      setTitle(course.title || '');
      setDescription(course.description || '');
      setCategory(course.category || 'programming');
      setDifficulty(course.difficulty || 'Iniciante');
      setLanguage(course.language || 'Português');
      setIsFree(course.isFree !== false);
      setPrice(String(course.price || ''));
      setDurationHours(String(course.durationHours || 10));
      setThumbnailUrl(course.thumbnailUrl || '');
      setBrandColor(course.brandColor || 'indigo');
      setIsPublished(course.isPublished !== false);
      setDefaultCallMode(course.defaultCallMode || 'open');
      setAllowStudentScreenShare(course.allowStudentScreenShare !== false);
      setAllowStudentCamera(course.allowStudentCamera !== false);

      if (Array.isArray(course.modules) && course.modules.length > 0) {
        setModules(course.modules.map((m: any) => ({
          id: m.id,
          title: m.title || '',
          description: m.description || '',
          dripMode: m.dripMode || 'instant',
          dripDays: m.dripDays || 0,
          lessons: (m.lessons || []).map((l: any) => ({
            id: l.id,
            title: l.title || '',
            type: l.type || 'video',
            durationMin: l.durationMin || 15,
            videoUrl: l.videoUrl || '',
            content: typeof l.content === 'string' ? l.content : '',
            xpReward: l.xpReward || 25,
          })),
        })));
      }

      if (Array.isArray(course.channels) && course.channels.length > 0) {
        setChannels(course.channels.map((ch: any) => ({
          id: ch.id,
          name: ch.name || '',
          type: ch.type || 'text',
          accessMode: ch.accessMode || 'discussion',
          voiceMode: ch.voiceMode || 'open',
          topic: ch.topic || '',
          guidingQuestion: ch.guidingQuestion || '',
          guidelines: ch.guidelines || '',
        })));
      }
    }).catch(() => {
      toast({ title: 'Erro', message: 'Não foi possível carregar o curso para edição.', type: 'error' });
    });
  }, [editCourseId, isEditMode]);

  // Submit / Publish Course
  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Ficheiro inválido', message: 'Selecione uma imagem (JPG, PNG, WebP).', type: 'error' });
      return;
    }
    setIsCompressingThumb(true);
    try {
      // Client-side compression without any library
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            const max = 1200;
            if (width > max || height > max) {
              if (width > height) { height = Math.round((height / width) * max); width = max; }
              else { width = Math.round((width / height) * max); height = max; }
            }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('canvas')); return; }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          };
          img.onerror = reject;
          img.src = ev.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setThumbnailUrl(base64);
    } catch {
      toast({ title: 'Erro', message: 'Não foi possível processar a imagem.', type: 'error' });
    } finally {
      setIsCompressingThumb(false);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }
  };

  const handlePublish = async (publish = true) => {
    if (!title.trim()) {
      toast({ title: 'Campo Obrigatório', message: 'Por favor, introduza o título do curso no Passo 1.', type: 'error' });
      setActiveStep(1);
      return;
    }

    setIsSubmitting(true);
    soundEffects.play('success');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || 'Curso completo com comunidade integrada, salas ao vivo e acompanhamento contínuo.',
        category,
        difficulty,
        language,
        price: isFree ? 0 : Number(price || 0),
        isFree,
        isPublished: publish,
        hasDiscount,
        discountPrice: Number(discountPrice || 0),
        couponCode: couponCode.trim(),
        durationHours: Number(durationHours || 10),
        thumbnailUrl: thumbnailUrl.trim() || PRESET_THUMBNAILS[0].url,
        brandColor,
        defaultCallMode,
        allowStudentScreenShare,
        allowStudentCamera,
        badge: {
          title: badgeTitle.trim() || `Certificado ${title.trim()}`,
          icon: badgeIcon,
          rarity: badgeRarity,
          xpReward: courseCompletionXp
        },
        certificate: {
          title: certificateTitle,
          instructorSignature: certificateInstructorSignature.trim() || user?.name || 'Instrutor',
          organization: certificateOrg,
          customMessage: certificateCustomMessage,
          hasQrCode: certificateHasQrCode
        },
        channels,
        customRoles,
        modules,
      };

      let resultId: string;

      if (isEditMode && editCourseId) {
        await api.updateCourse(editCourseId, payload);
        resultId = editCourseId;
      } else {
        const result = await api.createCourse(payload);
        resultId = result.id || result.slug;
      }

      toast({
        title: publish ? (isEditMode ? 'Curso Atualizado!' : 'Curso Publicado!') : 'Rascunho Guardado!',
        message: publish
          ? (isEditMode ? 'As alterações foram guardadas e publicadas.' : 'O curso está agora visível para os estudantes.')
          : 'O curso foi guardado como rascunho.',
        type: 'success'
      });
      navigate(isEditMode ? '/creator' : `/learn/${resultId}`);
    } catch (err: any) {
      toast({ title: 'Erro ao Publicar', message: err.message || 'Não foi possível publicar o curso.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBadgeIcon = (iconName: string, className = "w-5 h-5") => {
    switch (iconName) {
      case 'trophy': return <Trophy className={className} />;
      case 'flame': return <Flame className={className} />;
      case 'sparkles': return <Sparkles className={className} />;
      case 'star': return <Star className={className} />;
      case 'shield': return <Shield className={className} />;
      default: return <Award className={className} />;
    }
  };

  const getRoleBadgeClasses = (color: CourseRoleItem['color']) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'amber': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'purple': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'cyan': return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      case 'rose': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'zinc': return 'bg-slate-500/10 text-slate-600 dark:text-zinc-400 border-slate-500/20';
      default: return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0d12] text-slate-900 dark:text-zinc-100 pb-24 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#151720]/95 backdrop-blur-xl border-b border-slate-200 dark:border-[#222636] py-3.5 px-4 sm:px-8 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <Link 
              to="/creator" 
              className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1e2230] transition-colors"
              title="Voltar ao Painel do Criador"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {isEditMode ? 'Editar Curso' : 'Criador de Cursos Profissional'}
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {isEditMode ? 'Modo Edição' : 'Estúdio do Professor'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Estruture lições, canais informativos e de discussão, regras de chamadas e cargos da turma.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Eye className="w-4 h-4" />}
              onClick={() => {
                soundEffects.play('click');
                setPreviewOpen(true);
              }}
              className="font-bold cursor-pointer rounded-xl text-xs bg-slate-100 dark:bg-[#202433] hover:bg-slate-200 dark:hover:bg-[#2b3144] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-[#2b3144]"
            >
              Pré-visualizar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FileEdit className="w-4 h-4" />}
              isLoading={isSubmitting}
              onClick={() => handlePublish(false)}
              className="font-bold cursor-pointer rounded-xl text-xs border border-slate-200 dark:border-[#2b3144]"
            >
              Guardar Rascunho
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send className="w-4 h-4" />}
              isLoading={isSubmitting}
              onClick={() => handlePublish(true)}
              className="font-black rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              Publicar Curso
            </Button>
          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8">

        {/* Step Indicator */}
        <nav aria-label="Progresso da criação do curso" className="mb-8">
          <div className="bg-white dark:bg-[#151720] p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-w-4xl mx-auto border border-slate-200 dark:border-[#222636] shadow-xs transition-colors">
            {[
              { num: 1, label: '1. Identidade & Marca' },
              { num: 2, label: '2. Canais & Permissões' },
              { num: 3, label: '3. Aulas & Módulos' },
              { num: 4, label: '4. Revisão & Publicação' },
            ].map((st) => {
              const isCurrent = activeStep === st.num;
              return (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => { soundEffects.play('click'); setActiveStep(st.num as any); }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 select-none ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-black'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1e2230]'
                  }`}
                >
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ======================================================================= */}
        {/* PASSO 1: IDENTIDADE, MARCA, PREÇO E CERTIFICAÇÃO */}
        {/* ======================================================================= */}
        {activeStep === 1 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            
            {/* Informações Principais */}
            <Card className="p-6 bg-white dark:bg-[#151720] border-slate-200 dark:border-[#222636] rounded-3xl flex flex-col gap-5 shadow-xs transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222636]">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Identidade do Curso
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Título, descrição, categoria e carga horária.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Título do Curso *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: Desenvolvimento Web Moderno com React & Node.js"
                    className="bg-white dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Descrição do Curso</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Apresente os objetivos, competências a desenvolver e o que os estudantes vão dominar..."
                    className="bg-white dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Área / Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-white dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none cursor-pointer transition-colors"
                  >
                    <option value="programming">Programação & Engenharia de Software</option>
                    <option value="design">UI/UX Design & Produto</option>
                    <option value="ai">Inteligência Artificial & Data Science</option>
                    <option value="business">Negócios, Gestão & Liderança</option>
                    <option value="marketing">Marketing Digital & Comunicação</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Nível de Dificuldade</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="bg-white dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none cursor-pointer transition-colors"
                  >
                    <option value="Iniciante">Iniciante (Sem pré-requisitos)</option>
                    <option value="Intermédio">Intermédio (Conhecimentos prévios)</option>
                    <option value="Avançado">Avançado (Especialização)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Imagem de Capa</label>
                  {/* Preview */}
                  {thumbnailUrl && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-[#2b3044] mb-1">
                      {isCompressingThumb ? (
                        <div className="absolute inset-0 bg-slate-100 dark:bg-[#181a24] flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        </div>
                      ) : (
                        <img
                          src={thumbnailUrl}
                          alt="Capa do curso"
                          className="w-full h-full object-cover"
                          onError={() => setThumbnailUrl('')}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setThumbnailUrl('')}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#202433] hover:bg-slate-200 dark:hover:bg-[#2b3144] text-slate-700 dark:text-zinc-300 text-xs font-bold border border-slate-200 dark:border-[#2b3144] cursor-pointer transition-colors shrink-0"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Carregar
                    </button>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleThumbnailFileChange}
                    />
                    <input
                      type="text"
                      value={thumbnailUrl.startsWith('data:') ? '' : thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="Ou cole um URL de imagem..."
                      className="flex-1 bg-white dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none font-mono placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-colors"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">Sugestões rápidas:</span>
                    {PRESET_THUMBNAILS.map((pt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setThumbnailUrl(pt.url)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#202433] hover:bg-slate-200 dark:hover:bg-[#2b3144] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#2b3144] cursor-pointer transition-colors"
                      >
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Carga Horária Estimada (Horas)</label>
                  <input
                    type="number"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="bg-white dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </Card>

            {/* Visual Branding & Pricing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Tema Visual da Marca */}
              <Card className="p-6 bg-white dark:bg-[#151720] border-slate-200 dark:border-[#222636] rounded-3xl flex flex-col gap-4 shadow-xs transition-colors">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#222636]">
                  <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Cor de Destaque do Curso</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Personalize o tom dos badges, etiquetas e cartões de progresso.</p>

                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { id: 'indigo', label: 'Índigo', color: 'bg-indigo-600' },
                    { id: 'cyan', label: 'Ciano', color: 'bg-cyan-500' },
                    { id: 'emerald', label: 'Esmeralda', color: 'bg-emerald-500' },
                    { id: 'rose', label: 'Rosa', color: 'bg-rose-500' },
                    { id: 'amber', label: 'Âmbar', color: 'bg-amber-500' },
                    { id: 'violet', label: 'Violeta', color: 'bg-purple-600' },
                    { id: 'slate', label: 'Obsidiana', color: 'bg-zinc-600' },
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setBrandColor(c.id as any)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        brandColor === c.id
                          ? 'border-indigo-600 dark:border-white bg-indigo-50/50 dark:bg-[#202433] shadow-sm'
                          : 'border-slate-200 dark:border-[#2b3144] bg-slate-50 dark:bg-[#181a24] hover:border-slate-400'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${c.color}`} />
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">{c.label}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Preçário */}
              <Card className="p-6 bg-white dark:bg-[#151720] border-slate-200 dark:border-[#222636] rounded-3xl flex flex-col gap-4 shadow-xs transition-colors">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#222636]">
                  <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Acesso & Preço</h3>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFree(true)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isFree ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' : 'bg-slate-50 dark:bg-[#181a24] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-[#2b3044]'
                    }`}
                  >
                    100% Gratuito
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFree(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      !isFree ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' : 'bg-slate-50 dark:bg-[#181a24] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-[#2b3044]'
                    }`}
                  >
                    Curso Pago
                  </button>
                </div>

                {!isFree && (
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-400">Preço Regular (€)</label>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="ex: 49"
                          className="w-full bg-white dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-400">Preço com Desconto (€)</label>
                        <input
                          type="number"
                          value={discountPrice}
                          onChange={(e) => setDiscountPrice(e.target.value)}
                          placeholder="ex: 29"
                          className="w-full bg-white dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-xl px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>

            </div>

            {/* Certificação & Badge */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Badge Designer */}
              <Card className="p-6 bg-white dark:bg-[#151720] border-slate-200 dark:border-[#222636] rounded-3xl flex flex-col gap-4 shadow-xs transition-colors">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222636]">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Medalha de Conclusão</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                    +{courseCompletionXp} XP
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-400">Título da Medalha</label>
                    <input
                      type="text"
                      value={badgeTitle}
                      onChange={(e) => setBadgeTitle(e.target.value)}
                      placeholder="ex: Especialista em React"
                      className="w-full bg-white dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-400">Raridade</label>
                    <select
                      value={badgeRarity}
                      onChange={(e) => setBadgeRarity(e.target.value as any)}
                      className="w-full bg-white dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="bronze">Bronze (Iniciante)</option>
                      <option value="silver">Prata (Intermédio)</option>
                      <option value="gold">Ouro (Avançado)</option>
                      <option value="platinum">Platina (Especialista)</option>
                      <option value="diamond">Diamante (Mestre)</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Certificate Designer */}
              <Card className="p-6 bg-white dark:bg-[#151720] border-slate-200 dark:border-[#222636] rounded-3xl flex flex-col gap-4 shadow-xs transition-colors">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#222636]">
                  <FileBadge className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Certificado Oficial</h3>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-400">Assinatura do Instrutor</label>
                    <input
                      type="text"
                      value={certificateInstructorSignature}
                      onChange={(e) => setCertificateInstructorSignature(e.target.value)}
                      placeholder={user?.name || 'O seu nome ou título profissional'}
                      className="w-full bg-white dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-400">Instituição / Academia</label>
                    <input
                      type="text"
                      value={certificateOrg}
                      onChange={(e) => setCertificateOrg(e.target.value)}
                      placeholder="LearnSpace Academy"
                      className="w-full bg-white dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </Card>

            </div>

            {/* Next step */}
            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                onClick={() => { soundEffects.play('click'); setActiveStep(2); }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-3 rounded-xl shadow-md cursor-pointer"
              >
                Continuar para Canais & Permissões
              </Button>
            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* PASSO 2: CANAIS, REGRAS DE CHAMADAS & CARGOS / PERMISSÕES */}
        {/* ======================================================================= */}
        {activeStep === 2 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            
            {/* Step 2 Subtabs */}
            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-[#151720] border border-slate-200 dark:border-[#222636] rounded-2xl w-fit shadow-xs">
              <button
                type="button"
                onClick={() => setStep2SubTab('channels')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  step2SubTab === 'channels'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Hash className="w-4 h-4" />
                <span>Canais da Turma ({channels.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setStep2SubTab('calls')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  step2SubTab === 'calls'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>Regras de Chamadas ao Vivo</span>
              </button>

              <button
                type="button"
                onClick={() => setStep2SubTab('roles')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  step2SubTab === 'roles'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Cargos & Permissões ({customRoles.length})</span>
              </button>
            </div>

            {/* SUBTAB 1: CANAIS */}
            {step2SubTab === 'channels' && (
              <Card className="p-6 bg-white dark:bg-[#151720] border-slate-200 dark:border-[#222636] rounded-3xl flex flex-col gap-5 shadow-xs transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#222636]">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Hash className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Canais de Texto e Fóruns da Comunidade
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      Configure quais canais são puramente informativos (apenas leitura) e quais permitem discussão aberta.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAddChannel('text')}
                      leftIcon={<Plus className="w-4 h-4" />}
                      className="text-xs bg-slate-100 dark:bg-[#202433] text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-[#2b3144]"
                    >
                      + Canal de Texto
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleAddChannel('voice')}
                      leftIcon={<Volume2 className="w-4 h-4" />}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      + Sala ao Vivo
                    </Button>
                  </div>
                </div>

                {/* Channel List */}
                <div className="flex flex-col gap-3">
                  {channels.map((chan) => {
                    const isVoice = chan.type === 'voice';
                    const isAnnouncement = chan.accessMode === 'announcement';

                    return (
                      <div 
                        key={chan.id} 
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-3 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#222636] border border-slate-200 dark:border-[#2b3144] flex items-center justify-center shrink-0">
                              {isVoice ? (
                                <Volume2 className="w-4 h-4 text-emerald-500" />
                              ) : isAnnouncement ? (
                                <Megaphone className="w-4 h-4 text-indigo-500" />
                              ) : (
                                <Hash className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <input
                              type="text"
                              value={chan.name}
                              onChange={(e) => handleUpdateChannel(chan.id, 'name', e.target.value)}
                              className="bg-white dark:bg-[#141620] border border-slate-300 dark:border-[#2b3044] rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                            />
                            {isAnnouncement ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                Apenas Informativo
                              </span>
                            ) : isVoice ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                                Sala de Voz / Vídeo
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold">
                                Discussão Aberta
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleChannelExpand(chan.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#202434] transition-colors cursor-pointer"
                            >
                              {expandedChannelIds.has(chan.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveChannel(chan.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Remover canal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {expandedChannelIds.has(chan.id) && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-[#222636]">
                            {!isVoice ? (
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 dark:text-zinc-400">Modo de Envio</label>
                                <select
                                  value={chan.accessMode || 'discussion'}
                                  onChange={(e) => handleUpdateChannel(chan.id, 'accessMode', e.target.value)}
                                  className="w-full bg-white dark:bg-[#141620] border border-slate-300 dark:border-[#2b3044] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-medium cursor-pointer"
                                >
                                  <option value="discussion">Discussão Aberta (Todos podem publicar)</option>
                                  <option value="announcement">Apenas Leitura / Informativo (Apenas Instrutor)</option>
                                  <option value="qa">Fila de Dúvidas (Perguntas & Respostas)</option>
                                </select>
                              </div>
                            ) : (
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 dark:text-zinc-400">Formato da Sala ao Vivo</label>
                                <select
                                  value={chan.voiceMode || defaultCallMode}
                                  onChange={(e) => handleUpdateChannel(chan.id, 'voiceMode', e.target.value)}
                                  className="w-full bg-white dark:bg-[#141620] border border-slate-300 dark:border-[#2b3044] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-medium cursor-pointer"
                                >
                                  <option value="open">Modo Aberto (Todos falam livremente)</option>
                                  <option value="stage">Modo Palco (Alunos entram silenciados)</option>
                                  <option value="qa">Modo Dúvidas (Fila de intervenção)</option>
                                </select>
                              </div>
                            )}

                            <div>
                              <label className="text-[10px] font-bold text-slate-600 dark:text-zinc-400">Tópico / Descrição Curta</label>
                              <input
                                type="text"
                                value={chan.topic}
                                onChange={(e) => handleUpdateChannel(chan.id, 'topic', e.target.value)}
                                placeholder="ex: Avisos oficiais da coordenação"
                                className="w-full bg-white dark:bg-[#141620] border border-slate-300 dark:border-[#2b3044] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-600 dark:text-zinc-400">Orientações de Convivência</label>
                              <input
                                type="text"
                                value={chan.guidelines}
                                onChange={(e) => handleUpdateChannel(chan.id, 'guidelines', e.target.value)}
                                placeholder="ex: Seja cordial e objetivo"
                                className="w-full bg-white dark:bg-[#141620] border border-slate-300 dark:border-[#2b3044] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* SUBTAB 2: REGRAS DE CHAMADAS AO VIVO */}
            {step2SubTab === 'calls' && (
              <Card className="p-6 bg-white dark:bg-[#151720] border-slate-200 dark:border-[#222636] rounded-3xl flex flex-col gap-6 shadow-xs transition-colors">
                <div className="pb-3 border-b border-slate-200 dark:border-[#222636]">
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Regras das Salas ao Vivo (Voz & Vídeo)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Defina se todos os participantes podem falar livremente ou se a sala funciona como palco com intervenção controlada.
                  </p>
                </div>

                {/* Main Call Mode Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'open',
                      title: 'Modo Aberto (Convívio Livre)',
                      desc: 'Todos os alunos podem desmutar o microfone livremente e interagir a qualquer momento.',
                      icon: Volume2,
                      badge: 'Ideal para debates'
                    },
                    {
                      id: 'stage',
                      title: 'Modo Palco (Silêncio Inicial)',
                      desc: 'Alunos entram silenciados. Para falar, levantam a mão e o professor ou moderador autoriza.',
                      icon: Radio,
                      badge: 'Ideal para aulas e palestras'
                    },
                    {
                      id: 'qa',
                      title: 'Fila de Dúvidas',
                      desc: 'Os alunos entram numa fila ordenada para esclarecimento de dúvidas pontuais.',
                      icon: HelpCircle,
                      badge: 'Ideal para mentoria'
                    }
                  ].map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => setDefaultCallMode(mode.id as any)}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 cursor-pointer transition-all ${
                        defaultCallMode === mode.id
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-md shadow-indigo-600/10 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-[#282d3e] bg-slate-50 dark:bg-[#181a24] hover:border-slate-400'
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <mode.icon className={`w-5 h-5 ${defaultCallMode === mode.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-[#252a3b] text-slate-700 dark:text-zinc-300">
                            {mode.badge}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs">{mode.title}</h3>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">{mode.desc}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-[#252a3b] flex items-center justify-between text-[11px] font-bold">
                        <span className={defaultCallMode === mode.id ? 'text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-400'}>
                          {defaultCallMode === mode.id ? 'Selecionado' : 'Escolher este modo'}
                        </span>
                        {defaultCallMode === mode.id && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Call Media Permissions */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-4">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                    Permissões de Média dos Estudantes
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-[#141620] border border-slate-200 dark:border-[#2b3144] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowStudentScreenShare}
                        onChange={(e) => setAllowStudentScreenShare(e.target.checked)}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Permitir partilha de ecrã para alunos</p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          Se desativado, apenas instrutores, tutores ou moderadores podem partilhar ecrã.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-[#141620] border border-slate-200 dark:border-[#2b3144] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowStudentCamera}
                        onChange={(e) => setAllowStudentCamera(e.target.checked)}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Permitir câmara de vídeo para alunos</p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          Os estudantes podem ativar a sua webcam durante as sessões de estudo.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </Card>
            )}

            {/* SUBTAB 3: CARGOS & REGRAS DE PERMISSÕES */}
            {step2SubTab === 'roles' && (
              <Card className="p-6 bg-white dark:bg-[#151720] border-slate-200 dark:border-[#222636] rounded-3xl flex flex-col gap-6 shadow-xs transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#222636]">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Cargos & Regras de Permissões da Turma
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      Crie regras personalizadas e atribua cargos específicos aos membros para controlar quem fala no palco, modera e publica comunicados.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setShowNewRoleModal(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                  >
                    + Criar Cargo Personalizado
                  </Button>
                </div>

                {/* Roles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customRoles.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#282d3e] flex flex-col justify-between gap-3 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-[#252a3b]">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getRoleBadgeClasses(r.color)}`}>
                              {r.name}
                            </span>
                            {r.isSystem && (
                              <span className="text-[10px] text-slate-400 font-medium">(Padrão)</span>
                            )}
                          </div>

                          {!r.isSystem && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRole(r.id)}
                              className="p-1 rounded-md text-red-500 hover:bg-red-500/10 cursor-pointer"
                              title="Remover cargo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Permissions Summary Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-3 text-[10px] font-bold">
                          {r.canPostAnnouncements && (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              Publicar em Informativos
                            </span>
                          )}
                          {r.canSpeakInStage && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Falar no Palco Livremente
                            </span>
                          )}
                          {r.canShareScreen && (
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Partilhar Ecrã
                            </span>
                          )}
                          {r.canManageVoice && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Gerir Chamadas & Palco
                            </span>
                          )}
                          {r.canModerateChat && (
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              Moderar Conversas
                            </span>
                          )}
                          {!r.canPostAnnouncements && !r.canSpeakInStage && !r.canManageVoice && !r.canModerateChat && (
                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#252a3b] text-slate-600 dark:text-zinc-400">
                              Acesso Padrão de Estudante
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="secondary"
                onClick={() => { soundEffects.play('click'); setActiveStep(1); }}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="bg-white dark:bg-[#181a24] border-slate-300 dark:border-[#2b3144] text-slate-700 dark:text-zinc-200"
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                onClick={() => { soundEffects.play('click'); setActiveStep(3); }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-3 rounded-xl shadow-md cursor-pointer"
              >
                Continuar para Aulas & Módulos
              </Button>
            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* PASSO 3: MÓDULOS & LIÇÕES (LIMPO E PROFISSIONAL) */}
        {/* ======================================================================= */}
        {activeStep === 3 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#151720] p-5 rounded-3xl border border-slate-200 dark:border-[#222636] shadow-xs transition-colors">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Estrutura Curricular & Lições
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Adicione módulos, lições em vídeo, artigos explicativos, exercícios de código e questionários.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {modules.length === 0 && (
                  <Button
                    variant="secondary"
                    onClick={handleLoadBoilerplateModules}
                    className="bg-slate-100 dark:bg-[#202433] text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-[#2b3144] text-xs font-bold"
                  >
                    Carregar Exemplo Base
                  </Button>
                )}
                <Button
                  onClick={handleAddModule}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  + Novo Módulo
                </Button>
              </div>
            </div>

            {/* Empty State */}
            {modules.length === 0 ? (
              <Card className="p-12 text-center bg-white dark:bg-[#151720] border-slate-200 dark:border-[#222636] rounded-3xl flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Nenhum módulo criado ainda</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md">
                  O curso está limpo. Comece a construir o programa pedagógico adicionando o seu primeiro módulo.
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <Button
                    variant="primary"
                    onClick={handleAddModule}
                    leftIcon={<Plus className="w-4 h-4" />}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                  >
                    + Criar Primeiro Módulo
                  </Button>
                </div>
              </Card>
            ) : (
              modules.map((mod, mIdx) => (
                <Card key={mod.id} className="p-6 bg-white dark:bg-[#151720] border-slate-200 dark:border-[#222636] rounded-3xl flex flex-col gap-5 shadow-xs transition-colors">
                  
                  {/* Module Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#222636]">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={mod.title}
                        onChange={(e) => handleUpdateModule(mod.id, 'title', e.target.value)}
                        placeholder="Nome do Módulo..."
                        className="bg-white dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-xl px-3.5 py-2 text-sm font-black text-slate-900 dark:text-white w-full max-w-md"
                      />
                      <input
                        type="text"
                        value={mod.description}
                        onChange={(e) => handleUpdateModule(mod.id, 'description', e.target.value)}
                        placeholder="Breve descrição dos tópicos do módulo..."
                        className="bg-transparent border-0 text-xs text-slate-500 dark:text-zinc-400 mt-1 w-full focus:outline-none placeholder:text-slate-400"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={mod.dripMode || 'instant'}
                        onChange={(e) => handleUpdateModule(mod.id, 'dripMode', e.target.value)}
                        className="bg-white dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-zinc-300 font-bold cursor-pointer"
                        title="Regra de desbloqueio"
                      >
                        <option value="instant">Desbloqueio Imediato</option>
                        <option value="sequential">Sequencial (Pré-requisito)</option>
                        <option value="drip">Programado por Dias (Drip)</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveModule(mod.id)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Eliminar Módulo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Lessons List in Module */}
                  <div className="flex flex-col gap-3">
                    {mod.lessons.length === 0 ? (
                      <p className="text-center py-4 text-xs text-slate-400 dark:text-zinc-500">
                        Nenhuma aula adicionada neste módulo. Escolha um tipo abaixo.
                      </p>
                    ) : (
                      mod.lessons.map((les, lIdx) => (
                        <div key={les.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-3 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-3">
                              <span className="w-6 h-6 rounded-lg bg-white dark:bg-[#202433] border border-slate-200 dark:border-[#2b3144] text-slate-700 dark:text-zinc-300 text-xs font-bold flex items-center justify-center shrink-0">
                                {lIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={les.title}
                                onChange={(e) => handleUpdateLesson(mod.id, les.id, 'title', e.target.value)}
                                className="bg-white dark:bg-[#141620] border border-slate-300 dark:border-[#2b3044] rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white flex-1"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={les.type}
                                onChange={(e) => handleUpdateLesson(mod.id, les.id, 'type', e.target.value as any)}
                                className="bg-white dark:bg-[#141620] border border-slate-300 dark:border-[#2b3044] rounded-lg px-2.5 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer"
                              >
                                <option value="video">Vídeo & Capítulos</option>
                                <option value="text">Artigo Técnico</option>
                                <option value="code">Desafio de Código</option>
                                <option value="quiz">Questionário / Avaliação</option>
                                <option value="resource">Pacote de Recursos</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => handleRemoveLesson(mod.id, les.id)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Lesson Type Specific Editor */}
                          {les.type === 'video' && (
                            <div className="p-3 rounded-xl bg-white dark:bg-[#141620] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={les.videoUrl || ''}
                                  onChange={(e) => handleUpdateLesson(mod.id, les.id, 'videoUrl', e.target.value)}
                                  placeholder="URL do Vídeo (ex: https://... ou YouTube / Vimeo)"
                                  className="flex-1 bg-slate-50 dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                                />
                                <input
                                  type="number"
                                  value={les.durationMin}
                                  onChange={(e) => handleUpdateLesson(mod.id, les.id, 'durationMin', Number(e.target.value))}
                                  placeholder="Minutos"
                                  className="w-24 bg-slate-50 dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white text-center"
                                />
                              </div>
                            </div>
                          )}

                          {les.type === 'code' && (
                            <div className="p-3 rounded-xl bg-white dark:bg-[#141620] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                  <Code2 className="w-3.5 h-3.5" />
                                  Sandbox de Código ({les.codeChallenge?.language || 'typescript'})
                                </span>
                              </div>
                              <textarea
                                value={les.codeChallenge?.initialCode || ''}
                                onChange={(e) => {
                                  const curr = les.codeChallenge || { language: 'typescript', initialCode: '', solutionCode: '', instructions: '', hints: [] };
                                  handleUpdateLesson(mod.id, les.id, 'codeChallenge', { ...curr, initialCode: e.target.value });
                                }}
                                rows={3}
                                className="bg-slate-50 dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-lg p-2.5 font-mono text-xs text-emerald-600 dark:text-emerald-300 focus:outline-none resize-none"
                                placeholder="// Código inicial para os alunos..."
                              />
                            </div>
                          )}

                          {les.type === 'text' && (
                            <div className="p-3 rounded-xl bg-white dark:bg-[#141620] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-2">
                              <textarea
                                value={les.richArticle?.markdown || les.content}
                                onChange={(e) => {
                                  const curr = les.richArticle || { markdown: '', calloutType: 'tip', calloutTitle: 'Dica', calloutText: '', checklist: [] };
                                  handleUpdateLesson(mod.id, les.id, 'richArticle', { ...curr, markdown: e.target.value });
                                }}
                                rows={2}
                                className="bg-slate-50 dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-lg p-2 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none resize-none"
                                placeholder="Conteúdo explicativo e instruções de estudo..."
                              />
                            </div>
                          )}

                          {les.type === 'quiz' && (
                            <QuizLessonEditor
                              quiz={les.quiz}
                              onChange={(updatedQuiz) => handleUpdateLesson(mod.id, les.id, 'quiz', updatedQuiz)}
                            />
                          )}

                          {les.type === 'resource' && (
                            <div className="p-3 rounded-xl bg-white dark:bg-[#141620] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-2">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Download className="w-3.5 h-3.5" />
                                Ficheiros e Documentação de Apoio
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    {/* Add Lesson buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Adicionar à aula:</span>
                      <button
                        type="button"
                        onClick={() => handleAddLesson(mod.id, 'video')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#181a24] hover:bg-slate-200 dark:hover:bg-[#222638] text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-[#262a3b] text-xs font-bold cursor-pointer"
                      >
                        + Vídeo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddLesson(mod.id, 'text')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#181a24] hover:bg-slate-200 dark:hover:bg-[#222638] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#262a3b] text-xs font-bold cursor-pointer"
                      >
                        + Artigo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddLesson(mod.id, 'code')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#181a24] hover:bg-slate-200 dark:hover:bg-[#222638] text-emerald-600 dark:text-emerald-300 border border-slate-200 dark:border-[#262a3b] text-xs font-bold cursor-pointer"
                      >
                        + Desafio de Código
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddLesson(mod.id, 'quiz')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#181a24] hover:bg-slate-200 dark:hover:bg-[#222638] text-amber-600 dark:text-amber-300 border border-slate-200 dark:border-[#262a3b] text-xs font-bold cursor-pointer"
                      >
                        + Questionário
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddLesson(mod.id, 'resource')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#181a24] hover:bg-slate-200 dark:hover:bg-[#222638] text-blue-600 dark:text-blue-300 border border-slate-200 dark:border-[#262a3b] text-xs font-bold cursor-pointer"
                      >
                        + Recursos
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="secondary"
                onClick={() => { soundEffects.play('click'); setActiveStep(2); }}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="bg-white dark:bg-[#181a24] border-slate-300 dark:border-[#262a3b] text-slate-700 dark:text-zinc-300"
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                onClick={() => { soundEffects.play('click'); setActiveStep(4); }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-3 rounded-xl shadow-md cursor-pointer"
              >
                Rever & Publicar
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* PASSO 4: REVISÃO & CONFIRMAÇÃO */}
        {/* ======================================================================= */}
        {activeStep === 4 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <Card className="p-6 bg-white dark:bg-[#151720] border-slate-200 dark:border-[#222636] rounded-3xl flex flex-col gap-6 shadow-xs transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222636]">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    Revisão e Lançamento do Curso
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Verifique os parâmetros configurados antes de disponibilizar para a comunidade de estudantes.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
                  Pronto para Publicar
                </span>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Conteúdo Programático</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{modules.length} Módulos</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{modules.reduce((acc, m) => acc + m.lessons.length, 0)} Lições</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Canais da Turma</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{channels.length} Canais</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    {channels.filter(c => c.accessMode === 'announcement').length} Informativos • {channels.filter(c => c.type === 'voice').length} Salas de Voz
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Regras de Chamadas</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white capitalize">
                    {defaultCallMode === 'stage' ? 'Modo Palco' : defaultCallMode === 'qa' ? 'Fila de Dúvidas' : 'Modo Aberto'}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                    {defaultCallMode === 'stage' ? 'Silêncio Inicial' : 'Conversação Livre'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Cargos & Permissões</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{customRoles.length} Cargos</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">Regras personalizáveis</p>
                </div>
              </div>

              {/* Course Identity Preview */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#282d3e] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={title}
                    className="w-24 h-24 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-slate-200 dark:bg-[#202433] flex items-center justify-center text-slate-400 shrink-0">
                    <BookOpen className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-slate-900 dark:text-white truncate">{title || 'Título do Curso'}</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">{description || 'Sem descrição.'}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
                      {category}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#252a3b] text-slate-700 dark:text-zinc-300 text-[10px] font-bold">
                      {difficulty}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {isFree ? 'Gratuito' : `€${price || 0}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Publish Action Buttons */}
              <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-[#222636]">
                <Button
                  variant="secondary"
                  onClick={() => { soundEffects.play('click'); setActiveStep(3); }}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  className="bg-white dark:bg-[#181a24] border-slate-300 dark:border-[#262a3b] text-slate-700 dark:text-zinc-300"
                >
                  Voltar às Aulas
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  onClick={() => handlePublish(true)}
                  leftIcon={<Check className="w-5 h-5" />}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 cursor-pointer"
                >
                  Confirmar & Publicar Curso
                </Button>
              </div>
            </Card>
          </div>
        )}

      </main>

      {/* ======================================================================= */}
      {/* MODAL: CRIAR NOVO CARGO PERSONALIZADO */}
      {/* ======================================================================= */}
      {showNewRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#151720] border border-slate-200 dark:border-[#222636] rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222636]">
              <div className="flex items-center gap-2 font-black text-base">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Criar Novo Cargo & Regras</span>
              </div>
              <button
                onClick={() => setShowNewRoleModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomRole} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Nome do Cargo *</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="ex: Co-Instrutor, Monitor Técnico, Líder de Grupo"
                  className="w-full mt-1 bg-slate-50 dark:bg-[#181a24] border border-slate-300 dark:border-[#2b3044] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Cor do Cargo</label>
                <div className="flex items-center gap-2 mt-1.5">
                  {(['indigo', 'emerald', 'amber', 'purple', 'cyan', 'rose', 'zinc'] as const).map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewRoleColor(color)}
                      className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-all flex items-center justify-center ${
                        newRoleColor === color ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                      } ${
                        color === 'indigo' ? 'bg-indigo-600' :
                        color === 'emerald' ? 'bg-emerald-500' :
                        color === 'amber' ? 'bg-amber-500' :
                        color === 'purple' ? 'bg-purple-600' :
                        color === 'cyan' ? 'bg-cyan-500' :
                        color === 'rose' ? 'bg-rose-500' : 'bg-slate-500'
                      }`}
                    >
                      {newRoleColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-2.5">
                <span className="font-bold text-slate-900 dark:text-white">Permissões Especiais:</span>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoleAnnouncements}
                    onChange={(e) => setNewRoleAnnouncements(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">Publicar em Canais Informativos</span>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">Pode emitir avisos oficiais em canais de apenas leitura.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoleSpeakStage}
                    onChange={(e) => setNewRoleSpeakStage(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">Falar no Palco sem Pedir Palavra</span>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">Em salas no Modo Palco, entra com permissão ativa de microfone.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoleShareScreen}
                    onChange={(e) => setNewRoleShareScreen(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">Partilhar Ecrã nas Sessões ao Vivo</span>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">Pode partilhar janela ou ecrã inteiro com a turma.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoleManageVoice}
                    onChange={(e) => setNewRoleManageVoice(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">Gerir Chamadas e Pedidos de Palco</span>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">Pode silenciar outros participantes e autorizar oradores.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoleModerateChat}
                    onChange={(e) => setNewRoleModerateChat(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">Moderar Mensagens do Chat</span>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">Pode fixar anúncios e eliminar mensagens impróprias.</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#222636]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowNewRoleModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Criar Cargo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: PRÉ-VISUALIZAÇÃO DO CURSO */}
      {/* ======================================================================= */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#151720] border border-slate-200 dark:border-[#222636] rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-900 dark:text-white transition-colors max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222636]">
              <div className="flex items-center gap-2 font-black text-base">
                <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Pré-visualização do Aluno</span>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#282d3e]">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{title || 'Título do Curso'}</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{description || 'Sem descrição definida.'}</p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Canais que o Aluno verá:</span>
                <div className="grid grid-cols-2 gap-2">
                  {channels.map(c => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#282d3e] flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        {c.type === 'voice' ? <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> : <Hash className="w-3.5 h-3.5 text-slate-400" />}
                        #{c.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {c.accessMode === 'announcement' ? 'Apenas Leitura' : c.type === 'voice' ? 'Voz / Vídeo' : 'Aberto'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => setPreviewOpen(false)}
              className="mt-3 w-full"
            >
              Fechar Pré-visualização
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};
