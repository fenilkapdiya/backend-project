// require('dotenv').config({path: './.env'});
import dotenv from 'dotenv';
dotenv.config({path: './.env'});

import connectDB from './db/index.js';
import app from './app.js';



connectDB().then(() => {
    app.on('error', (err) => {
       console.error('Server error:', err);
       throw err;
   });
   app.listen(process.env.PORT || 8000, () => {
       console.log(`Server is running on port ${process.env.PORT || 8000}`);
   });
}).catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
});




// import express from 'express';
// const app = express();

// (async () => {
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on('error', (err) => {
//             console.error('Server error:', err);
//             throw err;
//         });
//         app.listen(process.env.PORT, () => {
//             console.log(`Server is running on port ${process.env.PORT}`);
//         });
//     }catch(err){
//         console.error('Database connection error:', err);
//         throw err;
//     }
// })();