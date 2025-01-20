import express from 'express';
import User from '../models/User.js';
import Owner from '../models/Owner.js';
import Turf from '../models/Turf.js';


const router = express.Router();

router.get('/', async (req, res) => {
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


router.get('/owners', async (req, res) => {
  const owners = await Owner.find();
  res.render('owners', { owners });
});

router.get('/players', async (req, res) => {
  const players = await User.find();
  res.render('players', { players });
});

router.get('/turfs', async (req, res) => {
  const turfs = await Turf.find();
  res.render('turfs', { turfs });
});

// Edit owner route
router.get('/edit-owner/:id', async (req, res) => {
  const owner = await Owner.findById(req.params.id);
  res.render('edit-owner', { owner });
});

// Update owner route
router.post('/update-owner/:id', async (req, res) => {
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
router.get('/delete-owner/:id', async (req, res) => {
  try {
    await Owner.findByIdAndDelete(req.params.id); // Delete the owner
    // Redirect to owners list with a success message
    res.redirect('/admin/owners?message=Owner deleted successfully');
  } catch (error) {
    console.error(error);
    // Redirect to owners list with an error message
    res.redirect('/admin/owners?message=Error deleting owner');
  }
});



// Edit player route
router.get('/edit-player/:id', async (req, res) => {
  const player = await User.findById(req.params.id);
  res.render('edit-player', { player });
});

// Update player route
router.post('/update-player/:id', async (req, res) => {
  const { name, email } = req.body;
  await User.findByIdAndUpdate(req.params.id, { name, email });
  res.redirect('/admin/players'); // Redirect back to players list
});
// Delete player route
router.get('/delete-player/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/admin/players'); // Redirect back to players list
});

//  edit turf
router.get('/edit-turf/:id', async (req, res) => {
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
router.post('/edit-turf/:id', async (req, res) => {
  try {
    const { name, location, price, timings } = req.body;
    const updatedTurf = await Turf.findByIdAndUpdate(
      req.params.id,
      { name, location, price, timings: timings.split(',').map(t => t.trim()) },
      { new: true }
    );
    res.redirect('/admin/turfs'); // Redirect back to turfs list
  } catch (err) {
    res.status(500).send("Server Error");
  }
});
// Delete turf route
router.get('/delete-turf/:id', async (req, res) => {
  await Turf.findByIdAndDelete(req.params.id);
  res.redirect('/admin/turfs'); // Redirect back to the turfs list
});




export default router;