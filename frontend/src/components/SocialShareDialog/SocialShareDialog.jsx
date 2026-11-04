import './SocialShareDialog.css';
import { FiLinkedin as Linkedin } from 'react-icons/fi';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LuShare2 as Share2,
  LuCopy as Copy,
  LuCheck as Check,
  LuX as X,
  LuSend as Send,
  LuMessageCircle as MessageCircle,
  LuMail as Mail,
} from 'react-icons/lu';
import { Botao } from '../Button';
import { Cartao } from '../Card';
import { useAvisos } from '../Alerts';

export const SocialPartilharJanela = ({
  isOpen: isAbrir,
  onClose: onFechar,
  title: titulo = 'NEXO — Cursos e comunidade',
  text = 'Conheça esta formação de alta qualidade na plataforma NEXO:',
  url = window.location.href,
}) => {
  const [copied, definirCopied] = useState(false);
  const { toast: aviso } = useAvisos();
  if (!isAbrir) return null;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${text} ${titulo}`);
  const partilharLigacoes = [
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      icon: MessageCircle,
      color: 'social-share-modal-share-links-color',
    },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: Linkedin,
      color: 'social-share-modal-share-links-color-2',
    },
    {
      name: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: Send,
      color: 'social-share-modal-share-links-color-3',
    },
    {
      name: 'Email',
      href: `mailto:?subject=${encodeURIComponent(titulo)}&body=${encodedText}%0A%0A${encodedUrl}`,
      icon: Mail,
      color: 'social-share-modal-share-links-color-4',
    },
  ];
  const tratarCopyLigacao = async () => {
    try {
      await navigator.clipboard.writeText(url);
      definirCopied(true);
      aviso({
        title: 'Ligação Copiada!',
        message: 'A ligação foi copiada para a área de transferência.',
        type: 'success',
      });
      setTimeout(() => definirCopied(false), 2500);
    } catch {
      aviso({
        title: 'Erro ao Copiar',
        message: 'Selecione e copie a ligação manualmente.',
        type: 'error',
      });
    }
  };

  const tratarNativoPartilhar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: titulo,
          text,
          url,
        });
        onFechar();
      } catch {
        // Utilizador cancelled or share failed
      }
    }
  };

  return createPortal(
    <div className="social-share-modal-panel dialog-layer">
      <div
        className="social-share-modal-panel-2"
        onClick={onFechar}
        aria-hidden="true"
      />

      <div className="social-share-modal-panel-3">
        <Cartao className="social-share-modal-card">
          {/* Header */}
          <div className="social-share-modal-panel-4">
            <div className="social-share-modal-panel-5">
              <div className="social-share-modal-panel-6">
                <Share2 className="social-share-modal-share2" />
              </div>
              <h3 className="social-share-modal-subheading">Partilhar Conteúdo</h3>
            </div>
            <button
              onClick={onFechar}
              className="social-share-modal-button"
            >
              <X className="social-share-modal-share2" />
            </button>
          </div>

          <p className="social-share-modal-description">{titulo}</p>

          {/* Social Share Grid */}
          <div className="social-share-modal-panel-7">
            {partilharLigacoes.map((ligacao) => {
              const Icon = ligacao.icon;

              return (
                <a
                  key={ligacao.name}
                  href={ligacao.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`social-share-modal-link ${ligacao.color}`}
                >
                  <Icon className="social-share-modal-icon" />
                  <span>{ligacao.name}</span>
                </a>
              );
            })}
          </div>

          {/* Copy Link Input */}
          <div className="social-share-modal-panel-8">
            <label className="social-share-modal-field-label">Copiar Ligação Direta</label>
            <div className="social-share-modal-panel-9">
              <input
                type="text"
                readOnly
                value={url}
                className="social-share-modal-field"
              />
              <Botao
                variant={copied ? 'secondary' : 'primary'}
                size="sm"
                onClick={tratarCopyLigacao}
                leftIcon={
                  copied ? (
                    <Check className="social-share-modal-check" />
                  ) : (
                    <Copy className="social-share-modal-copy" />
                  )
                }
                className="social-share-modal-button-2"
              >
                {copied ? 'Copiado' : 'Copiar'}
              </Botao>
            </div>
          </div>

          {/* Partilha do sistema quando o navegador a suporta. */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <Botao
              variant="secondary"
              size="sm"
              onClick={tratarNativoPartilhar}
              className="social-share-modal-button-3"
            >
              Abrir opções de partilha do dispositivo
            </Botao>
          )}
        </Cartao>
      </div>
    </div>,
    document.body,
  );
};

export default SocialPartilharJanela;
