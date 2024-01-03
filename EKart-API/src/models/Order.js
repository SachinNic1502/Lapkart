const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user who placed the order
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }], // Reference to the products in the order
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true }, // Reference to the payment associated with the order
  timestamp: { type: Date, default: Date.now }, // Order timestamp
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
