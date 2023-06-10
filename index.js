const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())

// jwt middleware
const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorize access' })
  }
  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.USER_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorize access' })
    }
    decoded.req = decoded;
    next()
  })
}

// mongodb
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.ovmmvr6.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const danceCollection = client.db("summerSchool").collection("danceClasses");
    const instructorCollection = client.db("summerSchool").collection("instructor");
    const studentSelectedClassCollection = client.db("summerSchool").collection("selectedClass");

    // jwt related api
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign({
        user
      }, process.env.USER_TOKEN, { expiresIn: '1h' });
      res.send({ token })

    })
    // dance class related api
    app.get('/classes', async (req, res) => {
      const result = await danceCollection.find().toArray();
      res.send(result)
    })
    // selected class 
    app.post('/selectedClasses/:id', async (req, res) => {
      const id = req.params.id;
      const selectedClass = req.body
      const query = { selectedClassId: id }
      const existing = await studentSelectedClassCollection.findOne(query)
      console.log(existing);
      if (existing) {
        return res.status(403).send({ error: true, message: "You already Join" })
      }
      else {
        const result = await studentSelectedClassCollection.insertOne(selectedClass);
        res.send(selectedClass)
      }
    })
    app.get('/selectedClasses', async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const result = await studentSelectedClassCollection.find(query).toArray()
      res.send(result)
    })
    app.delete('/selectedClasses/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id:new ObjectId(id) }
      const result = await studentSelectedClassCollection.deleteOne(query)
      res.send(result)
    })
    // instructor related api
    app.get('/instructor', async (req, res) => {
      const result = await instructorCollection.find().toArray();
      res.send(result)
    })







    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);










app.get('/', (req, res) => {
  res.send('summer school is in live')
})

app.listen(port, () => {
  console.log(`summer school live on port ${port}`)
})












