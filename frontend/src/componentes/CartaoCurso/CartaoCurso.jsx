import { Link } from 'react-router-dom';
import {
  LuArrowRight as ArrowRight,
  LuStar as Star,
  LuClock as Clock,
  LuGraduationCap as GraduationCap,
  LuCircleCheck as CheckCircle2,
} from 'react-icons/lu';
import { formatarCursoPreco, formatarCategoria } from '../../utilitarios/formatacao';
import { podeGerirEsteCurso, temInscricaoCurso } from '../../utilitarios/permissoes';
import './CartaoCurso.css';

export function CartaoCurso({ curso, utilizador, onEntrar }) {
  const podeGerir = podeGerirEsteCurso(utilizador, curso);
  const temAcesso = temInscricaoCurso(curso) || podeGerir;

  return (
    <div className="cartao-curso-panel-17">
      <Link
        to={`/cursos/${curso.slug || curso.id}`}
        className="cartao-curso-link"
      >
        <img
          src={curso.urlMiniatura || '/images/curso-sem-capa.svg'}
          alt={curso.title}
          className="cartao-curso-image"
        />
        <div className="cartao-curso-panel-18">
          <span className="cartao-curso-label-4">{formatarCategoria(curso.category)}</span>
          <span className="cartao-curso-label-5">
            {!curso.eGratuito && Number(curso.precoReferencia) > Number(curso.price) && (
              <del>{formatarCursoPreco({ ...curso, price: curso.precoReferencia })}</del>
            )}
            {formatarCursoPreco(curso)}
          </span>
        </div>
      </Link>

      <div className="cartao-curso-panel-19">
        <div className="cartao-curso-panel-20">
          <GraduationCap className="cartao-curso-graduation-cap" />
          <span>{curso.difficulty || 'Geral'}</span>
        </div>

        <Link
          to={`/cursos/${curso.slug || curso.id}`}
          className="cartao-curso-link-2"
        >
          <h3 className="cartao-curso-subheading">{curso.title}</h3>
        </Link>

        <p className="cartao-curso-description-4">{curso.description}</p>

        <div className="cartao-curso-panel-21">
          <div className="cartao-curso-panel-22">
            <Star className="cartao-curso-star" />
            <span>{curso.averageRating || 'Sem avaliações'}</span>
          </div>
          <div className="cartao-curso-panel-22">
            <Clock className="cartao-curso-graduation-cap" />
            <span>{curso.duracaoHoras || '0'}h</span>
          </div>
        </div>

        <div className="cartao-curso-acoes">
          {onEntrar && (
            <Link
              to={`/cursos/${curso.slug || curso.id}`}
              className="cartao-curso-detalhes"
            >
              Ver detalhes
            </Link>
          )}
          {!temAcesso && onEntrar ? (
            <button
              type="button"
              onClick={() => onEntrar(curso)}
              className="cartao-curso-link-3 cartao-curso-link-5"
            >
              Entrar no curso
              <ArrowRight className="cartao-curso-graduation-cap" />
            </button>
          ) : (
            <Link
              to={
                temAcesso
                  ? `/aprender/${curso.slug || curso.id}`
                  : `/cursos/${curso.slug || curso.id}`
              }
              className={`cartao-curso-link-3 ${temAcesso ? 'cartao-curso-link-4' : 'cartao-curso-link-5'}`}
            >
              {temAcesso ? (
                <>
                  <CheckCircle2 className="cartao-curso-graduation-cap" />
                  {podeGerir ? 'Abrir curso' : 'Continuar curso'}
                </>
              ) : (
                <>
                  Ver curso
                  <ArrowRight className="cartao-curso-graduation-cap" />
                </>
              )}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
