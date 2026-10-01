import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Copy, Check, X, Send, Linkedin, MessageCircle, Mail } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';

export const SocialShareModal = ({
  isOpen,
  onClose,
  title = 'NEXO — Plataforma de Formação de Excelência',
  text = 'Conheça esta formação de alta qualidade na plataforma NEXO:',
  url = window.location.href
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
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800 text-white'
    },
    {
      name: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: Send,
      color: 'bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-slate-100'
    },
    {
      name: 'Email',
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%0A%0A${encodedUrl}`,
      icon: Mail,
      color: 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white'
    }
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: 'Ligação Copiada!',
        message: 'A ligação foi copiada para a área de transferência.',
        type: 'success'
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({
        title: 'Erro ao Copiar',
        message: 'Selecione e copie a ligação manualmente.',
        type: 'error'
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
        onClose();
      } catch {
        // User cancelled or share failed
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ isolation: 'isolate' }}>
      <div
        className="fixed inset-0 bg-black/80 dark:bg-black/90 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <Card className="relative w-full max-w-md p-6 space-y-6 shadow-2xl z-10 animate-fade-in text-left border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d10]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Partilhar Conteúdo
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-2">
            {title}
          </p>

          {/* Social Share Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {shareLinks.map(link => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl gap-2 font-bold text-xs transition-all shadow-xs ${link.color}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </a>
              );
            })}
          </div>

          {/* Copy Link Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              Copiar Ligação Direta
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={url}
                className="flex-1 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-neutral-300 focus:outline-none select-all"
              />
              <Button
                variant={copied ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleCopyLink}
                leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                className="shrink-0 font-bold text-xs"
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
              className="w-full text-xs font-semibold"
            >
              Abrir opções de partilha do dispositivo
            </Button>
          )}
        </Card>
      </div>
    </div>,
    document.body
  );
};

export default SocialShareModal;
