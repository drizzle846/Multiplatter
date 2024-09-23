const express = require('express');
const appService = require('./appService');

const router = express.Router();
//const path = require('path');


// ----------------------------------------------------------
// API endpoints
// Modify or extend these routes based on your project's needs.
router.get('/check-db-connection', async (req, res) => {
    const isConnect = await appService.testOracleConnection();
    if (isConnect) {
        res.send('connected');
    } else {
        res.send('unable to connect');
    }
});

router.get('/recipestable', async (req, res) => {
    try{
        console.log('Fetching recipes...');
        const tableContent = await appService.fetchRecipesWithAvgRating();
        console.log('Fetched recipes:', tableContent);
        res.json({data:tableContent});
    } catch (err) {
        console.error('Error fetching recipes:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});
router.get('/recipestable1', async (req, res) => {
    const tableContent = await appService.fetchRecipesFromDb();
    res.json({data:tableContent});
});

router.get('/ratingstable', async (req, res) => {
    const tableContent = await appService.fetchRatingsFromDb();
    res.json({data:tableContent});
});


router.post("/initiate-all-tables", async (req, res) => {
    const initiateResult = await appService.initiateAlltables();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});


// Check login status route
router.get('/checkLoginStatus', (req, res) => {
    const isLoggedIn = req.session && req.session.user;
    res.json({ isLoggedIn });
});

router.post('/saveRecipe', async (req, res) => {
    // const username = localStorage.getItem('username');
    // if (!username) {
    //     return res.status(401).json({ error: 'Unauthorized' });
    // }
    const { recipeId, username } = req.body;
    //const username = req.session.user.username;
    const savesResult = await appService.saveRecipe(recipeId, username);
    if (savesResult) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

router.get('/api/recipe/:id(\\d+)', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const recipe = await appService.fetchRecipesFromDbById(id);

        console.log(recipe);

        if (recipe) {
            res.json(recipe);
        } else {
            res.status(404).json({error: 'Data not found'});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Error fetching data'});
    }
});

router.get('/requiredItems/:id(\\d+)', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const ingredients = await appService.getRequiredItems(id);

        if (ingredients) {
            res.json(ingredients);
        } else {
            res.status(404).json({error: 'Data not found'});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Error fetching data'});
    }
});

router.get('/instructions/:id(\\d+)', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const instructions = await appService.getInstruction(id);

        if (instructions) {
            res.json(instructions);
        } else {
            res.status(404).json({error: 'Data not found'});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Error fetching data'});
    }
});

router.get('/tags/:id(\\d+)', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const tags = await appService.getTags(id);

        if (tags) {
            res.json(tags);
        } else {
            res.status(404).json({error: 'Data not found'});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Error fetching data'});
    }
});

router.get('/comments/:id(\\d+)', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const comments = await appService.getComments(id);

        if (comments) {
            res.json(comments);
        } else {
            res.status(404).json({error: 'Data not found'});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Error fetching data'});
    }
});


router.post("/logintable", async (req, res) => {
    const { Username, Password } = req.body;
    const loginResult = await appService.loginUser(Username, Password);

    if (loginResult) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

router.get('/api/user/:username', async (req, res) => {
    const username = req.params.username;
    const userDetails = await appService.getUserDetails(username);

    if (userDetails) {
        res.json(userDetails);
    } else {
        res.status(404).send('User not found');
    }
});

router.post("/signup", async (req, res) => {
    try {
        const {City,ProvinceState,Username, Password, PhoneNo, Email, Name} = req.body;
        const signUpResult = await appService.signupUser(City,ProvinceState,Username, Password, PhoneNo, Email, Name);
        if (signUpResult) {
            res.json({success: true});

        } else {
            res.json({success: false});
        }

    } catch (err) {
        res.status(500).json({error: 'Failed to Sign up!'});
    }
});

router.get('/api/user/:username/saved-recipes', async (req, res) => {
    try {
        const username = req.params.username;
        const recipes = await appService.getSavedRecipes(username);
        res.json({ data: recipes });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch saved recipes' });
    }
});



router.get('/api/user/:username/created-recipes', async (req, res) => {
    try {
        const username = req.params.username;
        const recipes = await appService.getCreatedRecipes(username);
        res.json({ data: recipes });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch created recipes' });
    }
});

router.post('/api/user/deleteAccount', async (req, res) => {
    try {
        const {PhoneNo} = req.body;
        const deleteResult = await appService.deleteAcount(PhoneNo);
        if (deleteResult) {
            res.json({success: true});

        } else {
            res.json({success: false});
        }

    } catch (err) {
        res.status(500).json({error: 'failed to delete account'});
    }
});

router.post('/filteredRecipes', async (req, res) => {
    const filters = req.body.filters;
    console.log(filters);
    try {
        const recipes = await appService.getFilteredRecipes(filters);
        res.json({ data: recipes });
    } catch (error) {
        res.status(500).json({ error: 'could not filter '});
    }
});

router.get('/getUsedRecipeID', async (req, res) => {
    try {
        const tableContent = await appService.getUsedRecipeID();
        console.log( tableContent);
        res.json(tableContent);
    } catch (err) {
        console.error('Error getting user', err);
        res.status(500).json({ error: 'no top user yet!' });
    }
});

router.post("/createRecipe", async (req, res) => {
    try {
        const {Title, Picture, RecipeDescription, RecipeID, Username, DescriptorName} = req.body;
        const result = await appService.createRecipe(Title, Picture, RecipeDescription, RecipeID, Username, DescriptorName);
        if (result) {
            res.json({success: true});

        } else {
            res.json({success: false});
        }

    } catch (err) {
        res.status(500).json({error: 'Failed to create Recipe!'});
    }
});

// router.post('/api/user/updateAccount', async (req, res) => {
//     const { username, password, newCity, newProvinceState  } = req.body;
//     const updateResult = await appService.updateUser(username, password, newCity, newProvinceState);
//     if (updateResult) {
//         res.json({ success: true });
//     } else {
//         res.status(500).json({ success: false });
//     }
// });

router.post('/filterStores', async (req, res) => {
    try {
        const rID = req.body.id[0];

        const stores = await appService.getStoresSellingIngredients(rID);
        res.json(stores);
    } catch (err) {
        console.error('Error getting store', err);
        res.status(500).json({ error: 'no valid store!' });
    }
});

router.get('/topUser', async (req, res) => {
    try {
        const tableContent = await appService.findTopUser();
        console.log( tableContent);
        res.json({ data: tableContent });
    } catch (err) {
        console.error('Error getting user', err);
        res.status(500).json({ error: 'no top user yet!' });
    }
});

router.get('/tableColumn', async (req, res) => {
    try {
        const tableContent = await appService.fetchAllTablesColumns();
        console.log( tableContent);
        res.json({ data: tableContent });
    } catch (err) {
        console.error('Error getting all tables and columns', err);
        res.status(500).json({ error: 'error!' });
    }
});
//
router.post('/fetchData', async (req, res) => {
    const { tableName, columns } = req.body;
    // console.log('c in ac',columns);
    // console.log('in ac')
    try {
        const data = await appService.fetchTable(tableName, columns);
        res.json({ data });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

router.get('/topRecipe', async (req, res) => {
    try {
        const tableContent = await appService.toprecipe();
        console.log( tableContent);
        res.json({ data: tableContent });
    } catch (err) {
        console.error('Error getting recipe', err);
        res.status(500).json({ error: 'no top recipe yet!' });
    }
});

router.post('/updateUserDetails', async (req, res) => {
    const { Username,Password,Email,Name,Confirm } = req.body;
    const updateResult = await appService.updateUserDetails(Username,Password,Email,Name,Confirm);
    if (updateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/quickRecipe', async (req, res) => {
    try {
        const tableContent = await appService.quickrecipe();
        console.log( tableContent);
        res.json({ data: tableContent });
    } catch (err) {
        console.error('Error getting recipe', err);
        res.status(500).json({ error: 'no quick recipe yet!' });
    }
});


module.exports = router;