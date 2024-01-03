const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); 
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    addresses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    }],
    phoneNumber: { type: String },
    dateOfBirth: { type: Date },
    // gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    gender: { type: String},
    newsletterSubscription: { type: Boolean, default: false },
    profilePicture: { type: String }
});
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
