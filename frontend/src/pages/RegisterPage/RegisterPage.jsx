import './RegisterPage.css';
import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import {
  LuUser as User,
  LuMail as Mail,
  LuLock as Lock,
  LuCircleAlert as AlertCircle,
} from 'react-icons/lu';
import { Logo } from '../../components/Logo';
import { SEO } from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_AVATAR_URL } from '../../constants/defaultAvatars';
export const RegisterPage = () => {
  const { register, user } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem');
      return;
    }
    if (password.length < 12) {
      setError('A palavra-passe deve ter pelo menos 12 caracteres');
      return;
    }
    if (!acceptTerms) {
      setError('Por favor, aceite os Termos de Utilização e Política de Privacidade');
      return;
    }
    setIsLoading(true);
    try {
      await register({
        name,
        username,
        email,
        password,
        avatarUrl: DEFAULT_AVATAR_URL,
        acceptedTerms: acceptTerms,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Falha ao criar conta. O utilizador ou email podem já estar em uso.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <SEO
        title="Criar Conta Gratuita — NEXO"
        description="Junte-se à NEXO. Aprenda com cursos práticos, participe em sessões em direto e obtenha certificados verificados."
        canonical="https://nexo.pt/register"
      />
      <div className="register-panel">
        <div className="register-panel-2">
          <div className="register-panel-3">
            <div className="register-panel-4">
              <Logo size="lg" to="/" />
            </div>
            <h2 className="register-heading">Criar Conta</h2>
            <p className="register-description">
              Junte-se a turmas colaborativas, aceda a aulas e participe em transmissões ao vivo.
            </p>
          </div>

          <div className="register-panel-5">
            {error && (
              <div className="register-panel-6">
                <AlertCircle className="register-alert-circle" />
                <span className="register-label">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              <div>
                <label className="register-field-label">Nome Completo</label>
                <div className="register-panel-7">
                  <User className="register-user" />
                  <input
                    type="text"
                    required
                    placeholder="Ex.: João Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="register-field"
                  />
                </div>
              </div>

              <div>
                <label className="register-field-label">Nome de Utilizador</label>
                <input
                  type="text"
                  required
                  placeholder="ex.: joaosilva"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="register-field-2"
                />
              </div>

              <div>
                <label className="register-field-label">E-mail</label>
                <div className="register-panel-7">
                  <Mail className="register-user" />
                  <input
                    type="email"
                    required
                    placeholder="exemplo@dominio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="register-field"
                  />
                </div>
              </div>

              <div className="register-panel-8">
                <div>
                  <label className="register-field-label">Palavra-passe</label>
                  <div className="register-panel-7">
                    <Lock className="register-user" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="register-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="register-field-label">Confirmar Palavra-passe</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="register-field-2"
                  />
                </div>
              </div>

              <div className="register-panel-9">
                <input
                  id="accept-terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="register-field-3"
                />
                <label htmlFor="accept-terms" className="register-field-label-2">
                  Li e aceito os{' '}
                  <Link to="/terms" target="_blank" className="register-link">
                    Termos de Utilização
                  </Link>{' '}
                  e a{' '}
                  <Link to="/privacy" target="_blank" className="register-link">
                    Política de Privacidade
                  </Link>{' '}
                  da plataforma NEXO.
                </label>
              </div>

              <button type="submit" disabled={isLoading} className="register-button">
                {isLoading ? 'A criar conta...' : 'Criar Conta'}
              </button>
            </form>

            <div className="register-panel-10">
              Já possui uma conta?{' '}
              <Link to="/login" className="register-link-2">
                Iniciar sessão
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
