import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
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

const users = [];
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
app.get('/participants', (req, res) => {
    try{
        db.collection("participants").find().toArray().then(users => {
            console.log(users); 
        });  
        res.sendStatus(201);
    } catch {
        res.sendStatus(500);
    }
})

app.listen(5000), () => console.log("Listening on port 5000");