require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const jwt = require("jsonwebtoken")
const cookieParser = require('cookie-parser');
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000

// middle wares
app.use(cors({
    origin: ['http://localhost:5173'], // your React frontend URL
    credentials: true,              // allow cookies and Authorization headers
}));
app.use(express.json())
app.use(cookieParser())


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


        // Auth related
        app.post("/jwt", (req, res) => {
            const user = req.body

            const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '1h'
            })

            res.cookie("Token", token, {
                httpOnly: true,
                secure: false,
                // sameSite: "Strict"
            })
                .send({ message: "Token issued" })
        })

        app.post('/logout', (req, res) => {
            res.clearCookie('Token', {
                httpOnly: true,
                secure: false, // same as when setting the cookie
                // sameSite: 'Strict',
            })
                .send({ message: 'Logged out' });
        });


        // Job Apis
        // Get all jobs
        app.get('/jobs', async (req, res) => {
            const email = req.query.email
            let query = {}
            if (email) {
                query = { hr_email: email }
            }
            const result = await jobs.find(query).toArray();
            res.send(result)
        })
        // Get Single Job
        app.get('/job/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobs.findOne(query)
            res.send(result)
        })
        // Create Job
        app.post('/jobs', async (req, res) => {
            const job = req.body;
            const result = await jobs.insertOne(job)
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
        app.get('/job-applications', async (req, res) => {
            const email = req.query.email;
            const query = { applicantEmail: email }
            const result = await jobApplications.find(query).toArray();

            for (const application of result) {
                const query1 = { _id: new ObjectId(application.job_id) }
                const job = await jobs.findOne(query1);
                if (job) {
                    application.title = job.title
                    application.applicationDeadline = job.applicationDeadline;
                    application.status = job.status;
                    application.location = job.location;
                    application.company_logo = job.company_logo
                }
            }
            res.send(result)

        })

        app.get('/posted-jobs/:job_id', async (req, res) => {
            const id = req.params.job_id;
            const query = { job_id: id }
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
