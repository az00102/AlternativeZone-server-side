require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*'
}));
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to MongoDB
async function connectToDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
    }
}

connectToDB();

// Route handler for the root URL
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Add a new query
app.post('/api/queries', async (req, res) => {
    const { product_name, product_brand, product_image, query_title, boycotting_reason, user_email, user_name, user_image } = req.body;
    const current_date = new Date().toISOString();
    const newQuery = {
        product_name,
        product_brand,
        product_image,
        query_title,
        boycotting_reason,
        user_email,
        user_name,
        user_image,
        current_date,
        recommendationCount: 0
    };

    try {
        const db = client.db("test");
        const collection = db.collection('addqueries');
        const result = await collection.insertOne(newQuery);
        res.status(201).json({ message: 'Query added successfully', insertedId: result.insertedId });
    } catch (error) {
        console.error('Error adding query:', error);
        res.status(500).json({ message: 'Failed to add query' });
    }
});

// Define route handler for GET /api/queries
app.get('/api/queries', async (req, res) => {
    const { user_email } = req.query;

    try {
        const db = client.db("test");
        const collection = db.collection('addqueries');
        const queries = await collection.find({ user_email }).toArray(); // Fetch queries for the specified user_email
        res.status(200).json(queries);
    } catch (error) {
        console.error('Error fetching queries:', error);
        res.status(500).json({ message: 'Failed to fetch queries' });
    }
});

// Update a specific query by ID
app.put('/api/queries/:id', async (req, res) => {
    const { id } = req.params;
    const updatedQuery = req.body;

    try {
        const db = client.db("test");
        const collection = db.collection('addqueries');
        const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updatedQuery });

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Query not found' });
        }

        res.status(200).json({ message: 'Query updated successfully' });
    } catch (error) {
        console.error('Error updating query:', error);
        res.status(500).json({ message: 'Failed to update query' });
    }
});

// Fetch recommendations by query ID
app.get('/api/recommendations', async (req, res) => {
    const { queryId } = req.query;

    if (!queryId) {
        return res.status(400).json({ message: 'Query ID is required' });
    }

    try {
        const db = client.db("test");
        const collection = db.collection('recommendations');
        const recommendations = await collection.find({ queryId: new ObjectId(queryId) }).toArray();
        res.status(200).json(recommendations);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ message: 'Failed to fetch recommendations' });
    }
});

// Fetch recommendations by user email
app.get('/api/recommendations-for-user/:user_email', async (req, res) => {
    const { user_email } = req.params;

    if (!user_email) {
        return res.status(400).json({ message: 'User email is required' });
    }

    try {
        const db = client.db("test");
        const collection = db.collection('recommendations');
        const recommendations = await collection.find({ userEmail: user_email }).toArray();
        res.status(200).json(recommendations);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ message: 'Failed to fetch recommendations' });
    }
});

// Fetch recommendations made by the authenticated user
app.get('/api/my-recommendations', async (req, res) => {
    const { user_email } = req.query;

    if (!user_email) {
        return res.status(400).json({ message: 'User email is required' });
    }

    try {
        const db = client.db("test");
        const collection = db.collection('recommendations');
        const recommendations = await collection.find({ recommenderEmail: user_email }).toArray();
        res.status(200).json(recommendations);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ message: 'Failed to fetch recommendations' });
    }
});

// Fetch recommendations by multiple query IDs
app.get('/api/recommendations/by-query-ids', async (req, res) => {
    let { queryIds } = req.query;

    if (!queryIds) {
        return res.status(400).json({ message: 'Query IDs are required' });
    }

    let objectIdArray = [];
    try {
        if (typeof queryIds === 'string') {
            objectIdArray = queryIds.split(',').map(id => new ObjectId(id.trim()));
        } else if (Array.isArray(queryIds)) {
            objectIdArray = queryIds.map(id => new ObjectId(id));
        }

        const db = client.db("test");
        const collection = db.collection('addqueries');  // Ensure you are querying the correct collection
        const recommendations = await collection.find({ _id: { $in: objectIdArray } }).toArray();
        res.status(200).json(recommendations);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ message: 'Failed to fetch recommendations' });
    }
});

// Fetch user information by email
app.get('/api/user-info/:email', async (req, res) => {
    const { email } = req.params;

    try {
        const db = client.db("test");
        const collection = db.collection('recommendations');
        const user = await collection.findOne({ email });

        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user information:', error);
        res.status(500).json({ message: 'Failed to fetch user information' });
    }
});

// Fetch a specific query by ID
app.get('/api/queries/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const db = client.db("test");
        const collection = db.collection('addqueries');
        const query = await collection.findOne({ _id: new ObjectId(id) });
        if (query) {
            res.status(200).json(query);
        } else {
            res.status(404).json({ message: 'Query not found' });
        }
    } catch (error) {
        console.error('Error fetching query:', error);
        res.status(500).json({ message: 'Failed to fetch query' });
    }
});

// Delete a specific query by ID
app.delete('/api/queries/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const db = client.db("test");
        const collection = db.collection('addqueries');
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Query not found' });
        }

        res.status(200).json({ message: 'Query deleted successfully' });
    } catch (error) {
        console.error('Error deleting query:', error);
        res.status(500).json({ message: 'Failed to delete query' });
    }
});





// Add a new recommendation
app.post('/api/recommendations', async (req, res) => {
    const { queryId, queryTitle, productName, userEmail, userName, recommenderEmail, recommenderName, recommendation_title, recommended_product_name, recommended_product_image, recommendation_reason, current_date } = req.body;

    const newRecommendation = {
        queryId: new ObjectId(queryId),
        queryTitle,
        productName,
        userEmail,
        userName,
        recommenderEmail,
        recommenderName, // Ensure recommenderName is included
        recommendation_title,
        recommended_product_name,
        recommended_product_image,
        recommendation_reason,
        current_date
    };

    try {
        const db = client.db("test");
        const collection = db.collection('recommendations');
        const result = await collection.insertOne(newRecommendation);
        res.status(201).json({ message: 'Recommendation added successfully', insertedId: result.insertedId });
    } catch (error) {
        console.error('Error adding recommendation:', error);
        res.status(500).json({ message: 'Failed to add recommendation' });
    }
});

// Delete a specific recommendation by ID
app.delete('/api/recommendations/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const db = client.db("test");
        const collection = db.collection('recommendations');
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Recommendation not found' });
        }

        res.status(200).json({ message: 'Recommendation deleted successfully' });
    } catch (error) {
        console.error('Error deleting recommendation:', error);
        res.status(500).json({ message: 'Failed to delete recommendation' });
    }
});

// Increment recommendation count for a query
app.put('/api/queries/:id/increment-recommendations', async (req, res) => {
    const { id } = req.params;

    try {
        const db = client.db("test");
        const collection = db.collection('addqueries');
        const result = await collection.updateOne({ _id: new ObjectId(id) }, { $inc: { recommendationCount: 1 } });

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Query not found' });
        }

        res.status(200).json({ message: 'Recommendation count incremented successfully' });
    } catch (error) {
        console.error('Error incrementing recommendation count:', error);
        res.status(500).json({ message: 'Failed to increment recommendation count' });
    }
});

// Decrement recommendation count for a query
app.put('/api/queries/:id/decrement-recommendations', async (req, res) => {
    const { id } = req.params;

    try {
        const db = client.db("test");
        const collection = db.collection('addqueries');
        const result = await collection.updateOne({ _id: new ObjectId(id) }, { $inc: { recommendationCount: -1 } });

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Query not found' });
        }

        res.status(200).json({ message: 'Recommendation count decremented successfully' });
    } catch (error) {
        console.error('Error decrementing recommendation count:', error);
        res.status(500).json({ message: 'Failed to decrement recommendation count' });
    }
});

// Fetch recent queries
app.get('/api/recent-queries', async (req, res) => {
    try {
        const db = client.db("test");
        const collection = db.collection('addqueries');
        const recentQueries = await collection.find().sort({ current_date: -1 }).limit(8).toArray();
        res.status(200).json(recentQueries);
    } catch (error) {
        console.error('Error fetching recent queries:', error);
        res.status(500).json({ message: 'Failed to fetch recent queries' });
    }
});

// Fetch all queries
app.get('/api/allqueries', async (req, res) => {
    try {
        const db = client.db("test");
        const collection = db.collection('addqueries');
        const queries = await collection.find().toArray(); // Fetch all queries without filtering
        res.status(200).json(queries);
    } catch (error) {
        console.error('Error fetching queries:', error);
        res.status(500).json({ message: 'Failed to fetch queries' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
