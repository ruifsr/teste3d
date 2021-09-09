const express = require("express");

const app = new express();
app.use(express.static("www"));

app.listen(8081, ()=>{console.log("online on port 8081")})