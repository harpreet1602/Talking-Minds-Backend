const router = require("express").Router();
const User = require("../model/User");

const multer = require("multer");
const firebase = require("firebase/app");
const admin = require("firebase-admin");
const credentials =require("../key.json");

admin.initializeApp({
  credential:admin.credential.cert(credentials)
});


const db=admin.firestore();


const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");

const firebaseConfig = {
    apiKey: "AIzaSyB-K3H5P86wmmYPbFm94jy1lEQXC8q89hI",
    authDomain: "talkingminds-52a22.firebaseapp.com",
    projectId: "talkingminds-52a22",
    storageBucket: "talkingminds-52a22.appspot.com",
    messagingSenderId: "1051512440402",
    appId: "1:1051512440402:web:dbc273119a08525c6b018b"
};

firebase.initializeApp(firebaseConfig);

const storage = getStorage();
const upload = multer({ storage: multer.memoryStorage() });


// app.post("/", upload.single("filename"), async (req, res) => {
//     const storageRef = ref(storage, `files/${req.file.originalname}`);
//     const orderId=req.body.orderId;
//     const resId=req.body.resId;
  
//     const snap=await uploadBytes(storageRef, req.file.buffer).then((snapshot) => {
//       console.log("file uploaded");
//       getDownloadURL(ref(storage, `files/${req.file.originalname}`)).then((url)=> {
//         console.log("URL: "+url);
  
//         try{
//           const userJson={
//               orderId: orderId,
//               resId: resId,
//               foodImgURL: url
//           };
//           const response=db.collection("users").doc(orderId).set(userJson);
//           console.log(userJson);
//       } catch(error) {
//           console.log(error);
//       }
        
//       });
//     });
  
//     console.log(req.file);
//     res.status(200).send({ resCode: 200, message: "File,User Uploaded Successfully" });
//   });



//Update Profile (Post)
router.post("/updateProfile", upload.single("filename"), async function (req, res) {
    var userId= req.body.userId;
    var mobileNumber=req.body.mobileNumber;
    var age=req.body.age;
    var gender=req.body.gender;
    const storageRef = ref(storage, `files/${req.file.originalname}`);

    const snap=await uploadBytes(storageRef, req.file.buffer).then((snapshot) => {
        console.log("file uploaded");
        getDownloadURL(ref(storage, `files/${req.file.originalname}`)).then((url)=> {
          console.log("URL: "+url);

          User.updateOne(
            { userId: userId },
            { $set: { profilePictureLink: url } }
          );
          try{
            const userJson={
                userId: userId,
                profilePictureURL: url
            };
            const response=db.collection("users").doc(userId).set(userJson);
            console.log(userJson);
        } catch(error) {
            console.log(error);
        }

        });
    });
   
    await User.updateOne(
      { userId: userId },
      { $set: { mobileNumber: mobileNumber } }
    );
  
    // await User.updateOne(
    //   { userId: userId },
    //   { $set: { profilePictureLink: storingURL } }
    // );

  
    await User.updateOne(
      { userId: userId },
      { $set: { age: age } }
    );
  
    await User.updateOne(
      { userId: userId },
      { $set: { gender: gender } }
    );
  
    res.status(200).send({ resCode: 200, message: "Profile Updated Successfully!!" });
});
  
  
//Get Profile (Get)
router.get("/getProfile/:userId", async function (req, res) {
    var userId = req.params['userId'];
    var objectFinding = await User.findOne({ userId: userId });
    var name=objectFinding.name;
    var email=objectFinding.email;
    var mobileNumber=objectFinding.mobileNumber;
    var age=objectFinding.age;
    var gender=objectFinding.gender;

    const snapshot=await db.collection("users").get();
    const list=snapshot.docs.map((doc)=>doc.data());
    // console.log(snapshot);
    // console.log(list);
  
    let arr=[];
    for(let i=0;i<list.length;i++)
    {
        if(list[i].userId == userId)
        {
            arr.push(list[i]);
            // console.log(arr[0].profilePictureURL);
        }
    }
  
    res.status(200).send({ resCode: 200, name: name, email: email, mobileNumber: mobileNumber, profilePictureURL: arr[0].profilePictureURL, age: age, gender: gender });
});
  
  
//Put Request in Profile
router.put("/changeProfile", async function (req, res) {
    var userId= req.body.userId;
    var name=req.body.name;
    var email=req.body.email;
    var mobileNumber=req.body.mobileNumber;
    var age=req.body.age;
    var gender=req.body.gender;
  
    await User.updateOne(
      { userId: userId },
      { $set: { name: name } }
    );
    await User.updateOne(
      { userId: userId },
      { $set: { email: email } }
    );
    await User.updateOne(
      { userId: userId },
      { $set: { mobileNumber: mobileNumber } }
    );
    await User.updateOne(
      { userId: userId },
      { $set: { age: age } }
    );
    await User.updateOne(
      { userId: userId },
      { $set: { gender: gender } }
    );
  
    res.status(200).send({ resCode: 200, message: "Profile Updated Successfully!!" });
});
  
  
module.exports = router;


