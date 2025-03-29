const mongoose = require("mongoose");

async function testConnection() {
  const uri = "mongodb+srv://cluster56889.66kfgff.mongodb.net";

  try {
    await mongoose.connect(uri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });

    console.log("Connected to MongoDB successfully!");
    
    // Close the connection
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  }
}

testConnection();
