const express = require('express');
const cors = require('cors');
require('dotenv').config();
const handleGeminiRequest = require('./api/apiCall');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
    origin : '*'
}));

app.use(express.json({ limit: '10mb' }));


app.post("/api/summarize", async (req, res) => {
    try {
        const summary = await handleGeminiRequest(req.body.reviewArr);
        res.json({ success: true, answer: summary });

    } catch (err) {
        console.error('[Backend] Error in /api/summarize:', err.message);
        res.status(500).json({ 
            success: false, 
            error: err.message || "Internal Server Error" 
        });
    }
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 


