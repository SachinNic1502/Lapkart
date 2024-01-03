const express=require("express");
const eKartRouter=require("./routers/ekart")
require('./db/dbConnection');
const app=express();
const cors = require('cors');
app.use(express.json());
app.use(cors());
app.use(eKartRouter);
const PORT=3000
app.listen(PORT,()=>{
    console.log("app is running on port",PORT);
})
