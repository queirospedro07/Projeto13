import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './CourseStatusChart.css';

const statuses = [
  { value: 'APPROVED', label: 'Aprovados' },
  { value: 'PENDING', label: 'Em revisão' },
  { value: 'DRAFT', label: 'Rascunhos' },
  { value: 'REJECTED', label: 'Rejeitados' },
];

export default function CourseStatusChart({ courses }) {
  const data = statuses.map(({ value, label }) => ({
    name: label,
    total: courses.filter((course) => (course.approvalStatus || 'APPROVED') === value).length,
  }));

  return (
    <section className="course-status-chart" aria-labelledby="course-status-heading">
      <h2 id="course-status-heading">Estado dos cursos</h2>
      <p>Distribuição dos cursos registados por estado de publicação.</p>
      {courses.length ? (
        <>
          <div className="course-status-chart__plot">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                accessibilityLayer
                margin={{ top: 12, right: 12, left: -24, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border-color)"
                />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
                <Bar
                  dataKey="total"
                  name="Cursos"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={64}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="course-status-chart__summary">
            {data.map(({ name, total }) => (
              <li key={name}>
                {name}: <strong>{total}</strong>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>Ainda não existem cursos registados.</p>
      )}
    </section>
  );
}
