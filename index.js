//for express
const express = require('express');
const app = express();
//foe data cors policy
var cors = require('cors');
//for dotenv
require ('dotenv').config();
//for   mongodb
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');


const port = process.env.PORT || 5000;
const datas = require('./data/rooms.json');


// use   middleware
app.use(express.json());
app.use(cors());



//  mongodb user and pass
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aatv5yk.mongodb.net/?retryWrites=true&w=majority`;


//Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
    //await client.connect();

//mongodb databage


const contactCollection = client.db('aircnc').collection('contacts');





//*---------------------------contacts--------------------------*

    //get data contacts  from  client
    app.post('/contacts', async( req, res) => {
        const contact = req.body;
        console.log(contact);
        const result = await contactCollection.insertOne(contact);
        res.send(result);
    })
    
    
  
    //SHOW contacts  allDATA   IN SERVER SITE 
    app.get('/contacts', async( req, res) => {
      const cursor = contactCollection.find();
          const result = await cursor.toArray();
      res.send(result);
  })
  
  //SHOW contacts  DATA   IN SERVER SITE  BY ID  
  app.get('/contacts/:id', async(req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await contactCollection.findOne(query);
    res.send(result);
  
  
  })
  


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);app.get('/', (req, res) => {
    res.send('!welcome to   aircnc')
  })





app.get('/rooms', (req, res) => {
    res.send(datas);
})



app.get('/rooms/:id', (req, res) => {
    const {id} = req.params;
    const selectedData = datas.find(n => n.id ==id) || {} ;
    res.send(selectedData);
})



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})