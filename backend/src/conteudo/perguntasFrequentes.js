const ajudaPerguntasFrequentes = [
  {
    category: 'Primeiros passos',
    description: 'Conheça a plataforma e comece a aprender.',
    items: [
      {
        q: 'O que posso fazer na NEXO?',
        a: 'Pode explorar cursos, acompanhar aulas, guardar notas, realizar avaliações e participar nas comunidades dos cursos. Os formadores organizam os conteúdos e acompanham os alunos.',
      },
      {
        q: 'Preciso de uma conta para explorar os cursos?',
        a: 'Pode consultar o catálogo e os detalhes dos cursos sem iniciar sessão. Para se inscrever, guardar progresso ou participar numa comunidade, precisa de uma conta.',
      },
      {
        q: 'Criar uma conta é gratuito?',
        a: 'Sim. O registo de aluno é gratuito. Cada curso indica se é gratuito ou pago antes de confirmar a inscrição.',
      },
      {
        q: 'Como encontro um curso adequado ao meu nível?',
        a: 'Em Explorar, pesquise um tema e utilize os filtros disponíveis. Consulte o nível de dificuldade, a descrição, o programa e os requisitos na página do curso antes de se inscrever.',
      },
      {
        q: 'Posso utilizar a plataforma no telemóvel?',
        a: 'Sim. A interface adapta-se a ecrãs pequenos. Para editar cursos e realizar chamadas com partilha de ecrã, um computador pode proporcionar uma experiência mais confortável.',
      },
    ],
  },
  {
    category: 'Conta e privacidade',
    description: 'Perfil, acesso e proteção da sua conta.',
    items: [
      {
        q: 'Como edito o meu perfil?',
        a: 'Abra Perfil e escolha Editar perfil. Pode alterar os dados pessoais, as imagens e as redes sociais. Consulte a pré-visualização e guarde as alterações.',
      },
      {
        q: 'Posso escolher o que aparece no meu perfil público?',
        a: 'Sim. Nas Definições pode controlar a visibilidade do perfil e de secções como biografia, localização, redes sociais, estatísticas e cursos.',
      },
      {
        q: 'Esqueci-me da palavra-passe. O que faço?',
        a: 'A recuperação automática de palavra-passe por email não se encontra ativa. Contacte a administração ou suporte para obter assistência no acesso à sua conta.',
      },
      {
        q: 'Como mantenho a minha conta protegida?',
        a: 'Utilize uma palavra-passe longa e exclusiva, não a partilhe e termine sessão em computadores partilhados. Nunca publique palavras-passe, códigos de acesso ou dados bancários nos canais da comunidade.',
      },
      {
        q: 'Porque preciso de iniciar sessão novamente?',
        a: 'A sessão tem um prazo de validade. Uma alteração de palavra-passe também pode invalidar sessões anteriores. Inicie sessão novamente com as suas credenciais; os cursos e o progresso continuam associados à conta.',
      },
    ],
  },
  {
    category: 'Cursos e pagamentos',
    description: 'Inscrições, biblioteca e pagamentos.',
    items: [
      {
        q: 'Como me inscrevo num curso gratuito?',
        a: 'Abra a página do curso e confirme a entrada gratuita. Depois de iniciar sessão, a inscrição fica guardada e o curso aparece em Os Meus Cursos.',
      },
      {
        q: 'Como pago um curso?',
        a: 'Num curso pago, clique em Comprar curso, verifique o valor e confirme em Pagar. Após a confirmação, a inscrição fica guardada e pode aceder às aulas.',
      },
      {
        q: 'Preciso de introduzir dados bancários?',
        a: 'Não. Este projeto escolar confirma o pagamento sem pedir dados bancários e sem efetuar cobranças reais.',
      },
      {
        q: 'O que acontece se o pagamento for recusado?',
        a: 'Se o pagamento não for confirmado, a inscrição não é concluída. Verifique a mensagem apresentada e tente novamente.',
      },
      {
        q: 'Onde consulto os meus pagamentos?',
        a: 'Abra as Definições e consulte Pagamentos. O histórico mostra o curso, o método, o valor, a data e o estado do pagamento.',
      },
      {
        q: 'O formador pode conceder-me acesso diretamente?',
        a: 'Sim. O formador ou a administração pode conceder acesso a um curso através das ferramentas de gestão. A inscrição aparece na sua biblioteca quando for atribuída.',
      },
    ],
  },
  {
    category: 'Aprendizagem e certificados',
    description: 'Aulas, progresso, avaliações e comprovativos.',
    items: [
      {
        q: 'O meu progresso fica guardado depois de sair?',
        a: 'As aulas concluídas, notas e inscrições são guardadas na base de dados. Pode continuar ao voltar a iniciar sessão na mesma conta, incluindo depois de reiniciar a aplicação.',
      },
      {
        q: 'Onde encontro os recursos de uma aula?',
        a: 'Abra o curso e consulte Documentos ou os recursos da aula. Só aparecem materiais disponibilizados pelo formador; algumas ligações abrem serviços externos.',
      },
      {
        q: 'Como guardo apontamentos?',
        a: 'Na área da aula, abra as notas, escreva os apontamentos e guarde. As notas ficam associadas à sua conta e à aula.',
      },
      {
        q: 'Como são corrigidos os questionários?',
        a: 'As respostas são avaliadas no servidor. As perguntas de escolha têm correção automática; respostas abertas podem aguardar revisão do formador. A nota mínima é definida no questionário.',
      },
      {
        q: 'Como submeto um projeto?',
        a: 'Na aula de projeto, envie uma ligação para o seu trabalho. O formador pode aprovar ou pedir alterações. A aula só conta como concluída depois da aprovação.',
      },
      {
        q: 'Quando posso obter um certificado?',
        a: 'É necessário concluir as aulas e obter aprovação nas avaliações e projetos exigidos. O servidor verifica os requisitos antes de emitir o certificado.',
      },
      {
        q: 'Como confirmo a autenticidade de um certificado?',
        a: 'Utilize a ligação pública de verificação ou a credencial que aparece no certificado. A página de verificação apresenta os dados do certificado emitido pela plataforma.',
      },
    ],
  },
  {
    category: 'Comunidade e chamadas',
    description: 'Conversas, colaboração e sessões em direto.',
    items: [
      {
        q: 'Quem tem acesso à comunidade de um curso?',
        a: 'Os alunos inscritos, o formador, os colaboradores autorizados e a administração. A equipa do curso gere os canais e modera as mensagens.',
      },
      {
        q: 'Posso enviar ficheiros no chat?',
        a: 'O chat permite partilhar ligações. Os anexos diretos não estão disponíveis. Se partilhar um documento externo, confirme as permissões de acesso dessa ligação.',
      },
      {
        q: 'Como entro numa chamada?',
        a: 'Abra um canal com chamada, escolha as preferências e autorize o microfone ou a câmara quando necessário. Pode silenciar o microfone e sair da chamada a qualquer momento.',
      },
      {
        q: 'A chamada não liga. O que posso verificar?',
        a: 'Verifique a ligação à internet, as permissões do navegador e se outro programa está a utilizar o microfone. Algumas redes exigem um servidor TURN configurado para estabelecer chamadas.',
      },
    ],
  },
  {
    category: 'Formadores e administração',
    description: 'Criação de cursos, publicação e permissões.',
    items: [
      {
        q: 'Como me torno formador?',
        a: 'Submeta uma candidatura na área de formador com a sua experiência e proposta de cursos. A administração analisa o pedido antes de atribuir as ferramentas de criação.',
      },
      {
        q: 'Como crio e publico um curso?',
        a: 'No painel do formador, crie o curso e escolha se inclui comunidade. Use Guardar rascunho para continuar mais tarde ou Enviar para revisão quando as aulas estiverem prontas. A decisão e o feedback aparecem no sino de notificações, no painel do criador e no editor do curso. Se forem pedidas alterações, guarde as correções e volte a enviar para revisão. O curso só aparece no catálogo após aprovação.',
      },
      {
        q: 'Posso trabalhar com outro formador?',
        a: 'Sim. O responsável pelo curso pode gerir colaboradores nas ferramentas do curso. Cada colaborador só tem acesso aos cursos para os quais foi autorizado.',
      },
      {
        q: 'Um administrador também pode ser professor?',
        a: 'Sim. O papel de administrador inclui acesso ao painel administrativo e às ferramentas de formador: criar cursos, organizar aulas e acompanhar alunos. Ambos os painéis estão disponíveis no menu da conta.',
      },
      {
        q: 'As contas demo alteram a minha conta pessoal?',
        a: 'Não. As contas de demonstração têm utilizadores próprios. A preparação da demonstração acrescenta conteúdos de exemplo e não substitui a palavra-passe nem os dados da sua conta.',
      },
    ],
  },
];

exports.helpFaq = ajudaPerguntasFrequentes;
