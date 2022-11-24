const mongoose=require('mongoose')
const checkOut=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
    },
    address:{
        type:String,
        required:true,
        unique:true
    },
    name:{
        type:String,
        required:true,
        unique:true
    },
    location:{
        type:String,
        required:true,
        unique:true
    }
})
module.exports=mongoose.model('CheckOut',checkOut);