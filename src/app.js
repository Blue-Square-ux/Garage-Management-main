require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser'); 

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/garage-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/garage-management',
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 2, // 2 hours
    secure: false, // set to true if using HTTPS
    httpOnly: true
  }
}));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Simple authentication middleware
function authRole(role) {
  return (req, res, next) => {
    if (req.session.user && req.session.user.role === role) {
      next();
    } else {
      res.redirect('/login');
    }
  };
}

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const floorManagerRoutes = require('./routes/floorManager');
const guardRoutes = require('./routes/guard');

app.use('/', authRoutes);
app.use('/admin', authRole('admin'), adminRoutes);
app.use('/floor-manager', authRole('floorManager'), floorManagerRoutes);
app.use('/guard', authRole('guard'), guardRoutes);

// Redirect root URL to login page
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
