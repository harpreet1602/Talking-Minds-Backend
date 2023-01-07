const router = require("express").Router();
const User = require("../model/User");
const verify= require('./verifyToken');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// const {readFileSync, promises: fsPromises} = require('fs');

// const cors = require("cors");
// router.use(cors({
//   origin: "*",
// }));

const {
  registerValidation,
  loginValidation,
  resendOtpValidation,
  otpValidation,
} = require("../validation");
const dotenv = require("dotenv");
dotenv.config();
const bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: true }));

var otp = 0;
var expAt = "";

var SibApiV3Sdk = require("sib-api-v3-sdk");
const { db } = require("../model/User");
const { Collection } = require("mongoose");
SibApiV3Sdk.ApiClient.instance.authentications["api-key"].apiKey =
  process.env.API_KEY;

function random() {
  otp = Math.floor(100000 + Math.random() * 900000);
  return otp;
}


//--------------------------------Signup--------------------------------------------------------------------------------
router.post("/signup", async (req, res) => {
  var isEmailinDb=false;
  //Lets validate the data before we make a user
  const { error } = registerValidation(req.body);
  if (error)
    return res
      .status(400)
      .send({
        resCode: 400,
        message: error.details[0].message,
        name: "",
        email: "",
      });

  //Checking if the user is already in the database
  const emailExist = await User.findOne({ email: req.body.email });
  if(emailExist && emailExist.otp==1) {
    return res
      .status(400)
      .send({
        resCode: 400,
        message: "Email already exists",
        name: "",
        email: "",
      });
  }

  if(emailExist && emailExist.otp!=1) {
    isEmailinDb=true;
  }

  //Hash passwords
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  //Create a new user
  const user = new User({
    userId: "Null",
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
    authToken: "No Token",
  });

  if(isEmailinDb==false) {
    var savedUser = await user.save();
    var dbObject = await User.findOne({ email: req.body.email });
      var newuserId=dbObject._id.toString();
      var userId=newuserId.substring(0,24);
      var dbResponse=await db.collection("users").updateOne(
        { email: req.body.email },
        { $set: { userId: userId } }
      );
  }

  try {
    var otp = random();
    new SibApiV3Sdk.TransactionalEmailsApi()
      .sendTransacEmail({
        subject: "OTP for Verify",
        sender: { email: "api@sendinblue.com", name: "Talking Minds" },
        replyTo: { email: "api@sendinblue.com", name: "Talking Minds" },
        to: [{ name: user.name, email: user.email }],
        htmlContent:
          "<html><body><h1>Your One time password is  " +
          otp +
          " {{params.bodyMessage}}</h1></body></html>",
        params: { bodyMessage: "   It is valid for 10 mins." },
      })
      .then(
        async function (data) {
          createdAt = Date.now();
          expAt = Date.now() + 360000;
          res
            .status(200)
            .send({
              resCode: 200,
              message: "OTP sent on Email",
              name: user.name,
              email: user.email,
            });
          const updated_otp = await User.findOneAndUpdate(
            { email: user.email },
            { otp: otp }
          );
        },
        function (error) {
          console.error(error);
        }
      );
  } catch (err) {
    res.status(400).send({ resCode: 400, message: err, name: "", email: "" });
  }
});

//Login
router.post("/login", async (req, res) => {
  //Lets validate the data before we make a user
  const { error } = loginValidation(req.body);
  if (error)
    return res
      .status(400)
      .send({
        resCode: 400,
        message: error.details[0].message,
        name: "",
        email: "",
        authToken: "",
        userId: ""
      });

  //Checking if the email exists
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return res
      .status(400)
      .send({
        resCode: 400,
        message: "Email not found",
        name: "",
        email: "",
        authToken: "",
        userId: ""
      });

  //Password is correct
  const validPass = await bcrypt.compare(req.body.password, user.password);
  if (!validPass)
    return res
      .status(400)
      .send({
        resCode: 400,
        message: "Invalid Password",
        name: "",
        email: "",
        authToken: "",
        userId: ""
      });

      var dbObject = await User.findOne({ email: req.body.email });
      var newuserId=dbObject._id.toString();
      var userId=newuserId.substring(0,24);

  const checkOtp = await User.findOne({ email: req.body.email });
  if (checkOtp.otp != 1) {
    return res
      .status(400)
      .send({
        resCode: 400,
        message: "Email not Verified using OTP",
        name: user.name,
        email: user.email,
        authToken: "",
        userId: ""
      });
  } else {
    User.find({ email: req.body.email }, function (err, val) {
      const token = val[0].authToken;
      return res
        .status(200)
        .send({
          resCode: 200,
          message: "Logged in!",
          name: user.name,
          email: user.email,
          authToken: token,
          userId: userId
        });
    });
  }
});

//OTP
router.post("/otp", async function (req, res) {
  //Lets validate the data before we make a user
  const { error } = otpValidation(req.body);
  if (error)
    return res
      .status(400)
      .send({ resCode: 400, message: error.details[0].message, authToken: "", userId: "" });

  var collection = db.collection("users");
  var email = req.body.email;
  var checkVal = req.body.responseFrom;

  if (checkVal == 6) {
    const otp_stored = await User.findOne({ email: email }, { otp: 1 });
    const otp_check = req.body.otp;
    if (otp_stored.otp == otp_check) {
      var curr = Date.now();
      if (curr > expAt) {
        res.status(400).send({ resCode: 400, message: "OTP Expired", authToken: "", userId: "" });
      } 
      else {
        //Create and assign a token
        const token = jwt.sign({ _id: User._id }, process.env.TOKEN_SECRET);
        res.header("auth-token", token);
        collection.updateOne({ email: email }, { $set: { authToken: token } });
        collection.updateOne({ email: email }, { $set: { otp: 1 } });
        var dbObject = await User.findOne({ email: email });
        var newuserId=dbObject._id.toString();
        var userId=newuserId.substring(0,24);
        res
          .status(200)
          .send({
            resCode: 200,
            message: "User Successfully Registered",
            authToken: token,
            userId: userId
          });
      }
    } else {
      res
        .status(400)
        .send({ resCode: 400, message: "Invalid OTP", authToken: "", userId: "" });
    }
  } else if (checkVal == 8) {
    //---------------------For Forget Password Work----------------------------------------------------------------
    
    const otp_stored = await User.findOne({ email: email }, { otp: 1 });
    const otp_check = req.body.otp;
    if (otp_stored.otp == otp_check) {
      var curr = Date.now();
      if (curr > expAt) {
        res.status(400).send({ resCode: 400, message: "OTP Expired", authToken: "", userId: "" });
      } else {
       
        collection.updateOne({ email: email }, { $set: { otp: 1 } });
        res
          .status(200)
          .send({ resCode: 200, message: "Email Verified", authToken: "", userId: "" });
      }
    } 
    else {
      res
        .status(400)
        .send({ resCode: 400, message: "Invalid OTP", authToken: "", userId: "" });
    }
  } else {
    res.send("Went to Else for OTP");
  }
});

//Resend OTP
router.post("/resendOTP", async function (req, res) {
  const { error } = resendOtpValidation(req.body);
  if (error)
    return res
      .status(400)
      .send({
        resCode: 400,
        message: error.details[0].message
      });
  var email = req.body.email;

  var objectFinding = await User.findOne({ email: email });
  if(objectFinding==null)
  {
    return res
    .status(400)
    .send({ resCode: 400, message: "Email doesn't exist"});
  }

  try {
    var otp = random();
    new SibApiV3Sdk.TransactionalEmailsApi()
      .sendTransacEmail({
        subject: "OTP for Verify",
        sender: { email: "api@sendinblue.com", name: "Talking Minds" },
        replyTo: { email: "api@sendinblue.com", name: "Talking Minds" },
        to: [{ email: email }],
        htmlContent:
          "<html><body><h1>Your One time password is  " +
          otp +
          " {{params.bodyMessage}}</h1></body></html>",
        params: { bodyMessage: "   It is valid for 10 mins." },
      })
      .then(
        function (data) {
          createdAt = Date.now();
          expAt = Date.now() + 360000;
          res.send({
            resCode: 200,
            message: "OTP sent on Email"
          });
          db.collection("users").updateOne(
            { email: email },
            { $set: { otp: otp } }
          );
        },
        function (error) {
          console.error(error);
        }
      );
  } catch (err) {
    res.status(400).send({ resCode: 400, message: err});
  }
});

//Forgot Password
router.post("/forgetPassword", async function (req, res) {
  const salt = await bcrypt.genSalt(10);
  hashedPassword = await bcrypt.hash(req.body.newPassword, salt);
  email = req.body.email;
  password = hashedPassword;

  var dbResponse=await db.collection("users").updateOne(
    { email: email },
    { $set: { password: password } }
  );
  if(dbResponse.modifiedCount==1) {
    res.status(200).send({ resCode: 200, message: "Password updated" });
  }
  else
  {
    res.status(400).send({ resCode: 400, message: "Details are not Correct!!" });
  }
});


//Update Profile (Post)
router.post("/updateProfile", async function (req, res) {
  var userId= req.body.userId;
  var mobileNumber=req.body.mobileNumber;
  var link=req.body.link;
  var age=req.body.age;
  var gender=req.body.gender;
 
  await db.collection("users").updateOne(
    { userId: userId },
    { $set: { mobileNumber: mobileNumber } }
  );

  await db.collection("users").updateOne(
    { userId: userId },
    { $set: { profilePictureLink: link } }
  );

  await db.collection("users").updateOne(
    { userId: userId },
    { $set: { age: age } }
  );

  await db.collection("users").updateOne(
    { userId: userId },
    { $set: { gender: gender } }
  );

  res.status(200).send({ resCode: 200, message: "Profile Updated Successfully!!" });
});


//Get Profile (Get)
router.get("/getProfile/:userId",verify, async function (req, res) {
  var userId = req.params['userId'];
  var objectFinding = await User.findOne({ userId: userId });
  var mobileNumber=objectFinding.mobileNumber;
  var link=objectFinding.profilePictureLink;
  var age=objectFinding.age;
  var gender=objectFinding.gender;

  res.status(200).send({ resCode: 200, mobileNumber: mobileNumber, link: link, age: age, gender: gender });
});


//Initial Profile
router.post("/initialProfile", async function (req, res) {
  var userId= req.body.userId;
  var age=req.body.age;
  var gender=req.body.gender;

  await db.collection("users").updateOne(
    { userId: userId },
    { $set: { age: age } }
  );

  await db.collection("users").updateOne(
    { userId: userId },
    { $set: { gender: gender } }
  );

  res.status(200).send({ resCode: 200, message: "Initial Profile Updated Successfully!!" });
});


//Main Dashboard
router.post("/mainDashboard", async function (req, res) {
  res.status(200).send({ resCode: 200, message: "Main Dashboard Data Successfully Given!!!" });
});


module.exports = router;
