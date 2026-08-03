const dns = require("node:dns");  
dns.setServers(["8.8.8.8", "8.8.4.4"]); 

require('dotenv').config()   
const express = require('express') 
const cors=require("cors") 
const app = express()              
app.use(cors())   
app.use(express.json()) 
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const port = process.env.PORT   

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

const JWKS=createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

const middleware=async(req,res,next)=>{
const authHeader=req?.headers?.authorization
if(!authHeader){
  return res.status(401).json({message:"Unauthorized"})
}
const token=authHeader.split(" ")[1]
if(!token){
  return res.status(401).json({message:"Unauthorized"})
}
console.log(token,"token");
try{
const {payload}=await jwtVerify(token,JWKS)
console.log(payload,"payload");
next()
}catch(error){
   return res.status(403).json({message:"Unauthorized"})
}


}


async function server() {
  try {

    const db = client.db("arthub") 
    const organizationCollection = db.collection("artist-organization")
    const artworkCollection = db.collection("artist-artwork")
    const purchaseCollection = db.collection("purchases")
    const subCollection = db.collection("subscription")
    const userCollection = db.collection("user")
    const commentCollection=db.collection("comments")

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

// Latest artworks API
app.get("/latest-artworks", async (req, res) => {
  try {
    const data = await artworkCollection
      .find({})
      .sort({ createdAt: -1 })   
      .limit(6)                 
      .toArray();

    res.json(data);
  } catch (err) {
    console.error("Error in latest-artworks route:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/artwork", async (req, res) => {
  const { artistMail, companyId, search, category, minPrice, maxPrice, sort } = req.query;
  let query = {};

  // Artist filter
  if (artistMail) query.artistMail = artistMail;
  if (companyId) query.companyId = companyId;

  // Category filter
  if (category) {
    query.category = category;
  }

  // Search filter (title or artistMail)
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { artistMail: { $regex: search, $options: "i" } }
    ];
  }

  // Price filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseInt(minPrice);
    if (maxPrice) query.price.$lte = parseInt(maxPrice);
  }

  // Fetch data
  let result = await artworkCollection.find(query).toArray();

  // Sorting
  if (sort) {
    if (sort === "low-high") {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === "high-low") {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  res.send(result);
});
//for
app.get("/artwork/public", async (req, res) => {
  const {search, category, minPrice, maxPrice, sort, limit, page } = req.query;
  let query = {};


  // Category filter
  if (category) query.category = category;

  // Search filter (title or artistMail)
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { artistMail: { $regex: search, $options: "i" } }
    ];
  }

  // Price filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseInt(minPrice);
    if (maxPrice) query.price.$lte = parseInt(maxPrice);
  }

  // Pagination setup
  const perPage = Number(limit) || 2;
  const currentPage = Number(page) || 1;
  const skip = (currentPage - 1) * perPage;

  // Sorting setup
  let sortOption = {};
  if (sort) {
    if (sort === "low-high") {
      sortOption.price = 1;
    } else if (sort === "high-low") {
      sortOption.price = -1;
    } else if (sort === "newest") {
      sortOption.createdAt = -1;
    }
  }

  // Fetch data with filters, pagination, and sorting
  const totalData = await artworkCollection.countDocuments(query);
  const totalPages = Math.ceil(totalData / perPage);

  const result = await artworkCollection
    .find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(perPage)
    .toArray();

  res.send({
    totalPages,
    currentPage,
    perPage,
    totalData,
    result
  });
});

//CREATE

//protected
      app.post("/artwork",middleware, async(req,res)=>{
      const artworkData = req.body 
      const result = await artworkCollection.insertOne(artworkData) 
      
      res.json(result)
       })
//individual

app.get("/artwork/:id",async(req,res)=>{
  const query = {_id:new ObjectId(req.params.id)} 
  const result = await artworkCollection.findOne(query) 
  res.send(result)
})
//protected
app.delete("/artwork/:id",middleware, async(req,res)=>{
  const query = {_id:new ObjectId(req.params.id)} 
  const result = await artworkCollection.deleteOne(query) 
    res.send(result)
})
//protected
app.patch("/artwork/:id", middleware,async(req,res)=>{
  const query = {_id:new ObjectId(req.params.id)} 
  const updatedDoc = {$set:req.body} 
  const result = await artworkCollection.updateOne(query,updatedDoc) 
  res.send(result) })


//PAyment

app.post("/artwork/purchases",async(req,res)=>{
   try {
    const { productId, buyerMail, sellerMail, title, price,image,trxId } = req.body;

     const isExistSession = await purchaseCollection.findOne({trxId });
      if (isExistSession) {
        return res.status(400).send({ message: "Session already exist" });
      }
    const purchaseData = {
     
      image,
      productId,
      buyerMail,
      sellerMail,
      title,
      price,
      createdAt: new Date().toISOString(),trxId
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
  const {title, price,user,session_id,createdAt,customerName,customerEmail,trxId}=req.body

  const isExist=await subCollection.findOne({session_id})
  if(isExist){
    return res.status(400).send({message:"Session already exist"})
  }

 const subRes= await subCollection.insertOne({userId:new ObjectId(user.id),
  session_id,title, price,createdAt,customerName,customerEmail,trxId})


 const userRes=await userCollection.updateOne(
  {_id:new ObjectId(user.id)},
  {$set:{subscriptionPlan:"Premium"}}
)
res.send({subRes,userRes})
})
app.post("/pro-sub", async (req, res)=>{
  const {title, price,user,session_id,createdAt,customerName,customerEmail,trxId}=req.body

  const isExist=await subCollection.findOne({session_id})
  if(isExist){
    return res.status(400).send({message:"Session already exist"})
  }

 const subRes= await subCollection.insertOne({userId:new ObjectId(user.id),
  session_id,title, price,createdAt,customerName,customerEmail,trxId})


 const userRes=await userCollection.updateOne(
  {_id:new ObjectId(user.id)},
  {$set:{subscriptionPlan:"Pro"}}
)
res.send({subRes,userRes})
})
// Get all Premium subscriptions
app.get("/pre-sub", async (req, res) => {
  try {
    const subs = await subCollection.find({ title: "Premium" }).toArray();
    res.send(subs);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// Get all Pro subscriptions
app.get("/pro-sub", async (req, res) => {
  try {
    const subs = await subCollection.find({ title: "Pro" }).toArray();
    res.send(subs);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});
//Get user
app.get("/users", async (req, res) => {
  try {
    const subs = await userCollection.find().toArray();
    res.send(subs);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});
app.patch("/users/:id", async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  try {
    const result = await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role: role } }
    );

    if (result.modifiedCount === 1) {
      res.send({ success: true, message: "Role updated successfully" });
    } else {
      res.status(404).send({ success: false, message: "User not found" });
    }
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});
  

//Mongodb Agregation

app.get("/analytics/overview", async (req, res) => {
  try {
    const totalUsers = await userCollection.countDocuments({ role: "Buyer" });
    const totalArtists = await userCollection.countDocuments({ role: "Artist" });
    const totalArtworksSold = await purchaseCollection.countDocuments({});
    const revenueAgg = await purchaseCollection.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: { $toInt: "$price" } } } }
    ]).toArray();

    res.json({
      totalUsers,
      totalArtists,
      totalArtworksSold,
      totalRevenue: revenueAgg[0]?.totalRevenue || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/analytics/sales-chart", async (req, res) => {
  try {
const data = await purchaseCollection.aggregate([
  {
    $addFields: {
      createdAtDate: {
        $convert: {
          input: "$createdAt",
          to: "date",
          onError: null,
          onNull: null
        }
      }
    }
  },
  {
    $match: { createdAtDate: { $ne: null } }
  },
  {
    $group: {
      _id: {
        year: { $year: "$createdAtDate" },
        month: { $month: "$createdAtDate" }
      },
      monthlyRevenue: { $sum: { $toInt: "$price" } },
      artworksSold: { $sum: 1 }
    }
  },
  { $sort: { "_id.year": 1, "_id.month": 1 } }
]).toArray();


    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/analytics/artworks-by-category", async (req, res) => {
  try {
    const data = await artworkCollection.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },          
          totalQuantity: { $sum: "$quantity" } 
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.get("/analytics/top-artists", async (req, res) => {
  try {
    const data = await purchaseCollection.aggregate([
      {
        $group: {
          _id: "$sellerMail",
          salesCount: { $sum: 1 },
          totalRevenue: { $sum: { $toInt: "$price" } }
        }
      },
      { $sort: { salesCount: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: "user",         
          localField: "_id",   
          foreignField: "email", 
          as: "artistInfo"
        }
      },
      { $unwind: "$artistInfo" },
      {
        $project: {
          _id: 0,
          name: "$artistInfo.name",
          email: "$artistInfo.email",
          image: "$artistInfo.image",
          salesCount: 1,
          totalRevenue: 1
        }
      }
    ]).toArray();

    res.json(data);
  } catch (err) {
    console.error("Error in top-artists route:", err);
    res.status(500).json({ error: err.message });
  }
});

//comments
  //  Add Comment
app.post("/artwork/:id/comments", async (req, res) => {
  try {
    const artworkId = req.params.id;
    const commentData = {
      ...req.body,
      artId: artworkId,
      createdAt: new Date(),
    };

    const result = await commentCollection.insertOne(commentData);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

//  Get Comments for an Artwork
app.get("/artwork/:id/comments", async (req, res) => {
  try {
    const artworkId = req.params.id;
    const query = { artId: artworkId }; // ✅ artworkId দিয়ে খোঁজা হবে
    const result = await commentCollection.find(query).toArray();

    res.json({ success: true, comments: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

//  Delete a Comment by ID
app.delete("/artwork/:artId/comments/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;

    const result = await commentCollection.deleteOne({ _id: new ObjectId(commentId) });

    if (result.deletedCount === 1) {
      res.json({ success: true, message: "Comment deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "Comment not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
//Update a Comment by ID
app.patch("/artwork/:artId/comments/:commentId", async (req, res) => {
  try {
    const { commentId } = req.params;
    const updatedData = req.body; // client থেকে আসা নতুন data

    const result = await commentCollection.updateOne(
      { _id: new ObjectId(commentId) },
      { $set: { ...updatedData, updatedAt: new Date() } } // ✅ নতুন data + updatedAt যোগ করা হলো
    );

    if (result.modifiedCount === 1) {
      res.json({ success: true, message: "Comment updated successfully" });
    } else {
      res.status(404).json({ success: false, message: "Comment not found or no changes made" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
    console.log(" You are connected to MongoDB!");
  } finally {

  }
}
server().catch(console.dir);

  