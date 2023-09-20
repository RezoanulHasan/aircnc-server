//for express
const express = require('express');
const app = express();
//foe data cors policy
var cors = require('cors');
//for dotenv
require ('dotenv').config();
//for   mongodb
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
//for jwt token
const jwt = require('jsonwebtoken');
//for stripe
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)

//mail
const nodemailer = require('nodemailer')
const port = process.env.PORT || 5000;
//const datas = require('./data/rooms.json');


// use   middleware
app.use(express.json());
app.use(cors());


//(verifyJWT)
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}




// Send Email
const sendMail = (emailData, emailAddress) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS,
    },
  })

  // verify connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.log(error)
    } else {
      console.log('Server is ready to take our messages')
    }
  })

  const mailOptions = {
    from: process.env.EMAIL,
    to: emailAddress,
    subject: emailData?.subject,
    html: `<p>${emailData?.message}</p>`,
  }

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error)
    } else {
      console.log('Email sent: ' + info.response)
    }
  })
}









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
const usersCollection = client.db("aircnc").collection("users");
const roomsCollection = client.db('aircnc').collection('rooms')
const bookingsCollection = client.db('aircnc').collection('bookings')



    //*---------------------------using jwt--------------------------*

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '7d' })
      res.send({ token })
    })


     // Warning: use verifyJWT before using ( verifyAdmin)
     const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }


    //verifyJWT,verifyAdmin , 


//*---------------------------users--------------------------*
// Get all users
app.get('/users', async  (req, res) => {
  const result = await usersCollection.find().toArray();
  res.send(result);
});


// Register a new user
app.post('/users', async (req, res) => {
  const user = req.body;
  const query = { email: user.email };
  const existingUser = await usersCollection.findOne(query);
  if (existingUser) {
    return res.send({ message: 'User already exists' });
  }
  const result = await usersCollection.insertOne(user);
  res.send(result);
});





// Verify if a user is an admin
//verifyJWT
app.get('/users/admin/:email',  verifyJWT, async (req, res) => {
  const email = req.params.email;
  if (req.decoded.email !== email) {
    res.send({ admin: false });
  }
// email cheak
  const query = { email: email };
  const user = await usersCollection.findOne(query);
   // check admin
  const result = { admin: user?.role === 'admin' };
  res.send(result);
});

// Promote a user to admin
app.patch('/users/admin/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      role: 'admin',
    },
  };

  const result = await usersCollection.updateOne(filter, updateDoc);
  res.send(result);
});





// Verify if a user is an host
app.get('/users/host/:email', verifyJWT,  async (req, res) => {
  const email = req.params.email;
  if (req.decoded.email !== email) {
    res.send({ host: false });
  }
// email cheak
  const query = { email: email };
  const user = await usersCollection.findOne(query);
    // check instructor
  const result = { host: user?.role === 'host' };
  res.send(result);
});

// Promote a user to instructor
app.patch('/users/host/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      role: 'host',
    },
  };

  const result = await usersCollection.updateOne(filter, updateDoc);
  res.send(result);
});


// Delete a user
app.delete('/users/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await usersCollection.deleteOne(query);
  res.send(result);
});





//*---------------------------rooms--------------------------*


  // Get a single room by id
  app.get('/rooms/:id', async (req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await roomsCollection.findOne(query)
    res.send(result)
  })




  // Get all rooms
 // app.get('/rooms', async (req, res) => {
    //const result = await roomsCollection.find().toArray()
    //res.send(result)
 // })



  // SHOW rooms  data by login user
  app.get('/rooms',  async (req, res) => {
    let query = {};
if (req.query?.email) {
      query = { email: req.query.email }
    }
    const result = await roomsCollection.find(query).toArray();
    res.send(result);
})


  // Save a room in database
  app.post('/rooms', async (req, res) => {
    console.log(req.decoded)
    const room = req.body
    const result = await roomsCollection.insertOne(room)
    res.send(result)
  })
  // delete room
  app.delete('/rooms/:id', async (req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await roomsCollection.deleteOne(query)
    res.send(result)
  })

//*---------------------------bookings--------------------------*

// Get bookings for guest
app.get('/bookings', async (req, res) => {
  const email = req.query.email

  if (!email) {
    res.send([])
  }
  const query = { 'guest.email': email }
  const result = await bookingsCollection.find(query).toArray()
  res.send(result)
})

// Get bookings for host
app.get('/bookings', async (req, res) => {
  const email = req.query.email

  if (!email) {
    res.send([])
  }
  const query = { host: email }
  const result = await bookingsCollection.find(query).toArray()
  res.send(result)
})

// create payment intent
app.post('/create-payment-intent', verifyJWT, async (req, res) => {
  const { price } = req.body
  const amount = parseFloat(price) * 100
  if (!price) return
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    payment_method_types: ['card'],
  })

  res.send({
    clientSecret: paymentIntent.client_secret,
  })
})

// Save a booking in database
app.post('/bookings', async (req, res) => {
  const booking = req.body
  const result = await bookingsCollection.insertOne(booking)
  if (result.insertedId) {
    // Send confirmation email to guest
    sendMail(
        {
            subject: 'Booking Successful at Aircncl!',
            message: `
                <img src="https://i.ibb.co/72RXy2H/favicon.png" alt="Company Logo" width="150" height="100">
                <h1>Booking Successful!</h1>
                <p>Thank you for choosing Aircnc website. Your booking details are:</p>
                <img src=" ${booking.image}" alt="image" width="200" height="100">
                <ul>
                    <li>Booking Id: ${result?.insertedId}</li>
                    <li>TransactionId: ${booking.transactionId}</li>
                    <li>Location ${booking.location}</li> 
                    <li>Price:${booking.price}</li> 
                </ul>
                <p>We look forward to hosting you!</p>
            `,
        },
        booking?.guest?.email
    )

    // Send confirmation email to host
    sendMail(
        {
            subject: 'Your room at  Aircnc got booked!',
            message: `
                <img src="https://i.ibb.co/72RXy2H/favicon.png" alt="Company Logo" width="200" height="100">
                <h1>Your room got booked!</h1>
                <p>Congratulations! Your room has been booked. Here are the details:</p>
                <img src= ${booking.image} alt="image" width="200" height="100">

                <ul>
                    <li>Booking Id: ${result?.insertedId}</li>
                    <li>TransactionId: ${booking.transactionId}</li>
                    <li>Location: ${booking.location}</li>  
                    <li>Price: ${booking.price}</li> 
                    <li>Booked by -${booking.guest.name}</li>
                    <img src= ${booking.guest.image} alt="image" width="150" height="100">
                </ul>
                <p>Check your dashboard for more information.</p>
                <p>We appreciate your business!</p>
            `,
        },
       

      booking?.host
    )
  }
  console.log(result)
  res.send(result)
})
 

    // delete a booking

    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await bookingsCollection.deleteOne(query)
      res.send(result)
    })

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





///app.get('/rooms', (req, res) => {
   // res.send(datas);
//})



//app.get('/rooms/:id', (req, res) => {
    //const {id} = req.params;
   // const selectedData = datas.find(n => n.id ==id) || {} ;
   // res.send(selectedData);
//})



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})