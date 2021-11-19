if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const methodOverride = require('method-override')
const exphbs = require('express-handlebars');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo')
const mongoose = require('mongoose');

//require('/.env')

const dbUri = process.env.DB_URI || 'mongodb://localhost:27017/story-book';

mongoose.connect(dbUri, {
    useNewUrlParser: true,
   // useCreateIndex: true,
    useUnifiedTopology: true,
   // useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", () => {
    console.log("Database connected");
});

require('./config.js/passport.js')(passport)

const app = express();

const {
  formatDate,
  stripTags,
  truncate,
  editIcon,
  select,
} = require('./helpers/hbs')

// Handlebars
app.engine(
  '.hbs',
  exphbs({
    helpers: {
      formatDate,
      stripTags,
      truncate,
      editIcon,
      select,
    },
    defaultLayout: 'main',
    extname: '.hbs',
  })
)
app.set('view engine', '.hbs')
app.use(express.static(path.join(__dirname, 'public')))


app.use(express.urlencoded({ extended: false }))
app.use(express.json())


app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method
      delete req.body._method
      return method
    }
  })
)

if (process.env.NODE_ENV === "development") {
    app.use(morgan('dev'))
}


app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: dbUri
    })
  })
)


// PASSPORT.js
app.use(passport.initialize());
app.use(passport.session()); // supports persistent login sessions

app.use(function (req, res, next) {
  res.locals.user = req.user || null
  next()
})

app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/stories'))

//const PORT = process.env.PORT;

app.listen(
  3000,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port `)
)

