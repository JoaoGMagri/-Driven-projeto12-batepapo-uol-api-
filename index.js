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

        const nameUsers = await collectionUsers.find().toArray();
        const teste = nameUsers.find(obj => obj.name === name)

        if (teste) {
            return res.status(409).send("Nome do usuario já existe");
        }

        await db.collection("users").insertOne({
            name,
            lastStatus: Date.now()
        });

        await db.collection("message").insertOne({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format("HH:mm:ss"),
        })

        res.sendStatus(201);

    } catch (err) {
        console.log("Erro com o servidor");
    }

});

app.get("/participants", async (req, res) => {

    try {
        const user = await collectionUsers.find().toArray();
        res.status(201).send(user);
    } catch (err) {
        console.log("Erro participant" + err);
    }

});

app.post("/messages", async (req, res) => {

    const { to, text, type } = req.body;
    const { user } = req.headers;
    try {

        /* const nameUsers = await collectionUsers.find({}).toArray();

        if ( !to ){
            return res.status(422).send("Campo 'to' invalido");
        } else if( !text ) {
            return res.status(422).send("Campo 'text' invalido");
        } else if( !(type === "message") || !(type !== "private_message") ) {
            return res.status(422).send("Campo 'type' invalido");
        } else if( nameUsers.find(obj => obj.name === user)) {
            return res.status(422).send("Usuario não logado");
        } */

        await db.collection("message").insertOne({
            from: user,
            to,
            text,
            type,
            time: dayjs().format("HH:mm:ss"),
        });

        res.sendStatus(201);

    } catch (err) {
        res.send("Erro com o servidor");
    }

});

app.get("/messages", async (req, res) => {

    try {
        const messageArray = await collectionMessage.find().toArray();
        res.status(201).send(messageArray);
    } catch (err) {
        console.log("Erro message" + err);
    }

});

app.listen(5000, () => {
    console.log("Server running in port: 5000")
});
