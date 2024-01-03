const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  paymentId: { type: String, required: true },
  paymentDate: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' },
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
