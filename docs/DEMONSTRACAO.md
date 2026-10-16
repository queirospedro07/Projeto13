# Demonstração local

Foram preparados cinco cursos: HTML/CSS, JavaScript, Python, Git/GitHub e SQL. SQL custa 29 € no catálogo para testar o modal de simulação; não existe cobrança real. Os restantes cursos são gratuitos. Os vídeos são recursos externos de demonstração e exigem acesso à internet.

## Contas

As contas seguintes usam a palavra-passe inicial **`nexoDemo2026!`** e permitem iniciar sessão com o nome de utilizador:

| Utilizador | Papel |
| --- | --- |
| `sofia.almeida` | Formador |
| `miguel.ferreira` | Formador |
| `marta.lopes` | Aluno |
| `diogo.costa` | Aluno |
| `beatriz.martins` | Aluno |
| `joao.neves` | Aluno |
| `ines.carvalho` | Aluno |
| `rafael.moreira` | Aluno |

Os emails usam o domínio reservado `example.test`. As contas demo não são contas de administração. O login rápido sem palavra-passe continua desativado por defeito e nunca permite selecionar uma conta pessoal ou um administrador.

`queirospedro` foi promovido a **ADMIN**, papel que inclui também as ferramentas de professor. A palavra-passe pessoal foi conservada. É necessário iniciar sessão novamente depois da promoção. O curso HTML/CSS foi associado a esta conta para permitir experimentar o editor com um curso existente.

Os dados atuais já foram transferidos para PostgreSQL. Os mesmos utilizadores, palavras-passe e cursos continuam disponíveis.

## Preparar novamente

```powershell
npm --prefix backend run seed
# Opcional: associar o curso HTML/CSS a um formador existente, numa base nova.
npm --prefix backend run seed -- queirospedro
```

A preparação acrescenta apenas os registos em falta. Repetir o comando não repõe palavras-passe, imagens editadas nem conteúdos alterados. Os dados de demonstração são recusados em produção. Não publique uma base com credenciais de demonstração conhecidas.

## Gestão de permissões

```powershell
npm --prefix backend run backup
npm --prefix backend run account:promote -- nome_utilizador
```

Este comando local promove uma conta existente, conserva a palavra-passe e invalida as sessões anteriores. O arranque normal não promove contas pelo nome nem cria um administrador automaticamente.
