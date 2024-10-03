import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js"

const app = express();

//connecting to mongoDB
mongoose
.connect(process.env.DATABASE)
.then(()=> {
    console.log("Connected to database successfully");
    //routes middleware
    app.use("/api",authRoutes);
})
.catch((err)=> console.log(`Error while connecting to database: ${err}`));

//middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));




app.listen(8080,()=>{
    console.log("server listening on port 8080");
});