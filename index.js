const dns = require("node:dns");  
dns.setServers(["8.8.8.8", "8.8.4.4"]); 

require('dotenv').config()   
const express = require('express') 
const cors=require("cors") 
const app = express()              
app.use(cors())   
app.use(express.json()) 
const port = 5000    

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
    const purchaseCollection = db.collection("purchases")
    const subCollection = db.collection("subscription")
    const userCollection = db.collection("user")

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
      const artworkData = req.body 
      const result = await artworkCollection.insertOne(artworkData) 
      
      res.json(result)
       })
//individual
app.get("/artwork/:id", async(req,res)=>{
  const query = {_id:new ObjectId(req.params.id)} 
  const result = await artworkCollection.findOne(query) 
  res.send(result)
})
app.delete("/artwork/:id", async(req,res)=>{
  const query = {_id:new ObjectId(req.params.id)} 
  const result = await artworkCollection.deleteOne(query) 
    res.send(result)
})
app.patch("/artwork/:id", async(req,res)=>{
  const query = {_id:new ObjectId(req.params.id)} 
  const updatedDoc = {$set:req.body} 
  const result = await artworkCollection.updateOne(query,updatedDoc) 
  res.send(result) })


//PAyment

app.post("/artwork/purchases",async(req,res)=>{
   try {
    const { productId, buyerMail, sellerMail, title, price,image } = req.body;

   
    const purchaseData = {
      image,
      productId,
      buyerMail,
      sellerMail,
      title,
      price,
      createdAt: new Date().toISOString(),
    };
    await purchaseCollection.insertOne(purchaseData);

    
    const query = { _id: new ObjectId(productId) };
    const updateDoc = { $inc: { quantity: -1 } }; // 
    await artworkCollection.updateOne(query, updateDoc);

    res.json({ message: "Purchase saved and artwork quantity updated" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error" });
  }
})
app.get("/purchases", async (req, res) => {
  try {
    const { buyerMail, sellerMail } = req.query;
    let query = {};

    // Filter by buyer or seller if provided
    if (buyerMail) {
      query.buyerMail = buyerMail;
    }
    if (sellerMail) {
      query.sellerMail = sellerMail;
    }

    // Fetch purchases
    const result = await purchaseCollection.find(query).toArray();

    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching purchases:", error);
    res.status(500).send({ message: "Server error" });
  }
});


app.post("/pre-sub", async (req, res)=>{
  const {title, price,user,session_id,createdAt,customerName,customerEmail}=req.body

  const isExist=await subCollection.findOne({session_id})
  if(isExist){
    return res.status(400).send({message:"Session already exist"})
  }

 const subRes= await subCollection.insertOne({userId:new ObjectId(user.id),
  session_id,title, price,createdAt,customerName,customerEmail})


 const userRes=await userCollection.updateOne(
  {_id:new ObjectId(user.id)},
  {$set:{subscriptionPlan:"Premium"}}
)
res.send({subRes,userRes})
})

       

    console.log("✅ You are connected to MongoDB!");
  } finally {

  }
}
server().catch(console.dir);

  //  session_id,
  //  user,
  // price: session.amount_total/100,
  // title: session?.metadata?.title,
  // createdAt: new Date().toISOString(),