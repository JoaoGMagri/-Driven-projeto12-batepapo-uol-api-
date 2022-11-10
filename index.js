import express from 'express';
import cors from 'cors';
import { MongoClient } from "mongodb";
import dayjs from 'dayjs'

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient("mongodb://localhost:27017");
await mongoClient.connect();

const db = mongoClient.db("batePapoUol");
const collectionUsers = db.collection("users");
const collectionMessage = db.collection("message");

app.post("/participants", async (req, res) => {

    const { name } = req.body;
    if (!name) {
        return res.status(422).send("Insira um nome do usuario");
    }


    try {
        const nameUsers = await collectionUsers.find({}).toArray();

        if (nameUsers.find(obj => obj.name === name)) {
            return res.status(409).send("Nome do usuario já existe");
        }

        db.collection("users").insertOne({
            name,
            lastStatus: Date.now()
        });

        db.collection("message").insertOne({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format("HH:mm:ss"),
        })

        res.status(201)

    } catch (err) {
        res.send("Erro com o servidor");
    }

})

app.get("/participants", async (req, res) => {

    const nameUsers = await collectionUsers.find({}).toArray();

    res.send(nameUsers);

})


app.listen(5000, () => {
    console.log("Server running in port: 5000")
});
