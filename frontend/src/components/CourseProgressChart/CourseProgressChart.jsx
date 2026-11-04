import './CourseProgressChart.css';

const estados = [
  { valor: 'APPROVED', nome: 'Aprovados', cor: '#2563eb' },
  { valor: 'PENDING', nome: 'Em revisão', cor: '#d97706' },
  { valor: 'DRAFT', nome: 'Rascunhos', cor: '#737373' },
  { valor: 'REJECTED', nome: 'Rejeitados', cor: '#dc2626' },
];

export default function CursoEstadoGrafico({ courses: cursos = [] }) {
  const total = cursos.length;
  const contagens = cursos.reduce((resultado, curso) => {
    const estado = curso.estadoAprovacao || 'APPROVED';

    resultado[estado] = (resultado[estado] || 0) + 1;

    return resultado;
  }, {});

  return (
    <section
      className="course-status-chart"
      aria-labelledby="course-status-heading"
    >
      <header className="course-status-chart__header">
        <div>
          <h2 id="course-status-heading">Estado dos cursos</h2>
          <p>Publicação e revisão dos cursos da plataforma.</p>
        </div>
        <p className="course-status-chart__total">
          <strong>{total}</strong>
          <span>{total === 1 ? 'curso registado' : 'cursos registados'}</span>
        </p>
      </header>
      {total ? (
        <ul
          className="course-status-chart__rows"
          aria-label="Distribuição por estado"
        >
          {estados.map(({ valor, nome, cor }) => {
            const quantidade = contagens[valor] || 0;
            const percentagem = (quantidade / total) * 100;

            return (
              <li
                key={valor}
                className="course-status-chart__row"
              >
                <span className="course-status-chart__name">{nome}</span>
                <span
                  className="course-status-chart__track"
                  aria-hidden="true"
                >
                  <span style={{ width: `${percentagem}%`, backgroundColor: cor }} />
                </span>
                <strong className="course-status-chart__count">{quantidade}</strong>
                <span className="course-status-chart__percentage">{Math.round(percentagem)}%</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="course-status-chart__empty">Ainda não existem cursos registados.</p>
      )}
    </section>
  );
}
