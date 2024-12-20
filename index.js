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
app.use(express.json())
app.use(cors())

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
        httpOnly:false,
        secure:false,
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

app.listen(3000);
