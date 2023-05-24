import express from "express";
import cors from "cors";
import mysql from 'mysql';
import bodyParser from 'body-parser';
import userRouter from './routers/user.router'
import novelRouter from "./routers/novel.router";
import dotenv from 'dotenv';
dotenv.config();

const server = express();

server.use(express.json());

server.use(cors({
    credentials: true,
    origin:["https://novel-web.netlify.app"]
}))

const urlDB = `mysql://${process.env.MYSQLUSER}:${process.env.MYSQLPASSWORD}@${process.env.MYSQLHOST}:${process.env.MYSQLPORT}/${process.env.MYSQLDATABASE}`
// const urlDB = `mysql://root:NWr6163pMSWNjjxb6W27@containers-us-west-68.railway.app:7774/railway`

// const dbUser = process.env.DB_USER;
// const dbPassword = process.env.DB_PASSWORD;
// const dbDatabase = process.env.DB_DATABASE;

const dbUser = process.env.MYSQLUSER;
const dbPassword = process.env.MYSQLPASSWORD;
const dbHost = process.env.MYSQLHOST;
const dbPort = process.env.MYSQLPORT;
const dbName = process.env.MYSQLDATABASE;

const port = parseInt(process.env.PORT || '5000', 10);
const hostname = "0.0.0.0";

// export const db = mysql.createConnection({
//     host: dbHost,
//     user: dbUser,
//     password: dbPassword,
//     database: dbName,
// })

export const db = mysql.createConnection(urlDB)

// db.connect(function(error: mysql.MysqlError) {
//     if(error){
//         console.log('Error Connecting to DB')
//     }else{
//         console.log('Succsessfully Connected to DB')
//     }
// });


server.listen(port, () => {
    console.log("Website server on http://localhost:" + port)
});



server.use("/api/novel", novelRouter);
server.use("/api/users/", userRouter);
