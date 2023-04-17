// import express from "express";
// import cors from "cors";
// import mysql from 'mysql';
// import bodyParser from 'body-parser';
// import foodRouter from './routers/food.router'
// import userRouter from './routers/user.router'

// const app = express();

// app.use(express.json());

// app.use(cors({
//     credentials: true,
//     origin:["http://localhost:4200"]
// }))

// app.use("/api/foods", foodRouter);
// app.use("/api/users/", userRouter);
        
// const port = 5000;
// app.listen(port, () => {
//     console.log("Website server on http://localhost:" + port)
// })






// const express = require('express');
// const bodyParser = require('body-parser');
// const mysql = require('mysql');

import express from "express";
import cors from "cors";
import mysql from 'mysql';
import bodyParser from 'body-parser';
import userRouter from './routers/user.router'
import novelRouter from "./routers/novel.router";

const server = express();

server.use(express.json());

server.use(cors({
    credentials: true,
    origin:["http://localhost:4200"]
}))

const port = 5000;

export const db = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: '123456',
    database: 'dbtt'
})

db.connect(function(error: mysql.MysqlError) {
    if(error){
        console.log('Error Connecting to DB')
    }else{
        console.log('Succsessfully Connected to DB')
    }
});


server.listen(port, () => {
    console.log("Website server on http://localhost:" + port)
});



server.use("/api/novel", novelRouter);
server.use("/api/users/", userRouter);
