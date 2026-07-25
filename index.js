const dns = require("node:dns");  
dns.setServers(["8.8.8.8", "8.8.4.4"]); 

require('dotenv').config()   
const express = require('express') 
const app = express()              
const port = 5000    

const cors=require("cors") 
app.use(cors())   
app.use(express.json()) 
app.get('/', (req, res) => {
  res.send('Hello World! Server is running successfully 🚀')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGODB_URL 

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1, 
    strict: true,
    deprecationErrors: true,
  }
});


async function server() {
  try {

    const db = client.db("arthub") 
    const organizationCollection = db.collection("artist-organization")
    const artworkCollection = db.collection("artist-artwork")

//ARTIST ORGANIZATION

//READ
       app.get("/organization", async(req,res)=>{
            const { artistMail, artistUniqueId } = req.query;
            let query = {};

  if (artistMail) query.artistMail = artistMail;
  if (artistUniqueId) query.artistUniqueId = artistUniqueId;

       const result = await organizationCollection.find(query).toArray();
         res.send(result);
})
//CREATE
      app.post("/organization", async(req,res)=>{
      const organization = req.body 
      const result = await organizationCollection.insertOne(organization) 
      
      res.send(result)
       })
// UPDATE
app.patch("/organization", async (req, res) => {
  const { artistMail, artistUniqueId } = req.query;
  let query = {};

  if (artistMail) query.artistMail = artistMail;
  if (artistUniqueId) query.artistUniqueId = artistUniqueId;

  const updatedDoc = { $set: req.body };

  try {
    const result = await organizationCollection.updateOne(query, updatedDoc);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error" });
  }
});
//ARTIST-ARTWORK
//READ
   app.get("/artwork", async(req,res)=>{
            const { artistMail, companyId } = req.query;
            let query = {};

  if (artistMail) query.artistMail = artistMail;
  if (companyId) query.companyId = companyId;

       const result = await artworkCollection.find(query).toArray();
         res.send(result);
})
//CREATE
      app.post("/artwork", async(req,res)=>{
      const artwork = req.body 
      const result = await artworkCollection.insertOne(artwork) 
      
      res.send(result)
       })
       

    console.log("✅ You are connected to MongoDB!");
  } finally {

  }
}
server().catch(console.dir);
