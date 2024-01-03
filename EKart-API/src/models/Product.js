const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    brandName: { type: String },
    model: { type: String },
    generation: { type: String },
    ram: { type: String },
    ramType: { type: String },
    ssd: { type: String },
    ssdType: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    images: [String],
    quantity: { type: Number, default: 0 }, 
    price: { type: Number, default: 0 }   
    // Add more fields as needed
  });
  

const Product = mongoose.model('Product', productSchema);

module.exports = Product;


