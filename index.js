import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";
import dayjs from 'dayjs'
import joi from 'joi'

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient("mongodb://localhost:27017");
await mongoClient.connect();

const db = mongoClient.db("batePapoUol");
const collectionUsers = db.collection("users");
const collectionMessage = db.collection("message");

const validateUsers = joi.object({
    name: joi.string().required(),
    lastStatus: joi.number().required(),
});

const validateMessage = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required().valid("message", "private_message"),
});

app.post("/participants", async (req, res) => {

    const { name } = req.body;

    const objUser = {
        name,
        lastStatus: Date.now()
    };

    const validationUser = validateUsers.validate(objUser, { abortEarly: false });

    if (validationUser.error) {
        const erros = validation.error.details.map((detail) => detail.message);
        res.status(422).send(erros);
        return;
    }

    try {

        const nameUsers = await collectionUsers.find().toArray();
        const teste = nameUsers.find(obj => obj.name === name)

        if (teste) {
            return res.status(409).send("Nome do usuario já existe");
        }

        await db.collection("users").insertOne(objUser);

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

    const objMessage = {
        to,
        text,
        type,
    }

    const validationMessage = validateMessage.validate(objMessage);

    if (validationMessage.error) {
        const erros = validationMessage.error.details.map((detail) => detail.message);
        res.status(422).send(erros);
        return;
    }

    try {

        const nameUsers = await collectionUsers.find().toArray();

        if( !(nameUsers.find(obj => obj.name === user)) ) {
            return res.status(409).send("Usuario não logado");
        }

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

    const { user } = req.headers;
    let limit = parseInt(req.query.limit);

    try {

        let array = await collectionMessage
            .find({ $or: [{ "from": user }, { "type": "message" }, { "to": user }, { "to": "Todos" }] })
            .toArray();

        const arrayLeng = array.length;
        const arrayFilter = [];

        for (let i = arrayLeng - limit; i < arrayLeng; i++) {
            arrayFilter.push(array[i]);
        }

        res.status(201).send(arrayFilter);
    } catch (err) {
        console.log("Erro message" + err);
    }

});

app.post("/status", async (req, res) => {

    const { user } = req.headers;
    const lastStatus = { $set: { lastStatus: Date.now() } }

    try {

        const partUsers = await collectionUsers.find({ name: user }).toArray();
        console.log(partUsers)
        console.log(partUsers.length)
        if (partUsers.length === 0) {
            return res.sendStatus(404)
        }

        collectionUsers.updateOne( { name: user }, lastStatus );


        res.sendStatus(200);

    } catch (error) {
        console.log("Erro message" + err);
    }

})

setInterval(async () => {

    try {

        const nameUsers = await collectionUsers.find().toArray();

        for (let i = 0; i < nameUsers.length; i++) {

            const temp = Date.now() - nameUsers[i].lastStatus;
            const id = nameUsers[i]._id;

            if (temp >= 10000) {

                await db.collection("users").deleteOne({ _id: ObjectId(id) });

                await db.collection("message").insertOne({
                    from: nameUsers[i].name,
                    to: 'Todos',
                    text: 'sai da sala...',
                    type: 'status',
                    time: dayjs().format("HH:mm:ss"),
                })

            }

        }

    } catch (error) {
        console.log(error)
    }

}, 15000)

app.listen(5000, () => {
    console.log("Server running in port: 5000")
});
