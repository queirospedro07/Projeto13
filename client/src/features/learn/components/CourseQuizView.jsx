import React, { useState } from 'react';
import { Check, X, RotateCcw, CheckCircle2, XCircle, AlertCircle, Info, Sparkles, ChevronRight, CheckSquare, Square, Clock } from 'lucide-react';
import { soundEffects } from '../../../services/soundEffects';
export const normalizeTextForGrading = text => {
  return (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
};
const DEFAULT_SAMPLE_QUESTIONS = [{
  id: 'q1',
  type: 'single',
  question: 'Qual é o principal propósito das Server Actions no ecossistema moderno do React?',
  explanation: 'As Server Actions executam mutações de dados assíncronas diretamente no servidor com total segurança de credenciais e sem expor endpoints de API REST no cliente.',
  points: 10,
  options: [{
    id: 'opt1-1',
    text: 'Executar funções assíncronas diretamente no servidor com mutação segura',
    isCorrect: true
  }, {
    id: 'opt1-2',
    text: 'Substituir o motor de renderização do navegador por WebAssembly',
    isCorrect: false
  }, {
    id: 'opt1-3',
    text: 'Bloquear renderizações de componentes até que o CSS seja descarregado',
    isCorrect: false
  }, {
    id: 'opt1-4',
    text: 'Forçar todo o JavaScript do cliente a correr em Service Workers',
    isCorrect: false
  }]
}, {
  id: 'q2',
  type: 'multiple',
  question: 'Selecione TODAS as vantagens de utilizar TypeScript com tipagem estrita num projeto escalável:',
  explanation: 'TypeScript deteta erros em tempo de compilação, melhora o auto-complete (IntelliSense) no IDE e serve como documentação viva. Não reduz o tamanho do bundle nem substitui a validação de runtime.',
  points: 10,
  options: [{
    id: 'opt2-1',
    text: 'Deteção precoce de erros durante o desenvolvimento (tempo de compilação)',
    isCorrect: true
  }, {
    id: 'opt2-2',
    text: 'Auto-complete avançado e refatorações seguras no editor de código',
    isCorrect: true
  }, {
    id: 'opt2-3',
    text: 'Reduz automaticamente o tamanho final dos ficheiros JavaScript em 50%',
    isCorrect: false
  }, {
    id: 'opt2-4',
    text: 'Documentação viva e contratos claros entre componentes e APIs',
    isCorrect: true
  }]
}, {
  id: 'q3',
  type: 'find-incorrect',
  question: 'Identifique a afirmação INCORRETA (Encontre o Erro) sobre a gestão de estado no React:',
  explanation: 'A afirmação sobre o hook useEffect é INCORRETA: o useEffect é executado após o ciclo de renderização no navegador, nunca durante o SSR inicial no servidor.',
  points: 10,
  options: [{
    id: 'opt3-1',
    text: 'O hook useState permite persistir valores reativos entre re-renderizações do componente',
    isCorrect: false
  }, {
    id: 'opt3-2',
    text: 'O hook useEffect é executado no servidor durante a renderização SSR de qualquer página',
    isCorrect: true
  }, {
    id: 'opt3-3',
    text: 'O hook useMemo guarda em cache o resultado do cálculo de uma operação pesada',
    isCorrect: false
  }, {
    id: 'opt3-4',
    text: 'O hook useRef mantém uma referência mutável sem desencadear nova renderização',
    isCorrect: false
  }]
}, {
  id: 'q4',
  type: 'true-false',
  question: 'Verdadeiro ou Falso: No Tailwind CSS, as classes utilitárias são purgadas e apenas o CSS efetivamente utilizado em código é incluído no ficheiro final de produção.',
  explanation: 'Verdadeiro: O compilador do Tailwind CSS analisa o código-fonte e gera um ficheiro CSS otimizado contendo apenas as classes utilizadas.',
  points: 10,
  options: [{
    id: 'opt4-1',
    text: 'Verdadeiro',
    isCorrect: true
  }, {
    id: 'opt4-2',
    text: 'Falso',
    isCorrect: false
  }]
}, {
  id: 'q5',
  type: 'open-ended',
  question: 'Resposta por Extenso: Explique com as suas próprias palavras a diferença entre Componentes de Servidor (RSC) e Componentes de Cliente (Client Components) no React.',
  gradingMode: 'auto',
  keywords: ['servidor', 'cliente', 'renderizacao', 'bundle', 'interatividade'],
  expectedAnswer: 'Componentes de Servidor executam exclusivamente no servidor e não enviam JavaScript para o cliente. Componentes de Cliente contêm interatividade, hooks e eventos de utilizador no navegador.',
  explanation: 'Excelente síntese: os Server Components minimizam o tamanho do bundle JavaScript enviado ao cliente, enquanto os Client Components providenciam listeners de eventos (onClick, onChange) e estado reativo local.',
  points: 10,
  options: []
}];
export const CourseQuizView = ({
  quizTitle = 'Questionário de Avaliação',
  description = 'Responda às questões abaixo para validar os seus conhecimentos e desbloquear pontos de experiência.',
  passingScore = 70,
  xpReward = 50,
  questions,
  onCompleteQuiz,
  onNextLesson
}) => {
  let parsedJsonQuiz = null;
  if (typeof description === 'string' && description.trim().startsWith('{')) {
    try {
      parsedJsonQuiz = JSON.parse(description);
    } catch (_) {}
  }
  const effectiveTitle = parsedJsonQuiz?.title || quizTitle;
  const effectiveDescription = parsedJsonQuiz?.description || (parsedJsonQuiz ? 'Responda às questões para validar a sua compreensão da matéria.' : description);
  const effectivePassingScore = Number(parsedJsonQuiz?.passingScore || passingScore || 70);
  const effectiveXpReward = Number(parsedJsonQuiz?.xpReward || xpReward || 50);
  const rawQuestions = questions && questions.length > 0 ? questions : parsedJsonQuiz?.questions && parsedJsonQuiz.questions.length > 0 ? parsedJsonQuiz.questions : DEFAULT_SAMPLE_QUESTIONS;
  const effectiveQuestions = rawQuestions.map((q, idx) => ({
    id: q.id || `q-${idx}`,
    type: q.type || 'single',
    question: q.question || `Questão ${idx + 1}`,
    explanation: q.explanation || '',
    points: q.points || 10,
    gradingMode: q.gradingMode,
    keywords: q.keywords,
    minWords: q.minWords,
    expectedAnswer: q.expectedAnswer,
    options: Array.isArray(q.options) ? q.options.map((opt, optIdx) => {
      if (typeof opt === 'string') {
        return {
          id: `opt-${idx}-${optIdx}`,
          text: opt,
          isCorrect: optIdx === (q.correctOptionIndex ?? 0)
        };
      }
      return {
        id: opt.id || `opt-${idx}-${optIdx}`,
        text: opt.text || '',
        isCorrect: Boolean(opt.isCorrect)
      };
    }) : []
  }));
  const [singleAnswers, setSingleAnswers] = useState({});
  const [multipleAnswers, setMultipleAnswers] = useState({});
  const [openEndedAnswers, setOpenEndedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const getQuestionTypeBadge = (type, gradingMode) => {
    switch (type) {
      case 'multiple':
        return {
          label: 'Múltipla Seleção (Várias Corretas)',
          color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50'
        };
      case 'find-incorrect':
        return {
          label: 'Identificar a Incorreta (Encontre o Erro)',
          color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
        };
      case 'true-false':
        return {
          label: 'Verdadeiro / Falso',
          color: 'bg-slate-100 dark:bg-[#1f2433] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2a3045]'
        };
      case 'open-ended':
        return gradingMode === 'teacher' ? {
          label: 'Resposta por Extenso (Revisão pelo Professor)',
          color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50'
        } : {
          label: 'Resposta por Extenso (Correção Automática)',
          color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50'
        };
      default:
        return {
          label: 'Escolha Única',
          color: 'bg-slate-100 dark:bg-[#1f2433] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2a3045]'
        };
    }
  };
  const handleSelectSingleOption = (qId, optId) => {
    if (quizSubmitted) return;
    soundEffects.play('click');
    setSingleAnswers(prev => ({
      ...prev,
      [qId]: optId
    }));
  };
  const handleToggleMultipleOption = (qId, optId) => {
    if (quizSubmitted) return;
    soundEffects.play('click');
    setMultipleAnswers(prev => {
      const currentList = prev[qId] || [];
      if (currentList.includes(optId)) {
        return {
          ...prev,
          [qId]: currentList.filter(id => id !== optId)
        };
      } else {
        return {
          ...prev,
          [qId]: [...currentList, optId]
        };
      }
    });
  };
  const handleOpenEndedChange = (qId, text) => {
    if (quizSubmitted) return;
    setOpenEndedAnswers(prev => ({
      ...prev,
      [qId]: text
    }));
  };
  const isQuestionAnswered = q => {
    if (q.type === 'multiple') {
      return (multipleAnswers[q.id] || []).length > 0;
    }
    if (q.type === 'open-ended') {
      return Boolean((openEndedAnswers[q.id] || '').trim().length >= 5);
    }
    return Boolean(singleAnswers[q.id]);
  };
  const evaluateOpenEnded = (q, userText) => {
    if (q.gradingMode === 'teacher') return true;
    const normalizedUser = normalizeTextForGrading(userText);
    if (q.keywords && q.keywords.length > 0) {
      const normalizedKeywords = q.keywords.map(kw => normalizeTextForGrading(kw));
      const matched = normalizedKeywords.filter(kw => normalizedUser.includes(kw));
      return matched.length / normalizedKeywords.length >= 0.5 || matched.length >= Math.min(2, normalizedKeywords.length);
    }
    return normalizedUser.length >= 15;
  };
  const handleSubmitQuiz = () => {
    const unanswered = effectiveQuestions.filter(q => !isQuestionAnswered(q));
    if (unanswered.length > 0) {
      alert(`Por favor, responda a todas as perguntas antes de submeter. Faltam ${unanswered.length} questão(ões).`);
      return;
    }
    let correctCount = 0;
    let pendingTeacherCount = 0;
    effectiveQuestions.forEach(q => {
      if (q.type === 'multiple') {
        const userSelected = new Set(multipleAnswers[q.id] || []);
        const correctOptions = new Set(q.options.filter(opt => opt.isCorrect).map(opt => opt.id));
        const hasAllCorrect = [...correctOptions].every(id => userSelected.has(id));
        const hasNoIncorrect = [...userSelected].every(id => correctOptions.has(id));
        if (hasAllCorrect && hasNoIncorrect && correctOptions.size > 0) {
          correctCount++;
        }
      } else if (q.type === 'open-ended') {
        if (q.gradingMode === 'teacher') {
          pendingTeacherCount++;
          correctCount++;
        } else {
          const passes = evaluateOpenEnded(q, openEndedAnswers[q.id] || '');
          if (passes) correctCount++;
        }
      } else {
        const selectedId = singleAnswers[q.id];
        const selectedOption = q.options.find(opt => opt.id === selectedId);
        if (selectedOption?.isCorrect) {
          correctCount++;
        }
      }
    });
    const scorePercentage = Math.round(correctCount / effectiveQuestions.length * 100);
    const passed = scorePercentage >= effectivePassingScore;
    const earnedXp = passed ? effectiveXpReward : Math.round(scorePercentage / 100 * effectiveXpReward * 0.5);
    setQuizSubmitted(true);
    setQuizResults({
      score: scorePercentage,
      passed,
      correctCount,
      totalCount: effectiveQuestions.length,
      earnedXp,
      pendingTeacherReviewCount: pendingTeacherCount
    });
    if (passed) {
      soundEffects.playSuccess();
      if (onCompleteQuiz) {
        onCompleteQuiz(scorePercentage, earnedXp);
      }
    } else {
      soundEffects.play('click');
    }
  };
  const handleResetQuiz = () => {
    setQuizSubmitted(false);
    setQuizResults(null);
    setSingleAnswers({});
    setMultipleAnswers({});
    setOpenEndedAnswers({});
    soundEffects.play('click');
  };
  return <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 max-w-4xl mx-auto w-full animate-fade-in antialiased">
      <div className="bg-white dark:bg-[#12141c] border border-slate-200/80 dark:border-[#222636] rounded-3xl shadow-xs p-6 sm:p-10 space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-[#222636]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider">
                Questionário
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {effectiveQuestions.length} Questões • Mínimo {effectivePassingScore}%
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white tracking-tight">
              {effectiveTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {effectiveDescription}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0 bg-slate-50 dark:bg-[#171a24] border border-slate-200/80 dark:border-[#222636] rounded-2xl p-3.5 sm:min-w-[120px]">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Recompensa
            </span>
            <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-lg font-extrabold text-slate-950 dark:text-white">
                +{effectiveXpReward} XP
              </span>
            </div>
          </div>
        </div>

        
        {quizResults && <div className={`p-6 rounded-2xl border transition-all ${quizResults.passed ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-200 shadow-xs' : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/50 text-rose-950 dark:text-rose-200 shadow-xs'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${quizResults.passed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                  {quizResults.passed ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    {quizResults.passed ? 'Parabéns! Foi aprovado no questionário com sucesso.' : 'Não atingiu a nota mínima de aprovação.'}
                  </h3>
                  <p className="text-xs sm:text-sm opacity-80 mt-1">
                    Acertou <strong>{quizResults.correctCount}</strong> de{' '}
                    <strong>{quizResults.totalCount}</strong> questões ({quizResults.score}%).
                    {quizResults.passed ? ` Ganhou +${quizResults.earnedXp} XP!` : ` Mínimo exigido: ${effectivePassingScore}%. Reveja as correções abaixo e tente novamente.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button type="button" onClick={handleResetQuiz} className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1c202e] border border-slate-300/80 dark:border-[#2a2f42] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#232838] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Repetir Quiz</span>
                </button>

                {quizResults.passed && onNextLesson && <button type="button" onClick={onNextLesson} className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs">
                    <span>Próxima Aula</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>}
              </div>
            </div>
          </div>}

        
        <div className="space-y-8">
          {effectiveQuestions.map((q, qIdx) => {
          const badge = getQuestionTypeBadge(q.type);
          const isMultiple = q.type === 'multiple';
          const userSelections = isMultiple ? multipleAnswers[q.id] || [] : [singleAnswers[q.id]].filter(Boolean);
          return <div key={q.id} className="p-6 rounded-2xl bg-slate-50/50 dark:bg-[#171a24] border border-slate-200/80 dark:border-[#222636] space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {qIdx + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  {q.type === 'find-incorrect' && <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-200 dark:border-amber-800/40">
                      <AlertCircle className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                      Selecione a opção falsa / com erro
                    </span>}

                  {q.type === 'multiple' && <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Pode selecionar mais do que uma opção
                    </span>}
                </div>

                
                <p className="text-sm sm:text-base font-semibold text-slate-950 dark:text-white leading-snug">
                  {q.question}
                </p>

                
                {q.type === 'open-ended' ? <div className="space-y-3 pt-1">
                    {!quizSubmitted ? <div className="space-y-1.5">
                        <textarea rows={4} value={openEndedAnswers[q.id] || ''} onChange={e => handleOpenEndedChange(q.id, e.target.value)} placeholder="Escreva aqui a sua resposta detalhada por extenso..." className="w-full bg-white dark:bg-[#12141c] border border-slate-200 dark:border-[#222636] focus:border-slate-950 dark:focus:border-blue-500 rounded-2xl p-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950/10 dark:focus:ring-blue-900/30 transition-all leading-relaxed" />
                        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1">
                          <span>
                            {q.gradingMode === 'teacher' ? 'Esta resposta será revista e avaliada manualmente pelo professor.' : 'Correção automática por palavras-chave conceituais (ignora acentos e maiúsculas).'}
                          </span>
                          <span>
                            {(openEndedAnswers[q.id] || '').trim().split(/\s+/).filter(Boolean).length}{' '}
                            palavras
                          </span>
                        </div>
                      </div> : <div className="space-y-3">
                        
                        <div className="p-4 rounded-xl bg-white dark:bg-[#12141c] border border-slate-200 dark:border-[#222636] space-y-1.5 shadow-2xs">
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            A Sua Resposta Submetida:
                          </span>
                          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                            {openEndedAnswers[q.id] || '(Sem resposta fornecida)'}
                          </p>
                        </div>

                        
                        {q.gradingMode === 'teacher' ? <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-purple-900 dark:text-purple-300 text-xs flex items-center gap-2 font-medium">
                            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                            <span>
                              Submissão registada com sucesso. O instrutor irá avaliar e atribuir a
                              nota final no painel da turma.
                            </span>
                          </div> : <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 font-medium ${evaluateOpenEnded(q, openEndedAnswers[q.id] || '') ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-200' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-950 dark:text-amber-200'}`}>
                            <div className="flex items-center gap-2">
                              {evaluateOpenEnded(q, openEndedAnswers[q.id] || '') ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />}
                              <span>
                                {evaluateOpenEnded(q, openEndedAnswers[q.id] || '') ? 'Resposta Validada: Conceitos essenciais identificados com sucesso.' : 'Resposta Parcial: Recomenda-se aprofundar os conceitos-chave indicados na fundamentação.'}
                              </span>
                            </div>
                          </div>}

                        
                        {q.expectedAnswer && <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-[#1a1d29] border border-slate-200 dark:border-[#222636] text-slate-700 dark:text-slate-300 text-xs space-y-1">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              Resposta Modelo Sugerida:
                            </span>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                              {q.expectedAnswer}
                            </p>
                          </div>}
                      </div>}
                  </div> : <div className="space-y-2.5 pt-1">
                    {q.options.map(opt => {
                const isSelected = isMultiple ? userSelections.includes(opt.id) : singleAnswers[q.id] === opt.id;
                let optionStyle = 'bg-white dark:bg-[#1c202e] border-slate-200 dark:border-[#282d3f] text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-[#232838] hover:border-slate-300 dark:hover:border-[#373d54]';
                let statusBadge = null;
                if (quizSubmitted) {
                  if (opt.isCorrect) {
                    optionStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-200 font-medium';
                    statusBadge = <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Correta
                            </span>;
                  } else if (isSelected && !opt.isCorrect) {
                    optionStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/50 text-rose-950 dark:text-rose-200 font-medium';
                    statusBadge = <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <X className="w-3 h-3" />
                              Incorreta
                            </span>;
                  } else {
                    optionStyle = 'bg-white/60 dark:bg-[#141620]/60 border-slate-200 dark:border-[#222636] text-slate-400 dark:text-slate-600 opacity-60';
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-slate-900 dark:bg-blue-600 border-slate-900 dark:border-blue-600 text-white font-medium shadow-xs';
                }
                return <button key={opt.id} type="button" disabled={quizSubmitted} onClick={() => {
                  if (isMultiple) {
                    handleToggleMultipleOption(q.id, opt.id);
                  } else {
                    handleSelectSingleOption(q.id, opt.id);
                  }
                }} className={`w-full p-3.5 sm:p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            {isMultiple ? <div className="shrink-0">
                                {isSelected ? <CheckSquare className={`w-4 h-4 ${quizSubmitted ? opt.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400' : 'text-white'}`} /> : <Square className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                              </div> : <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? quizSubmitted ? opt.isCorrect ? 'border-emerald-600 bg-emerald-600' : 'border-rose-600 bg-rose-600' : 'border-white bg-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[#12141c]'}`}>
                                {isSelected && <div className={`w-1.5 h-1.5 rounded-full ${quizSubmitted ? 'bg-white' : 'bg-slate-950 dark:bg-blue-600'}`} />}
                              </div>}

                            <span className="leading-relaxed">{opt.text}</span>
                          </div>

                          {statusBadge}
                        </button>;
              })}
                  </div>}

                
                {quizSubmitted && q.explanation && <div className="mt-4 p-4 rounded-xl bg-white dark:bg-[#12141c] border border-slate-200 dark:border-[#222636] text-slate-700 dark:text-slate-300 text-xs sm:text-sm space-y-1 shadow-2xs animate-fade-in">
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-semibold">
                      <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Explicação & Fundamentação:</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                      {q.explanation}
                    </p>
                  </div>}
              </div>;
        })}
        </div>

        
        {!quizSubmitted && <div className="pt-6 border-t border-slate-100 dark:border-[#222636] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Responda a todas as questões antes de submeter para avaliação imediata.
            </p>

            <button type="button" onClick={handleSubmitQuiz} className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-semibold bg-slate-950 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              <span>Submeter Questionário</span>
            </button>
          </div>}
      </div>
    </div>;
};