import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LuArrowRight } from 'react-icons/lu';
import { podeGerirEsteCurso, temInscricaoCurso } from '../../utilitarios/permissoes';
import { formatarCursoPreco } from '../../utilitarios/formatacao';
import { PagamentoSimulacaoJanela } from '../PagamentoSimulacaoJanela';
import { Janela } from '../Janela';
import { Botao } from '../Botao';
import { useAutenticacao } from '../../contextos/ContextoAutenticacao';
import { useAvisos } from '../Avisos';
import { api } from '../../servicos/api';
import './CursoInscreverJanela.css';

export const CursoInscreverJanela = ({
  isOpen: isAbrir,
  onClose: onFechar,
  course: curso,
  onEnrollSuccess: onInscreverSucesso,
  isSpace: isEspaco = false,
}) => {
  const navigate = useNavigate();
  const { user: utilizador } = useAutenticacao();
  const { toast: aviso } = useAvisos();
  const [isSubmitting, definirIsSubmitting] = useState(false);
  const temAcesso = temInscricaoCurso(curso) || podeGerirEsteCurso(utilizador, curso);
  if (!isAbrir || !curso) return null;
  const isGratuito = curso.eGratuito || Number(curso.price || 0) <= 0;
  const cursoIdentificador = curso.slug || curso.id;
  const cursoTitulo = curso.title || curso.name || 'Curso';
  const tratarConfirmarInscrever = async () => {
    if (isSubmitting) return;
    if (temAcesso) {
      onFechar();
      navigate(`/aprender/${cursoIdentificador}`);

      return;
    }

    if (!utilizador) {
      aviso({
        title: 'Sessão Necessária',
        message: 'Por favor inicie sessão ou crie conta para se inscrever.',
        type: 'info',
      });
      onFechar();
      navigate('/entrar');

      return;
    }

    definirIsSubmitting(true);
    try {
      if (
        isEspaco &&
        !String(curso.id).startsWith('course-') &&
        !String(curso.id).startsWith('demo-course-')
      ) {
        await api.post(`/espacos/${curso.id}/aderir`).then(({ data: dados }) => dados);
      } else {
        await api.post(`/cursos/${curso.id}/inscrever`).then(({ data: dados }) => dados);
      }

      window.dispatchEvent(new Event('nexo_courses_visibility_changed'));
      aviso({
        title: 'Matrícula Confirmada!',
        message: `Já faz parte do curso "${cursoTitulo}". Bons estudos!`,
        type: 'success',
      });
      onFechar();
      if (onInscreverSucesso) {
        onInscreverSucesso(curso.id);
      } else {
        navigate(`/aprender/${cursoIdentificador}`);
      }
    } catch (erro) {
      aviso({
        title: 'Erro na Inscrição',
        message: erro.message || 'Não foi possível confirmar a matrícula. Tente novamente.',
        type: 'error',
      });
    } finally {
      definirIsSubmitting(false);
    }
  };

  if (utilizador && !temAcesso && !isGratuito)
    return (
      <PagamentoSimulacaoJanela
        course={curso}
        onClose={onFechar}
        onSuccess={() => {
          onFechar();
          if (onInscreverSucesso) onInscreverSucesso(curso.id);
          else navigate(`/aprender/${cursoIdentificador}`);
        }}
      />
    );

  return (
    <Janela
      isOpen={isAbrir}
      title={temAcesso ? 'Abrir curso' : 'Entrar no curso'}
      maxWidth="md"
      onClose={onFechar}
    >
      <div className="inscricao-resumo">
        <img
          src={curso.urlMiniatura || curso.urlCapa || '/images/curso-sem-capa.svg'}
          alt=""
        />
        <div>
          <h4>{cursoTitulo}</h4>
          <p>{curso.creator?.name || curso.owner?.name || 'Formação NEXO'}</p>
          <strong>{formatarCursoPreco(curso)}</strong>
        </div>
      </div>
      {curso.description && <p className="inscricao-descricao">{curso.description}</p>}
      <p className="inscricao-info">
        {temAcesso
          ? 'Já tem acesso a este curso. Pode continuar as suas aulas.'
          : 'Confirme a inscrição para aceder às aulas e aos recursos do curso.'}
      </p>
      <div className="inscricao-acoes">
        <Link
          to={`/cursos/${cursoIdentificador}`}
          onClick={onFechar}
        >
          Ver detalhes do curso
        </Link>
        <Botao
          type="button"
          size="md"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          onClick={tratarConfirmarInscrever}
        >
          {temAcesso
            ? 'Continuar curso'
            : isGratuito
              ? 'Entrar no curso gratuitamente'
              : 'Entrar no curso'}
          <LuArrowRight aria-hidden="true" />
        </Botao>
      </div>
    </Janela>
  );
};

export default CursoInscreverJanela;
