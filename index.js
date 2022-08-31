import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const users = [];
app.post('/participants', (req, res) => {
    const userName = req.body;
    users.push(userName);
    res.sendStatus(202);
});

app.listen(5000), () => console.log("Listening on port 5000");