import {
  ReviewQueue,
  CourseAccessManager,
} from '../../../features/creator/components/CreatorTools';
import './CreatorDashboard.css';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Users,
  BookOpen,
  PlusCircle,
  Eye,
  BarChart3,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { api } from '../../../services/api';
import { formatCoursePrice, formatCategory } from '../../../utils/formatters';

export const CreatorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingCourseId, setDeletingCourseId] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getCreatorStats().catch(() => null),
      api.getCreatorCourses().catch(() => []),
    ]).then(([statsData, coursesData]) => {
      setStats(statsData);
      setCourses(coursesData || []);
      setLoading(false);
    });
  }, []);

  const totalStudents =
    stats?.totalStudents || courses.reduce((acc, c) => acc + (c._count?.enrollments || 0), 0);

  const handleDeleteCourse = async (course) => {
    const confirmed = window.confirm(
      `Tem a certeza de que pretende eliminar "${course.title}"? Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    setDeletingCourseId(course.id);
    try {
      await api.deleteCourse(course.id);
      setCourses((currentCourses) => currentCourses.filter((item) => item.id !== course.id));
    } catch (error) {
      window.alert(`Não foi possível eliminar o curso: ${error.message}`);
    } finally {
      setDeletingCourseId(null);
    }
  };

  return (
    <div className="creator-dashboard-panel">
      <div className="creator-dashboard-panel-2">
        <div>
          <span className="creator-dashboard-label">Estúdio do Criador</span>
          <h1 className="creator-dashboard-title">Painel do Formador</h1>
          <p className="creator-dashboard-description">
            Gira os seus cursos, publique novas aulas e acompanhe os seus alunos.
          </p>
        </div>

        <div className="creator-dashboard-panel-3">
          <Link to="/creator/members">
            <button className="creator-dashboard-button">
              <Users className="creator-dashboard-users" />
              <span>Ver Alunos</span>
            </button>
          </Link>
          <Link to="/creator/courses/new">
            <button className="creator-dashboard-button-2">
              <PlusCircle className="creator-dashboard-plus-circle" />
              <span>Criar Novo Curso</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="creator-dashboard-panel-4">
        <div className="creator-dashboard-panel-5">
          <div className="creator-dashboard-panel-6">
            <DollarSign className="creator-dashboard-dollar-sign" />
          </div>
          <div>
            <p className="creator-dashboard-description-2">Pagamentos online</p>
            <p className="creator-dashboard-description-3">Por configurar</p>
          </div>
        </div>

        <div className="creator-dashboard-panel-5">
          <div className="creator-dashboard-panel-7">
            <Users className="creator-dashboard-dollar-sign" />
          </div>
          <div>
            <p className="creator-dashboard-description-2">Alunos Inscritos</p>
            <p className="creator-dashboard-description-4">{totalStudents}</p>
          </div>
        </div>

        <div className="creator-dashboard-panel-5">
          <div className="creator-dashboard-panel-8">
            <BookOpen className="creator-dashboard-dollar-sign" />
          </div>
          <div>
            <p className="creator-dashboard-description-2">Cursos Criados</p>
            <p className="creator-dashboard-description-4">{courses.length}</p>
          </div>
        </div>
      </div>

      <div className="creator-dashboard-panel-9">
        <div className="creator-dashboard-panel-10">
          <div>
            <h2 className="creator-dashboard-heading">Os Meus Cursos ({courses.length})</h2>
            <p className="creator-dashboard-description-5">
              Clique em "Editar" para adicionar aulas, vídeos ou questionários.
            </p>
          </div>

          <Link to="/creator/courses/new">
            <button className="creator-dashboard-button-3">
              <PlusCircle className="creator-dashboard-plus-circle" />
              <span>Novo Curso</span>
            </button>
          </Link>
        </div>

        <div className="creator-dashboard-panel-11">
          {courses.length === 0 ? (
            <div className="creator-dashboard-panel-12">
              <div className="creator-dashboard-panel-13">
                <BookOpen className="creator-dashboard-dollar-sign" />
              </div>
              <h4 className="creator-dashboard-caption">Ainda não tem cursos criados</h4>
              <p className="creator-dashboard-description-6">
                Comece agora mesmo a montar o seu primeiro curso com módulos práticos e vídeos.
              </p>
              <Link to="/creator/courses/new">
                <button className="creator-dashboard-button-4">Criar Primeiro Curso</button>
              </Link>
            </div>
          ) : (
            <div className="creator-dashboard-panel-14">
              {courses.map((course) => (
                <div key={course.id} className="creator-dashboard-panel-15">
                  <div className="creator-dashboard-panel-16">
                    <img
                      src={
                        course.thumbnailUrl ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
                      }
                      alt={course.title}
                      className="creator-dashboard-image"
                    />
                    <div className="creator-dashboard-panel-17">
                      <h4 className="creator-dashboard-caption-2">{course.title}</h4>
                      <div className="creator-dashboard-panel-18">
                        <span className="creator-dashboard-label-2">
                          {formatCategory(course.category)}
                        </span>
                        <span
                          className={`creator-dashboard-label-3 ${
                            course.isPublished
                              ? 'creator-dashboard-label-4'
                              : 'creator-dashboard-label-5'
                          }`}
                        >
                          {course.isPublished ? 'Publicado' : 'Rascunho'}
                        </span>
                        <span>•</span>
                        <span>{course._count?.enrollments || 0} alunos inscritos</span>
                        <span>•</span>
                        <span className="creator-dashboard-label-6">
                          {formatCoursePrice(course)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="creator-dashboard-panel-19">
                    <Link to={`/learn/${course.id}`}>
                      <button className="creator-dashboard-button-5">
                        <Eye className="creator-dashboard-eye" />
                        <span>Ver</span>
                      </button>
                    </Link>
                    <Link to={`/creator/courses/${course.id}/edit`}>
                      <button className="creator-dashboard-button-6">
                        <BookOpen className="creator-dashboard-eye" />
                        <span>Editar Curso</span>
                      </button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(course)}
                      disabled={deletingCourseId === course.id}
                      aria-label={`Eliminar curso ${course.title}`}
                      title="Eliminar curso"
                      className="creator-dashboard-button-7"
                    >
                      <Trash2 className="creator-dashboard-trash2" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ReviewQueue />
      <CourseAccessManager />
    </div>
  );
};

export default CreatorDashboard;
