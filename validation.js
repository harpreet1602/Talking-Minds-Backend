//VALIDATION
const Joi = require('@hapi/joi');

//Register Validation
const registerValidation=(data)=>{
    const schema=Joi.object({
        name:Joi.string().min(3).required(),
        email:Joi.string().required().email(),
        password:Joi.string().min(6).required()
    });
    return schema.validate(data);
};

//Resend OTP Email Validation
const resendOtpValidation=(data)=>{
    const schema=Joi.object({
        email:Joi.string().required().email()
    });
    return schema.validate(data);
};

//OTP Validation
const otpValidation=(data)=>{
    const schema=Joi.object({
        email:Joi.string().required().email(),
        otp:Joi.string().min(6).required(),
        responseFrom:Joi.string().min(1).required()
    });
    return schema.validate(data);
};

//Login Validation
const loginValidation=(data)=>{
    const schema=Joi.object({
        email:Joi.string().required().email(),
        password:Joi.string().min(6).required()
    });
    return schema.validate(data);
};

module.exports.registerValidation=registerValidation;
module.exports.resendOtpValidation=resendOtpValidation;
module.exports.loginValidation=loginValidation;
module.exports.otpValidation=otpValidation;