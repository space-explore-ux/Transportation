// const express = require("express");


// const router = express.Router();


// router.get('/',( req,res) =>
//     {
//        res.render("index");
//     });

// router.get('/index',( req,res) =>
//     {
//        res.render("index");
//     });

// router.get('/print',( req,res) =>
//     {
//        res.render("print");
//     });


// router.get('/home',( req,res) =>
//     {
//        res.render("home");
//     });


// // router.get('/table',( req,res) =>
// //     {
// //        res.render("TableDesign");
// //     });
// // router.get('/admin',( req,res) =>
// //     {
// //        res.render("admin");
// //     });

// const backend = require("../Backend/logic");

// router.get("/table", backend.table);

// router.get('/notification',backend.loadNotifications);

// router.get('/send-whatsapp', backend.sendWhatsAppNotification);

// // router.get('/admin',backend.admin);

// router.get('/admin', (req, res, next) => {
//   if (req.session && req.session.userType === 'admin') {
//     backend.admin(req, res);
//   } else {
//     res.redirect('/home'); // or res.status(403).send('Forbidden');
//   }
// });


// module.exports = router;

const express = require("express");
const router = express.Router();
const backend = require("../Backend/logic");

// ✅ PUBLIC ROUTES
router.get('/', (req, res) => {
  res.render("index");
});

router.get('/index', (req, res) => {
  res.render("index");
});

// ✅ PROTECTED ROUTES — Admin or Employee
router.get('/home', (req, res) => {
  if (req.session && req.session.userType) {
    res.render("home");
  } else {
    res.redirect('/index');
  }
});

router.get('/print', (req, res) => {
  if (req.session && req.session.userType) {
    res.render("print");
  } else {
    res.redirect('/index');
  }
});

router.get("/table", (req, res) => {
  if (req.session && req.session.userType) {
    backend.table(req, res);
  } else {
    res.redirect('/index');
  }
});

router.get('/notification', (req, res) => {
  if (req.session && req.session.userType) {
    backend.loadNotifications(req, res);
  } else {
    res.redirect('/index');
  }
});

router.get('/send-whatsapp', (req, res) => {
  if (req.session && req.session.userType) {
    backend.sendWhatsAppNotification(req, res);
  } else {
    res.redirect('/index');
  }
});

router.get('/emp', (req,res) => {
  backend.emp(req,res);
})

// ✅ ADMIN-ONLY ROUTE
router.get('/admin', (req, res) => {
  if (req.session && req.session.userType === 'admin') {
    backend.admin(req, res);
  }
  else if (req.session && req.session.userType === 'employee'){
    res.redirect('/emp'); 
  }
  else {
    res.redirect('/index'); // or res.status(403).send('Forbidden');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.log("Logout Error:", err);
    res.redirect('/index');
  });
});


module.exports = router;
