const jwt = require ('jsonwebtoken')
const express = require("express");
const app = express();
app.use(express.json());
const {
  models: { User, Note},
} = require("./db");
const path = require("path");

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.post("/api/auth", async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/auth", async (req, res, next) => {
  try {
    res.send(await User.byToken(req.headers.authorization));
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/users/:id/notes", async (req, res, next) => {
    try {
      const tokenUser = await User.byToken(req.headers.authorization);
      const tokenUserID = tokenUser.id
      const userId = req.params.id;
      console.log("====", tokenUserID, userId)
      if(tokenUserID.toString() === userId){
          const user = await User.findByPk(userId);
          const notes = await user.getNotes();
          res.send(notes);
      }else{
          res.status(401).send('those are not your notes')
      }
      
    } catch (ex) {
      next(ex);
    }
})
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
