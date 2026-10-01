import { validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array();
    return res.status(400).json({
      errors: errorList,
      message: errorList[0]?.msg || 'Erro de validação dos dados.',
      error: errorList[0]?.msg || 'Erro de validação dos dados.'
    });
  }
  next();
};
