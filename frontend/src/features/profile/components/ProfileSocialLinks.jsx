import React from 'react';
import {
  Globe,
  Github,
  Linkedin,
  Instagram,
  Twitter,
  Youtube,
  Twitch,
  Facebook,
  Music2,
  MessageCircle,
  ArrowUpRight,
} from 'lucide-react';
import { getProfileLinks } from '../../../utils/profileSocials';
import './ProfileSocialLinks.css';

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

export function ProfileSocialLinks({ profile, compact = false }) {
  const links = getProfileLinks(profile);
  if (!links.length) return null;
  return (
    <div
      className={`profile-social-links ${compact ? 'profile-social-links-compact' : ''}`}
      aria-label="Redes sociais"
    >
      {links.map(({ key, label, url }) => {
        const Icon = NETWORK_ICONS[key];
        return (
          <a
            key={key}
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
                <ArrowUpRight className="profile-social-link-arrow" aria-hidden="true" />
              </>
            )}
          </a>
        );
      })}
    </div>
  );
}
