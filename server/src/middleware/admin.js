export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Não autorizado. Autenticação necessária.',
      error: 'Não autorizado. Autenticação necessária.'
    });
  }

  const isAdmin = req.user.role === 'ADMIN' || req.user.isAdmin === true;
  if (!isAdmin) {
    return res.status(403).json({
      message: 'Acesso negado. Apenas administradores podem realizar esta operação.',
      error: 'Acesso negado. Apenas administradores podem realizar esta operação.'
    });
  }

  next();
};

export const requireCreator = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Não autorizado. Autenticação necessária.',
      error: 'Não autorizado. Autenticação necessária.'
    });
  }

  const isCreatorOrAdmin = req.user.role === 'CREATOR' || req.user.role === 'ADMIN' || req.user.isAdmin === true;
  if (!isCreatorOrAdmin) {
    return res.status(403).json({
      message: 'Acesso negado. Apenas criadores e administradores têm permissão.',
      error: 'Acesso negado. Apenas criadores e administradores têm permissão.'
    });
  }

  next();
};
