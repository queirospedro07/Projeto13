import './LigacoesRedesSociaisPerfil.css';
import {
  FiGithub as Github,
  FiLinkedin as Linkedin,
  FiInstagram as Instagram,
  FiTwitter as Twitter,
  FiYoutube as Youtube,
  FiTwitch as Twitch,
  FiFacebook as Facebook,
} from 'react-icons/fi';
import {
  LuGlobe as Globe,
  LuMusic2 as Music2,
  LuMessageCircle as MessageCircle,
  LuArrowUpRight as ArrowUpRight,
} from 'react-icons/lu';
import { obterPerfilLigacoes } from '../../utilitarios/redesSociaisPerfil';

export const NETWORK_ICONS = {
  website: Globe,
  github: Github,
  linkedin: Linkedin,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Music2,
  twitch: Twitch,
  discord: MessageCircle,
  facebook: Facebook,
};

export function LigacoesRedesSociaisPerfil({ profile: perfil, compact = false }) {
  const ligacoes = obterPerfilLigacoes(perfil);
  if (!ligacoes.length) return null;

  return (
    <div
      className={`profile-social-links ${compact ? 'profile-social-links-compact' : ''}`}
      aria-label="Redes sociais"
    >
      {ligacoes.map(({ key: chave, label, url }) => {
        const Icon = NETWORK_ICONS[chave];

        return (
          <a
            key={chave}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir ${label}`}
            title={label}
          >
            <Icon aria-hidden="true" />
            {!compact && (
              <>
                <span>{label}</span>
                <ArrowUpRight
                  className="profile-social-link-arrow"
                  aria-hidden="true"
                />
              </>
            )}
          </a>
        );
      })}
    </div>
  );
}
