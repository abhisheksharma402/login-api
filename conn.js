const { MongoClient } = require('mongodb');
const client = new MongoClient("mongodb://localhost:27017")


async function listDbs(){
    const dbList = await conn.client.db().admin().listDatabases()
    console.log("Databases")
    console.log(dbList.databases)
}

// async function 

async function connection(){
    await client.connect()
    .then((res)=>{
        console.log("Connection Established"); 
    })
    .catch((err)=>{console.log("Error in establishing connection with database")})
}

module.exports = {connection,client,listDbs}