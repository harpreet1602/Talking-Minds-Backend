const router=require('express').Router();
const verify=require('./verifyToken');

router.get('/',verify,(req,res)=>{
    res.json({posts:{
        title:'my first post',
        description:'random data you shouldnt access without being logged in!'
    }});

    //For Getting Individual Users
    // res.send(req.user);
    // User.findbyOne({id:req.user})
});

module.exports=router;