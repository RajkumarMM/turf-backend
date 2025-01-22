import express from 'express';
import User from '../models/User.js';
import Owner from '../models/Owner.js';
import Turf from '../models/Turf.js';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';


const router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next();
  }
  res.redirect('/admin/login'); // Redirect to login page if not authenticated
};


// Render login form
router.get('/login', (req, res) => {
  res.render('admin-login', { errorMessage: null });
});

// Handle login POST request
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.render('admin-login', { errorMessage: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.render('admin-login', { errorMessage: 'Invalid email or password.' });
    }

    // Store the admin ID in session
    req.session.adminId = admin._id;
    res.redirect('/admin'); // Redirect to the admin dashboard after successful login
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).render('admin-login', { errorMessage: 'An error occurred. Please try again.' });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.redirect('/admin');
    }
    res.redirect('/admin/login'); // Redirect to login page after logout
  });
});

// admin homme route
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const turfs = await Turf.find().select('name location price timings ownerId');
    const players = await User.find().select('name email');
    const owners = await Owner.find().select('name email');

    // Calculate the number of turfs per owner
    const ownerTurfData = await Promise.all(
      owners.map(async (owner) => {
        const turfCount = await Turf.countDocuments({ ownerId: owner._id });
        return { ownerName: owner.name, ownerEmail: owner.email, turfCount };
      })
    );

    res.render('admin', { turfs, players, owners: ownerTurfData });
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Server Error');
  }
});

// get owner route
router.get('/owners', isAuthenticated, async (req, res) => {
  try {
    const owners = await Owner.find(); // Fetch all owners
    const message = req.query.message; // Extract the message from query params
    res.render('owners', { owners, message }); // Pass message to the view
  } catch (error) {
    console.error(error);
    res.redirect('/admin'); // Handle errors by redirecting to admin home
  }
});


// Get players route
router.get('/players', isAuthenticated, async (req, res) => {
  try {
    const players = await User.find(); // Fetch players from database
    const message = req.query.message; // Get message from query params
    res.render('players', { players, message }); // Pass message to the view
  } catch (error) {
    console.error(error);
    res.redirect('/admin'); // Handle errors by redirecting to admin home
  }
});

// get turf route
router.get('/turfs', isAuthenticated, async (req, res) => {
  try {
    const turfs = await Turf.find();
    const message = req.query.message; // Get message from query params
    res.render('turfs', { turfs, message });
  } catch (error) {
    console.error(error);
    res.redirect('/admin'); // Handle errors by redirecting to admin home
    
  }
  
});

// Edit owner route
router.get('/edit-owner/:id', isAuthenticated, async (req, res) => {
  const owner = await Owner.findById(req.params.id);
  res.render('edit-owner', { owner });
});

// Update owner route
router.post('/update-owner/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    // Update the owner in the database
    await Owner.findByIdAndUpdate(id, { name, email });

    // Pass success message to the view
    const owner = await Owner.findById(id); // Fetch updated owner details
    res.render('edit-owner', { 
      owner, 
      successMessage: 'Owner details updated successfully!' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('edit-owner', { 
      owner: { _id: id, name, email }, 
      successMessage: null,
      errorMessage: 'An error occurred while updating the owner.'
    });
  }
}); 

// Delete owner route
router.get('/delete-owner/:id', isAuthenticated, async (req, res) => {
  try {
    const ownerId = req.params.id;

    // Delete all turfs associated with this owner
    const turfsDeleted = await Turf.deleteMany({ ownerId: ownerId });

    // Delete the owner
    const ownerDeleted = await Owner.findByIdAndDelete(ownerId);

    // Redirect with a success message
    res.redirect('/admin/owners?message=Owner and associated turfs deleted successfully');
  } catch (error) {
    console.error(error);
    // Redirect with an error message if deletion fails
    res.redirect('/admin/owners?message=Error deleting owner and associated turfs');
  }
});



// player routes

// Edit player route
router.get('/edit-player/:id', isAuthenticated, async (req, res) => {
  const player = await User.findById(req.params.id);
  res.render('edit-player', { player });
});

// Update player route
router.post('/update-player/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    // Update the player in the database
    await User.findByIdAndUpdate(id, { name, email });

    // Fetch updated player details
    const player = await User.findById(id);

    // Pass success message to the view
    res.render('edit-player', { 
      player, 
      successMessage: 'Player details updated successfully!' 
    });
  } catch (error) {
    console.error(error);

    // In case of error, render the page with error message
    res.status(500).render('edit-player', { 
      player: { _id: id, name, email }, 
      successMessage: null,
      errorMessage: 'An error occurred while updating the player.' 
    });
  }
});

// Delete player route
router.get('/delete-player/:id', isAuthenticated, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id); // Delete the player
    // Redirect with a success message as a query parameter
    res.redirect('/admin/players?message=Player deleted successfully');
  } catch (error) {
    console.error(error);
    // Redirect with an error message if deletion fails
    res.redirect('/admin/players?message=Error deleting player');
  }
});




// turf routes

//  edit turf
router.get('/edit-turf/:id', isAuthenticated, async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) {
      return res.status(404).send("Turf not found");
    }
    res.render('edit-turf', { turf });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// Update turf
router.post('/edit-turf/:id', isAuthenticated, async (req, res) => {
  const { name, location, price, timings } = req.body;
    const id = req.params.id;
  try {
    // update the turf
    await Turf.findByIdAndUpdate(id,
      { name, location, price, timings: timings.split(',').map(t => t.trim()) },
      { new: true }
    );
    // Pass success message to the view
    const turf = await Turf.findById(id); // Fetch updated owner details
    res.render('edit-turf', { 
      turf, 
      successMessage: 'Turf details updated successfully!' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('edit-owner', { 
      owner: { _id: id, name, location, price, timings }, 
      successMessage: null,
      errorMessage: 'An error occurred while updating the turf.'
    });
  }
});
// Delete turf route
router.get('/delete-turf/:id', isAuthenticated, async (req, res) => {
  try {
    await Turf.findByIdAndDelete(req.params.id);
  res.redirect('/admin/turfs?message=Turf deleted successfully'); // Redirect back to the turfs list
  } catch (error) {
    console.error(error);
    // Redirect with an error message if deletion fails
    res.redirect('/admin/turfs?message=Error deleting Turf');
  }
  
});




export default router;