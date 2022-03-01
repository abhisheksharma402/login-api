express = require('express');
mongodb = require('mongodb');
conn = require('./conn')
express = require('express')
helmet = require('helmet')
bcrypt = require('bcrypt')
jwt = require('jsonwebtoken')
const bodyParser = require('body-parser');
// const { get } = require('express/lib/response');
const app = express()
app.use(bodyParser.json())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({
    extended:true
}))
app.use(helmet())
const start = Date.now();

require('dotenv').config();


conn.connection()
// conn.listDbs()
async function check(email){
    const result = await conn.client.db("dic").collection("users")
    .find({
        "email": email
    }).toArray()
    return result
}

async function getDeviceData(deviceId){
    const result = await conn.client.db("dic").collection("deviceInfo")
    .find({
        'deviceId': deviceId
    }).toArray();

    return result;
}

async function getAIConditions(deviceId){
    const result = await conn.client.db("dic").collection("AIConditions")
    .find({
        'deviceId': deviceId
    }).toArray();

    return result;
}


app.listen(process.env.PORT, ()=>{
    console.log(`Server running on ${process.env.HOST}:${process.env.PORT}`)
})

app.get('/', async (req, res)=>{
    conn.listDbs()
    // const data = await getCollections()
    res.send(`You are on port ${process.env.PORT}`)
    console.log(`Server running on ${process.env.HOST}:${process.env.PORT}`)
})


app.get('/getAlert', async (req,res)=>{
    console.log(req.body.deviceId)
    const data = await getDeviceData(req.body.deviceId);
    if(data.length == 0){
        res.status(400).send({'message': 'No record found of such device id'});
        return;
    }
    if(data[0].data.temperature.upperThreshold < req.body.temp){
        res.status(200).send(
            {
                "message": "Alert!! temperature crossed threshold value",
                "deviceId": req.body.deviceId,
                "Time": (Date.now() - start)/(1000*60)
            })
    }
    else{
        res.status(200).send({"message": "No Alerts"});
    }
})


app.get('/aiconditions', async (req,res)=>{
    const data = await getAIConditions(req.body.deviceId);
    console.log(data)
    if(data.length > 0){
        res.status(200).send({"data": data})
    }
    else{
        res.status(400).send({'message': 'No record found of such device id'})
    }
})



app.post('/signup', (req, res)=>{
    user_name = req.body.name;
    email = req.body.email;
    password = req.body.password;
    console.log(user_name)
    console.log(email)
    console.log(password)
    const data = check(email)
    data.then((resp)=>{
        if(resp.length == 0){
            bcrypt.hash(password,10).then(async (hashedPassword)=>{
                userDetails = {
                    'name': user_name,
                    'email': email,
                    'password': hashedPassword
                }
        
                result = await conn.client.db('dic').collection('users').insertOne(userDetails);
                console.log(result)
                if(result.acknowledged){
                    res.status(200).send({"message": "Signup Successful"});
                }
                else{
                    res.status(400).send({"message": "Error while signing up"});
                }
            })
        }
        else{
            res.status(400).send({"message": "A user with that email already exists"})
        }
    })
    
})



app.post('/login', (req, res)=>{
    email = req.body.email
    password = req.body.password
    const data = check(email)
    data.then((resp)=>{
        console.log(resp);
        if(resp.length == 0){
            res.status(404).send({"message": "User doesn't exist"})
        }
        else{
            bcrypt.compare(password, resp[0].password).then((result)=>{
                if(result){
                    const token = jwt.sign(
                        {
                            user_id: resp[0]._id,
                            email: resp[0].email,
                        },
                        process.env.TOKEN_SECRET
                    );
                    resp[0].token = token;
                    res.header('auth-token', token).send({"message":"Logged in", "user": resp[0]})
                }
                else{
                    res.status(404).send({"message": "Invalid Password. Please try again"})
                }
            })
        }
    })
})

console.log(process.env.PORT)