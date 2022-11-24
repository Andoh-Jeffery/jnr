const mongoose=require("mongoose")
const paymentSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    firstname:{
        type:String,
        required:true
    },
    lastname:{
        type:String,
        required:true
    },
    reference:{
        type:String,
        required:true
    }
})
module.exports=mongoose.model("Payment",paymentSchema);