import { LuArrowLeft } from 'react-icons/lu';
import '../../estilos/gestao-editor.css';
import '../../estilos/gestao.css';
import { Link } from 'react-router-dom';
import { ReverFila } from '../../componentes/FerramentasFormador';
import './FormadorAvaliacoesPagina.css';

export default function FormadorAvaliacoesPagina() {
  return (
    <div className="creator-reviews-page area-gestao">
      <header>
        <div>
          <h1>Avaliar trabalhos</h1>
          <p>
            Reveja projetos e respostas de desenvolvimento, atribua notas e envie feedback aos
            alunos.
          </p>
        </div>
        <Link
          to="/formador"
          className="reviews-back-link"
        >
          <LuArrowLeft aria-hidden="true" /> Voltar aos cursos
        </Link>
      </header>
      <ReverFila />
    </div>
  );
}
