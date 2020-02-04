const express = require("express");
const connectDB = require("./config/db");

const app = express();

//Connect DB
connectDB();

app.get("/", (req, res) => {
  res.send("API running");
});

//Init middleware
app.use(express.json({ extended: false }));

app.use("/api/user", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/posts", require("./routes/api/posts"));

const PORT = process.env.port || 5000;

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
