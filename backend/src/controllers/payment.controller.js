const { simulatePayment, getPaymentHistory } = require('../services/payments.js');
const getPayment = async (req, res) => res.json(await getPaymentHistory(req.user.id));
const postPaymentSimulateByCourseId = async (req, res, next) => {
  try {
    res.json(await simulatePayment(req.user, req.params.courseId, req.body));
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({
        error: error.message,
      });
    next(error);
  }
};

exports.getPayment = getPayment;
exports.postPaymentSimulateByCourseId = postPaymentSimulateByCourseId;
