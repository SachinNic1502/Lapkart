const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
