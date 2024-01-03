const mongoose = require('mongoose');

const orderItemsSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  // Add other relevant order item details as needed
});

const OrderItems = mongoose.model('OrderItems', orderItemsSchema);

module.exports = OrderItems;
