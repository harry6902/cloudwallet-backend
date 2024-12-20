const express= require('express')
const {Transaction,Keypair, Connection,sendAndConfirmTransaction}= require('@solana/web3.js')
const {z}=require('zod');
const {userModel}= require('./models');
const jwt= require('jsonwebtoken');
const JWT_SECRET="123456"
const mongoose =require('mongoose');
const bs58= require('bs58')
const cors=require('cors')
const app=express()
app.use(cors())
app.use(express.json())


mongoose.connect('mongodb+srv://harry_123:hari123@cluster0.7ep1e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')

const connection=new Connection("https://api.mainnet-beta.solana.com")

app.get("/",(req,res)=>{
    res.send("Hiii")
})

app.post("/api/v1/signup",async (req,res)=>{
    const {username,password,email}= req.body;
    const requiredbody= z.object({
        email:z.string().min(3).max(100).email(),
        username:z.string(),
        password: z.string()
    })


    const safeParsedBody = requiredbody.safeParse(req.body);

    if(!safeParsedBody.success){
         res.status(400).json({
            message: safeParsedBody.error.issues[0].message
         })
         return;
    }
    const keypair = new Keypair();
    await userModel.create({
        username,
        password,
        email,
        privateKey:keypair.secretKey.toString(),
        publicKey:keypair.publicKey.toString()
    })
    res.json({
        
        message: keypair.publicKey.toString()
    })
})

app.post("/api/v1/signin", async (req,res)=>{

    const {username,password}= req.body

    const user=await userModel.findOne({
        $or: [
          { email: username },
          { username: username }
        ]
      });

     if(!user){
        res.status(403).json({
            message: "Incorrect Credentials"
        })
        return;
     } 

     if(user.password !==password){
        res.status(403).json({
            message: "Incorrect Credentials"
        })
     }
    
       const token= jwt.sign({
          id:user
       },JWT_SECRET)

       const options={
        httpOnly:true,
        secure:true,
        sameSite:'None'

    }

       res.status(200)
       .cookie("accessToken",token,options)
       .json({
        token
       })



    

})


app.post("/api/v1/txn/sign",async (req,res)=>{

    const authHeader= req.header('Authorization');
    if(!authHeader){
        res.status(401)
        .json({
            message:"Access token required"
        })
        return;
    }

    const decodedToken= jwt.decode(authHeader);
    const username=decodedToken.id.username;
    const userDetails= await userModel.findOne({username})
    const {message,retry}= req.body;
    const serializedTransaction=message;
    const tx=Transaction.from(Buffer.from(serializedTransaction))
    const stringKey=userDetails.privateKey;

    const numArr=stringKey.split(',').map(Number);
    const privateKey=new Uint8Array(numArr)

    const keyPair=Keypair.fromSecretKey(privateKey);
    const {blockhash}= await connection.getLatestBlockhash();
    tx.blockhash=blockhash;
    tx.feePayer=keyPair.publicKey;
    tx.sign(keyPair);
    const signature = await sendAndConfirmTransaction(
        connection,
        tx,
        [keyPair]
      );
    res.json({
        message: "Transaction Successful"
    })
})

app.post("/api/v1/txn", (req,res)=>{
    res.json({
        message: "Sign Up"
    })
})

module.exports = (req, res) => {
  // Set CORS headers explicitly
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins (or specify your app's URL)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // If credentials are required (cookies, tokens)

  // Handle the preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).end(); // Respond to OPTIONS request (preflight)
    return;
  }

  // Your regular function logic here (signup logic, etc.)
  if (req.method === 'POST') {
    // Handle the signup request
    res.status(200).json({ message: 'Signup successful' });
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};


app.listen(3000);
