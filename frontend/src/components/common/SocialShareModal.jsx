import './SocialShareModal.css';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Copy, Check, X, Send, Linkedin, MessageCircle, Mail } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';

export const SocialShareModal = ({
  isOpen,
  onClose,
  title = 'NEXO — Cursos e comunidade',
  text = 'Conheça esta formação de alta qualidade na plataforma NEXO:',
  url = window.location.href,
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${text} ${title}`);

  const shareLinks = [
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
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%0A%0A${encodedUrl}`,
      icon: Mail,
      color: 'social-share-modal-share-links-color-4',
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: 'Ligação Copiada!',
        message: 'A ligação foi copiada para a área de transferência.',
        type: 'success',
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({
        title: 'Erro ao Copiar',
        message: 'Selecione e copie a ligação manualmente.',
        type: 'error',
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
        onClose();
      } catch {
        // User cancelled or share failed
      }
    }
  };

  return createPortal(
    <div className="social-share-modal-panel dialog-layer">
      <div className="social-share-modal-panel-2" onClick={onClose} aria-hidden="true" />

      <div className="social-share-modal-panel-3">
        <Card className="social-share-modal-card">
          {/* Header */}
          <div className="social-share-modal-panel-4">
            <div className="social-share-modal-panel-5">
              <div className="social-share-modal-panel-6">
                <Share2 className="social-share-modal-share2" />
              </div>
              <h3 className="social-share-modal-subheading">Partilhar Conteúdo</h3>
            </div>
            <button onClick={onClose} className="social-share-modal-button">
              <X className="social-share-modal-share2" />
            </button>
          </div>

          <p className="social-share-modal-description">{title}</p>

          {/* Social Share Grid */}
          <div className="social-share-modal-panel-7">
            {shareLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`social-share-modal-link ${link.color}`}
                >
                  <Icon className="social-share-modal-icon" />
                  <span>{link.name}</span>
                </a>
              );
            })}
          </div>

          {/* Copy Link Input */}
          <div className="social-share-modal-panel-8">
            <label className="social-share-modal-field-label">Copiar Ligação Direta</label>
            <div className="social-share-modal-panel-9">
              <input type="text" readOnly value={url} className="social-share-modal-field" />
              <Button
                variant={copied ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleCopyLink}
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
              </Button>
            </div>
          </div>

          {/* Native Web Share Button if supported */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNativeShare}
              className="social-share-modal-button-3"
            >
              Abrir opções de partilha do dispositivo
            </Button>
          )}
        </Card>
      </div>
    </div>,
    document.body,
  );
};

export default SocialShareModal;
