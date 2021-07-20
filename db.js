const jwt = require ('jsonwebtoken');
const Sequelize = require("sequelize");
const secret = process.env.JWT;
const bcrypt = require('bcrypt');
const { STRING } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/acme_db",
  config
);

const User = conn.define("user", {
  username: STRING,
  password: STRING,
});
const Note = conn.define("note", {
   text: STRING,
})
    
Note.belongsTo(User)
User.hasMany(Note)

User.byToken = async (token) => {
  try {
    const response = jwt.verify(token, secret)
    const user = await User.findByPk(response.userId);
    if (user) {
      return user;
    }
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
//    console.log("USER", username, password)
  const user = await User.findOne({
    where: {
      username,
    },
  });
//   console.log('HASH',user.password)
  const isValid = await bcrypt.compare(password, user.password)
  if (isValid) {
      const token = await jwt.sign({ userId: user.id}, secret )
    return token;
  }
  const error = Error("bad credentials");
  error.status = 401;
  throw error;
};



const syncAndSeed = async () => {
    User.beforeCreate(async (user, options) => {
      try {
        const SALT_COUNT = 5;
        const hashpassword = await bcrypt.hash(user.password, SALT_COUNT);
        user.password = hashpassword;
      } catch (e) {
        console.log(e);
      }
    }); 
  await conn.sync({ force: true });
  const credentials = [
    { username: "lucy", password: "lucy_pw" },
    { username: "moe", password: "moe_pw" },
    { username: "larry", password: "larry_pw" },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  const note1 = await Note.create({
      text: 'Hello'
  })
  const note2 = await Note.create({
    text: "World",
  });

  const note3 = await Note.create({
    text: "This is a new note",
  });

  await lucy.setNotes([note1, note2])
  await moe.setNotes(note3)
  
  console.log("LUCY",lucy.password)
  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
