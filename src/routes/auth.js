const express = require('express');
const router = express.Router();

const users = {
  admin: { password: 'admin', role: 'admin' },
  floor: { password: 'floor', role: 'floorManager' },
  guard: { password: 'guard', role: 'guard' }
};

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (users[username] && users[username].password === password) {
    req.session.user = { username, role: users[username].role };
    
    // Save session explicitly before redirecting
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('login', { error: 'Login failed. Please try again.' });
      }
      
      // Redirect based on role after session is saved
      if (users[username].role === 'admin') {
        res.redirect('/admin/dashboard');
      } else if (users[username].role === 'floorManager') {
        res.redirect('/floor-manager/dashboard');
      } else if (users[username].role === 'guard') {
        res.redirect('/guard/dashboard');
      }
    });
  } else {
    res.render('login', { error: 'Invalid username or password' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
