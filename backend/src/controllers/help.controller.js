const { helpFaq } = require('../content/helpFaq.js');
const getHelpFaq = (_req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json(helpFaq);
};
exports.getHelpFaq = getHelpFaq;
