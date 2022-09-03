import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
import dotenv from "dotenv";
import joi from "joi";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

let db;
const mongoClient = new MongoClient(process.env.MONGO_URI);
mongoClient.connect().then(() => { db = mongoClient.db("UOLdb");});

const nameSchema = joi.object({ name: joi.string().min(1).required(),});
const messageSchema = joi.object({
    to: joi.string().min(1).required(),
    text: joi.string().min(1).required(),
    type: joi.valid('message', 'private_message'),
});
app.post('/participants', async (req, res) => {
    const { name } = req.body;

    const validateName = nameSchema.validate(req.body);

    if (validateName.error) {
        res.sendStatus(422);
    }
    const OnlineUser = await db.collection("participants").findOne({name});
    if(OnlineUser){
        res.status(409).send("Usuario ja existente");
        return    
    }
    try {    
        db.collection("participants").insertOne({
            name,
            lastStatus: Date.now(),
        });
        db.collection("messages").insertOne(
        {
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format("HH:mm:ss")
        }
        );
        res.sendStatus(201);
    } catch {
        res.sendStatus(500);
    }

});
app.get('/participants', async (req, res) => {
    try {
        const participantes = await db.collection("participants").find({}).toArray();
        res.send(participantes);
    } catch {
        res.sendStatus(500);
    }
});
app.post('/messages', async (req, res) => {
    const { to, text, type } = req.body;
    const { user } = req.headers;
    const validation = messageSchema.validate(req.body);
    try {
        if(!validation.error){
            await db.collection("messages").insertOne(
                {
                    from: user,
                    to,
                    text,
                    type,
                    time: dayjs().format("HH:mm:ss")
                });
                res.sendStatus(201);
                return
        }
        res.send(validation.error);
        return       
    } catch {
        res.sendStatus(500);
    }
});

app.get('/messages', async (req, res) => {
    const { user } = req.headers;
    const limit = req.query.limit;
    if(limit === null){
        limit = 100;
    }
    await db.collection("messages").deleteMany({ from: null });
    const list = await db.collection("messages")
    .find(
        {
            $or: [{to: 'Todos'}, {to: user}, {from: user}]
        }
    ).limit(20).sort({_id: -1}).toArray();
    res.send(list.reverse());
});
app.post('/status', async (req, res) => {
    const {user} = req.headers;
    const newStatus = await db.collection("participants").findOne({name: user});
    if(newStatus != null){
        await db.collection('participants').updateOne({
            lastStatus: newStatus.lastStatus,
        },
        {
            $set: {lastStatus: Date.now()}
        });
        res.sendStatus(201);
        return
    } 
    res.sendStatus(404);
})

async function checkUserTime() {
    const LastTime = Date.now() - 10000;
    await mongoClient.connect();
    const awayUser = await db.collection("participants").find({ lastStatus: { $lt: LastTime } }).toArray();

    if(awayUser != null){     
        awayUser.forEach(part =>{
            console.log(part.name);
            db.collection("participants").deleteOne({ id: part.id });
            db.collection("messages").insertOne(
                {
                    from: part.name,
                    to: 'Todos',
                    text: 'sai da sala...',
                    type: 'status',
                    time: dayjs().format("HH:mm:ss")
                }
            );
        });
        return
    }
}

setInterval(checkUserTime, 5000);

app.listen(5000), () => console.log("Listening on port 5000");