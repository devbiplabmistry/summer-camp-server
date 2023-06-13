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
    const addClassCollection = client.db("summerSchool").collection("addedClass");
    const userCollection = client.db("summerSchool").collection("allUsers");
    const feedbackCollection = client.db("summerSchool").collection("feedback");

    // jwt related api
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign({
        user
      }, process.env.USER_TOKEN, { expiresIn: '1h' });
      res.send({ token })

    })


    // verify admin middleware
    const verifyAdmin = (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = userCollection.findOne(query)
      if (user?.role !== 'Admin') {
        res.send({ error: true, message: 'unauthorize access' })
      }
      next()
    }

    // verify instructor

    const verifyInstructor = (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = userCollection.findOne(query)
      if (user?.role !== 'Instructor') {
        res.send({ error: true, message: 'unauthorize access' })
      }
      next()
    }
    //  const verify student
    const verifyStudent = (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = userCollection.findOne(query)
      if (user?.role !== 'student') {
        res.send({ error: true, message: 'unauthorize access' })
      }
      next()
    }

    // dance class related api
    app.get('/classes', async (req, res) => {
      const result = await danceCollection.find().toArray();
      res.send(result)
    })
    // selected class 
    app.post('/selectedClasses/:id', async (req, res) => {
      const id = req.params.id;
      const selectedClass = req.body
      console.log(selectedClass);
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
    app.get('/selectedClasses/student', async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const result = await studentSelectedClassCollection.find(query).toArray()
      res.send(result)
    })
    app.get('/selectedClasses', async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const result = await studentSelectedClassCollection.find(query).toArray()
      res.send(result)
    })
    app.delete('/selectedClasses/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await studentSelectedClassCollection.deleteOne(query)
      res.send(result)
    })
    // instructor related api
    app.get('/instructor/addClass', async (req, res) => {
      const result = await addClassCollection.find().toArray();
      res.send(result)
    })
    app.get('/instructor/addClass/:email', async (req, res) => {
      const email = req.params.email;
      const query = { instructorEmail: email }
      const result = await addClassCollection.find(query).toArray();
      res.send(result)
    })
    app.post('/instructor/addClass/', async (req, res) => {
      const classes = req.body;
      const result = await addClassCollection.insertOne(classes);
      res.send(result)
    })
    app.get('/instructor', async (req, res) => {
      const result = await instructorCollection.find().toArray()
      res.send(result)
    })

    app.patch('/instructor/addClass/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: 'approved'
        },
      };
      const result = await addClassCollection.updateOne(query, updateDoc);
      res.send(result)
    })
    app.patch('/instructor/addClass/deny/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: 'Denied'
        },
      };
      const result = await addClassCollection.updateOne(query, updateDoc);
      res.send(result)
    })
    // users related api 
    app.post('/allUsers', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }
      const result = await userCollection.insertOne(users);
      res.send(result)
    })
    app.get('/allUsers', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result)
    })
    app.get('/allUsers/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const user = await userCollection.findOne(query)
      const result = { admin: user?.role === 'Admin' }
      res.send(result)
    })
    app.get('/allUsers/instructor/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const user = await userCollection.findOne(query)
      const result = { Instructor: user?.role === 'Instructor' }
      res.send(result)
    })
    app.get('/allUsers/student/:email', async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      const query = { email: email }
      const user = await userCollection.findOne(query)
      // console.log(user);
      const result = { student: user?.role === 'student' }
      res.send(result)
    })


    app.patch('/allUsers/admin/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: 'Admin'
        },
      };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result)
    })
    app.patch('/allUsers/instructor/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: 'Instructor'
        },
      };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result)
    })

    // feedback
    app.post('/feedback/:id', async (req, res) => {
      const id = req.params.id
      const feedback = req.body;
      const result = await feedbackCollection.insertOne(feedback);
      res.send(result)
    })
    app.get('/feedback/:id', async (req, res) => {
      const id = req.params.id;
      const query = { feedbackId: id }
      const result = await feedbackCollection.findOne(query);
      res.send(result)
    })
    // payments related api
    // console.log(process.env.PAYMENTS_TOKEN);
    const stripe = require("stripe")(process.env.PAYMENTS_TOKEN);
    app.post("/create-payment-intent",  async (req, res) => {
      const { price } = req.body;
      console.log(price);
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        "payment_method_types": ["card"]
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });



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












