require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000

// middle wares
app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tlbypdj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
        const jobs = client.db("job_portal").collection("jobs")
        const jobApplications = client.db("job_portal").collection("job_applications")


        // Job Apis
        // Get all jobs
        app.get('/', async (req, res) => {
            const result = await jobs.find({}).toArray();
            res.send(result)
        })
        // Get Single Job
        app.get('/job/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobs.findOne(query)
            res.send(result)
        })


        // job application

        // apply job
        app.post('/job-apply', async (req, res) => {
            const application = req.body;
            const result = await jobApplications.insertOne(application)
            res.send(result)
        })

        // get applied job
        app.get('/job-apply', async (req, res) => {
            const email = req.query.email;
            const query = { applicantEmail: email }
            const result = await jobApplications.find(query).toArray();
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
