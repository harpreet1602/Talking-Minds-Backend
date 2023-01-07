const { number } = require('@hapi/joi');
const mongoose=require('mongoose');

const userSchema= new mongoose.Schema({
    userId: {
        type: String,
        default: "Null"
    },
    name: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    email: {
        type: String,
        required: true,
        max: 255,
        min: 6
    },
    password: {
        type: String,
        required: true,
        max: 1024,
        min: 6
    },
    otp: {
        type: Number,
        default: 0
    },
    authToken: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: Number,
        max: 9999999999,
        min: 1000000000,
        default: 1234567890
    },
    profilePictureLink: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    age: {
        type: Number,
        default: 0
    },
    gender: {
        type: String,
        default: "Null"
    }
});

module.exports=mongoose.model('User',userSchema);