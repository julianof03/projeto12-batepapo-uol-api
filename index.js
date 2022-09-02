import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
import joi from 'joi';
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
	db = mongoClient.db("UOLdb");
});

app.post('/participants', async (req, res) => {
    try{
        const {name} = req.body;
        db.collection("participants").insertOne({
            name,
            lastStatus: Date.now(),
        });
        
        
        res.sendStatus(201);
    } catch {
        res.sendStatus(500);
    }
    
});
app.get('/participants', async (req, res) => {
    try{
        db.collection("participants").find().toArray().then(users => {
        });  
        res.sendStatus(201);
    } catch {
        res.sendStatus(500);
    }
})

async function checkUserTime(){
    const LastTime = Date.now() - 10000;
    await mongoClient.connect();
    const awayUser = await db.collection("participants").find({lastStatus: { $lt: LastTime}}).toArray();
    await db.collection("participants").deleteOne({ id: awayUser.id });
}

setInterval(checkUserTime, 10000);

app.listen(5000), () => console.log("Listening on port 5000");