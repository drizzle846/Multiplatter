const oracledb = require('oracledb');
const loadEnvFile = require('./utils/envUtil');

const envVariables = loadEnvFile('./.env');

const fs = require('fs');

// Database configuration setup. Ensure your .env file has the required database credentials.
const dbConfig = {
    user: envVariables.ORACLE_USER,
    password: envVariables.ORACLE_PASS,
    connectString: `${envVariables.ORACLE_HOST}:${envVariables.ORACLE_PORT}/${envVariables.ORACLE_DBNAME}`,
    poolMin: 1,
    poolMax: 3,
    poolIncrement: 1,
    poolTimeout: 60
};

// initialize connection pool
async function initializeConnectionPool() {
    try {
        await oracledb.createPool(dbConfig);
        console.log('Connection pool started');
        initiateAlltables();
    } catch (err) {
        console.error('Initialization error: ' + err.message);
    }
}

async function closePoolAndExit() {
    console.log('\nTerminating');
    try {
        await oracledb.getPool().close(10); // 10 seconds grace period for connections to finish
        console.log('Pool closed');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

initializeConnectionPool();

process
    .once('SIGTERM', closePoolAndExit)
    .once('SIGINT', closePoolAndExit);

// ----------------------------------------------------------
// Wrapper to manage OracleDB actions, simplifying connection handling.
async function withOracleDB(action) {
    let connection;
    try {
        connection = await oracledb.getConnection(); // Gets a connection from the default pool
        return await action(connection);
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

// ----------------------------------------------------------
// Core functions for database operations
// Modify these functions, especially the SQL queries, based on your project's requirements and design.
async function testOracleConnection() {
    return await withOracleDB(async (connection) => {
        return true;
    }).catch(() => {
        return false;
    });
}


//SQL Statements to create and insert initial values for all tables
async function initiateAlltables() {
    return await withOracleDB(async (connection) => {
        const script = fs.readFileSync('./database.sql', 'utf8');
        const statements = script.split(';').filter(stmt => stmt.trim());
        for (const s of statements) {
            try {
                await connection.execute(s);
            } catch (err) {
                console.log(s);
                console.error(err);
            }
        }
        return true;
    }).catch(() => {
        return false;
    });
}

async function fetchRecipesFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM RecipeCreatesSortedBy');
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function fetchRecipesFromDbById(id) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT r.Title, r.RecipeDescription, r.RecipeID, r.Username, r.DescriptorName, AVG(rt.Rating) as AvgRating
            FROM RECIPECREATESSORTEDBY r
            LEFT JOIN FEEDBACKRESPONDSWITHENGAGESWITH f ON r.RecipeID = f.RecipeID
            LEFT JOIN RATING rt ON f.FeedbackID = rt.FeedbackID
            WHERE r.RecipeID = :id
            GROUP BY r.Title, r.RecipeDescription, r.RecipeID, r.Username, r.DescriptorName`,
            [id]
        );
        return result.rows[0];
    }).catch(() => {
        return [];
    });
}
async function getTags(id) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT d.DescriptorName, d.DescriptorDescription
            FROM DESCRIPTORS d
            LEFT JOIN CLASSIFIESBY cb ON d.DescriptorName = cb.DescriptorName
            WHERE cb.RecipeID = :id`,
            [id]
        );
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function checkLoginStatus() {
    try {
        const response = await fetch('/checkLoginStatus');
        const data = await response.json();
        return data.isLoggedIn;
    } catch (error) {
        console.error('Error checking login status:', error);
        return false;
    }
}

async function fetchRecipesWithAvgRating() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT r.RecipeID, r.Title, r.RecipeDescription, AVG(rt.Rating) as AvgRating
            FROM RECIPECREATESSORTEDBY r
            LEFT JOIN FEEDBACKRESPONDSWITHENGAGESWITH f ON r.RecipeID = f.RecipeID
            LEFT JOIN RATING rt ON f.FeedbackID = rt.FeedbackID
            GROUP BY r.RecipeID, r.Title, r.RecipeDescription
        `);
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}


async function fetchRatingsFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM Rating');
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function saveRecipe(recipeId, username) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('INSERT INTO Saves (RecipeID, Username) VALUES (:recipeId, :username)',
            [recipeId, username],
            {autoCommit: true});

    }).catch(() => {
        return false;
    })
}

async function loginUser(username, password) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT u.Username, u.Password
            FROM UserDetails u
            WHERE u.Username = :username AND u.Password = :password
        `, [username, password]);

        return result.rows.length > 0;
    }).catch(() => {
        return false;
    });
}

async function getUserDetails(username) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT ud.Username, ud.Name, ud.Email, ud.PhoneNo, ul.City, ul.ProvinceState
             FROM UserDetails ud
             JOIN UserLocation ul ON ud.PhoneNo = ul.PhoneNo
             WHERE ud.Username = :username`,
            [username]
        );

        if (result.rows.length > 0) {
            const row = result.rows[0];
            return {
                Username: row[0],
                Name: row[1],
                Email: row[2],
                PhoneNo: row[3],
                City: row[4],
                ProvinceState: row[5]
            };
        } else {
            return null;
        }

    }).catch(() => {
        console.error('Error in getUserDetails:');
        return null;
    });

}

async function signupUser(city, provinceState, username, password, phoneNo, email, name) {
    return await withOracleDB(async (connection) => {
        const userstate = await connection.execute(`
         SELECT u.Username FROM UserDetails u
         where u.Username = :username`,
            [username]);

        if (userstate.rows.length > 0) {
            console.log('user already exists , appservice');
            return false;
        }

        const emailstate = await connection.execute(`
         SELECT u.Username FROM UserDetails u
         where u.Email = :email`,
            [email]);
        if (emailstate.rows.length > 0) {
            console.log('email already in use , appservice');
            return false;
        }

        const phonestate = await connection.execute(`
         SELECT u.Username FROM UserDetails u
         where u.PhoneNo = :phoneNo`,
            [phoneNo]);
        if (phonestate.rows.length > 0) {
            return false;
        }

        const result1 = await connection.execute(
            `INSERT INTO UserLocation (PhoneNo, ProvinceState, City) 
            VALUES (:phoneNo, :provinceState, :city) `,
            [phoneNo, provinceState, city], {autocommit: true});

        const result2 = await connection.execute(
            `INSERT INTO USERDETAILS (Username,Password, PhoneNo, Email, Name) 
            VALUES (:username,:password,:phoneNo, :email,:name) `,
            [username, password, phoneNo, email, name],
            {autoCommit: true}
        );
        return result1.rowsAffected > 0 && result2.rowsAffected > 0;

    }).catch(() => {
        return false;
    });
}

async function getSavedRecipes(username) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT r.RecipeID, r.Title, r.RecipeDescription, AVG(rt.Rating) AS AvgRating
             FROM RecipeCreatesSortedBy r
                      JOIN Saves sr ON r.RecipeID = sr.RecipeID
                      LEFT JOIN FEEDBACKRESPONDSWITHENGAGESWITH f ON r.RecipeID = f.RecipeID
                      LEFT JOIN RATING rt ON f.FeedbackID = rt.FeedbackID
             WHERE sr.Username = :username
             GROUP BY r.RecipeID, r.Title, r.RecipeDescription
            `,
            [username]
        );
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}

async function getInstruction(recipeID) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT i.StepNumber, i.Instruction, t.Term, t.Definition, it.Duration
            FROM InstructionStep i
            LEFT JOIN Elaborates e ON i.RecipeID = e.RecipeID AND i.StepNumber = e.StepNumber
            LEFT JOIN Terminology t ON e.Term = t.Term
            LEFT JOIN InstructionTime it ON it.Instruction = i.Instruction
            WHERE i.RecipeID = :recipeID
        `,
            [recipeID]);
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}

async function getRequiredItems(recipeID) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT ri.ItemName, ri.ItemDescription, u.Quantity, u.Unit, s1.SubstituteName
            FROM RequiredItems ri
            LEFT JOIN Uses u ON ri.ItemName = u.ItemName
            LEFT JOIN Substitutes s1 ON ri.ItemName = s1.IngredientName
            LEFT JOIN Substitutes s2 ON ri.ItemName = s2.SubstituteName AND s1.IngredientName <> s2.SubstituteName
            WHERE u.RecipeID = :recipeID
            ORDER BY ri.ItemName, s1.SubstituteName
        `,
            [recipeID]);
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}

async function getComments(recipeID) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT c.Content, TO_CHAR(f.DateTime, 'DD Mon YYYY') AS formattedDate, f.Username, f.FeedbackID, c.ParentID
            FROM FeedbackRespondsWithEngagesWith f
            LEFT JOIN CommentsRepliesTo c ON c.FeedbackID = f.FeedbackID
            WHERE f.RecipeID = :recipeID
            ORDER BY f.DateTime
        `,
            [recipeID]);
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}

async function getCreatedRecipes(username) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT r.RecipeID, r.Title, r.RecipeDescription, AVG(rt.Rating) AS AvgRating
            FROM RecipeCreatesSortedBy r
            LEFT JOIN FEEDBACKRESPONDSWITHENGAGESWITH f ON r.RecipeID = f.RecipeID
            LEFT JOIN RATING rt ON f.FeedbackID = rt.FeedbackID
            WHERE r.Username = :username
            GROUP BY r.RecipeID, r.Title, r.RecipeDescription
            `,
            [username],
        );
        return result.rows;
    }).catch((err) => {
        console.error('Error fetching your recipes:', err);
        return [];
    });
}


async function deleteAcount(phoneNo) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `DELETE FROM UserLocation WHERE PhoneNo = :phoneNo`,
            [phoneNo],
            {autoCommit:true}
        );
        console.log('almost done try appservice');
        return result.rowsAffected > 0 && result.rowsAffected > 0;
    }).catch((err) => {
        console.error('Error!', err);
        return false;
    });
}

async function getFilteredRecipes(filters) {
    console.log(filters);
    let sqlCode = `
        SELECT r.RecipeID, r.Title, r.RecipeDescription, AVG(rt.Rating) as AvgRating
        FROM RECIPECREATESSORTEDBY r
        LEFT JOIN FEEDBACKRESPONDSWITHENGAGESWITH f ON r.RecipeID = f.RecipeID
        LEFT JOIN RATING rt ON f.FeedbackID = rt.FeedbackID
    `;

    let conditions = [];
    let ratingCondition = '';

    filters.forEach((filter, index) => {
        const { option, rating, andOr } = filter;
        let currentCondition = '';
        let currentConditionRating = '';

        if (option) {
            currentCondition = `r.DescriptorName = '${option}'`;
        }

        if (currentCondition) {
            if (index > 0 && andOr) {
                conditions.push(`${andOr} ${currentCondition}`);
            } else {
                conditions.push(currentCondition);
            }
        }

        if (rating) {
            currentConditionRating = `AVG(rt.Rating) >= ${rating}`;
        }

        if (currentConditionRating) {
            ratingCondition = `HAVING ${currentConditionRating}`;
        }
    });

    console.log( conditions);
    console.log(ratingCondition);

    if(conditions.length > 0) {
        sqlCode += ' '  + 'WHERE ' + conditions.join(' ')+ ' ' +
            'GROUP BY r.RecipeID, r.Title, r.RecipeDescription ' + ratingCondition;
    } else {
        sqlCode +=' ' + 'GROUP BY r.RecipeID, r.Title, r.RecipeDescription '
            +  ratingCondition;
    }

    console.log(sqlCode);
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(sqlCode);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function findTopUser() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT r.Username FROM RECIPECREATESSORTEDBY r 
            LEFT JOIN FEEDBACKRESPONDSWITHENGAGESWITH f ON r.RecipeID = f.RecipeID
            LEFT JOIN RATING rt ON f.FeedbackID = rt.FeedbackID
            GROUP BY r.Username
            HAVING AVG(rt.Rating) >= ALL (SELECT AVG(rt2.Rating)
                                                 FROM RATING rt2
                                                 LEFT JOIN FeedbackRespondsWithEngagesWith f on f.FeedbackID = rt2.FeedbackID
                                                 LEFT JOIN RecipeCreatesSortedBy r2 on r2.RecipeID = f.RecipeID
                                                 GROUP BY r2.Username) `);
        if (result.rows.length > 0) {

            console.log(result.rows);

            let usernames = [];
            for (let i = 0; i < result.rows.length; i++) {
                usernames.push(result.rows[i]);
            }
            console.log(usernames);
            return usernames;
        } else {
            return []
        }
    }).catch(() => {
        console.error('Error fetching top user:');
        return [];
    });
}

async function getUsedRecipeID() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT RecipeId
            FROM RecipeCreatesSortedBy
        `);
        return result.rows;
    }).catch((err) => {
        console.error(err);
        return [];
    });
}

async function createRecipe(Title, Picture, RecipeDescription, RecipeID, Username, DescriptorName) {
    return await withOracleDB(async (connection) => {
        const recipestate = await connection.execute(`
         SELECT r.Title
         FROM RecipeCreatesSortedBy r
         where r.Title = :Title`,
            [Title]);

        if (recipestate.rows.length > 0) {
            console.log('Recipe of the same name already exists , appservice');
            return false;
        }

        const result = await connection.execute(
            `INSERT INTO RecipeCreatesSortedBy (Title, Picture, RecipeDescription, RecipeID, Username, DescriptorName)
            VALUES (:Title, :Picture, :RecipeDescription, :RecipeID, :Username, :DescriptorName) `,
            [Title, Picture, RecipeDescription, RecipeID, Username, DescriptorName], {autocommit: true});

        return result.rowsAffected > 0;

    }).catch(() => {
        return false;
    });
}

async function getStoresSellingIngredients(id) {

    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT gsl.StoreName, gsl.Address, gsl.PostalCode, gsa.City, gsa.ProvinceState, gst.DaysOpen, gst.Timings
            FROM GroceryStoreLocation gsl
            LEFT JOIN GroceryStoreTimings gst ON gsl.StoreName = gst.StoreName
            LEFT JOIN GroceryStoresArea gsa ON gsl.PostalCode = gsa.PostalCode
            LEFT JOIN SoldByCurrency sbc ON gsl.PostalCode = sbc.PostalCode
            WHERE NOT EXISTS ((
                SELECT u.ItemName
                FROM Uses u
                WHERE u.RecipeID = :id)
                MINUS (
                    SELECT sbl.ItemName
                    FROM SoldByLocation sbl
                    WHERE sbl.PostalCode = gsl.PostalCode AND sbl.Address = gsl.Address))
            `,
            [id]
        );
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// async function updateUser(event) {
//     let connection;
//     const response = await fetch('/api/user/updateAccount', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             Username: username,
//             Password: password,
//             NewCity: newCity,
//             NewProvinceState: newProvinceState
//         })
//     });
//
//     const responseData = await response.json();
//
//     if (responseData.success) {
//         messageElement.textContent = "Updated successfully!";
//         fetchTableData();
//     } else {
//         messageElement.textContent = "Error updating!";
//     }
// }


async function fetchAllTablesColumns() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT table_name,listagg(column_name,',')
                          WITHIN GROUP ( ORDER BY column_id ) columns
                          FROM user_tab_cols
                          GROUP BY table_name`);
        if (result.rows.length > 0) {
            console.log(result.rows);
            console.log(result.rows[0]);
            console.log(result.rows[1]);
            return result.rows;
        } else {
            return []
        }
    }).catch((err) => {
        console.error('Error fetching top user:', err);
        return [];
    });
}

// Resource https://stackoverflow.com/questions/36747495/listing-all-tables-and-columns-from-my-database-oracle
// https://docs.oracle.com/en/database/oracle/oracle-database/21/sqlrf/LISTAGG.html

async function fetchTable(tableName, columns) {
    return await withOracleDB(async (connection) => {
        const columnNames = columns.join(', ');
        const sql = `SELECT ${columnNames} FROM ${tableName}`;

        console.log('SQL:', sql);
        const result = await connection.execute(
            `SELECT ${columnNames} FROM ${tableName}`);

        return result.rows;

    }).catch((err) => {
        console.error('Error fetching table:', err);
        return [];
    });
}

async function toprecipe() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT r.Title FROM RECIPECREATESSORTEDBY r 
            LEFT JOIN FEEDBACKRESPONDSWITHENGAGESWITH f ON r.RecipeID = f.RecipeID
            LEFT JOIN RATING rt ON f.FeedbackID = rt.FeedbackID
            GROUP BY r.Title
            HAVING AVG(rt.Rating) >= ALL (SELECT AVG(rt2.Rating)
                                                 FROM RATING rt2
                                                 LEFT JOIN FeedbackRespondsWithEngagesWith f on f.FeedbackID = rt2.FeedbackID
                                                 LEFT JOIN RecipeCreatesSortedBy r2 on r2.RecipeID = f.RecipeID
                                                 GROUP BY r2.Username) `);

        if (result.rows.length > 0) {

            console.log(result.rows);

            let recipe = [];
            for (let i = 0; i < result.rows.length; i++) {
                recipe.push(result.rows[i]);
            }
            console.log(recipe);
            return recipe;
        } else {
            return []
        }
    }).catch(() => {
        console.error('Error fetching top recipe:');
        return [];
    });
}

async function updateUserDetails(username,password,email,name,confirm) {
    return await withOracleDB(async (connection) => {
        let sql =[];
        let bindVar = [];
        if (username.length !== 0) {
            const confirmResult = await connection.execute(`
            SELECT u.Password
            FROM UserDetails u
            WHERE u.Username = :username AND u.Password = :confirm
        `,[username,confirm]);
            if (confirmResult.rows.length > 0) {
                if (password) {
                    sql.push(`Password = :password`);
                    bindVar.push(password);
                }
                if (email) {
                    sql.push(`Email = :email`);
                    bindVar.push(email);
                }
                if (name) {
                    sql.push(`Name = :name`);
                    bindVar.push(name);
                }
            } else {
                console.error('wrong password');
                return false;
            }
        }
        bindVar.push(username);
        if (sql.length === 0) {
            console.error('No attributes to update');
        }

        let sqlCode = `UPDATE UserDetails SET ` + sql.join(', ') + ' WHERE Username = :username';
        console.log(sqlCode);
        const result = await connection.execute(sqlCode, bindVar, { autoCommit: true }
        );
        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function quickrecipe() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT r.Title FROM RecipeCreatesSortedBy r
            JOIN InstructionStep i ON r.RecipeID = i.RecipeID
            JOIN InstructionTime it ON it.Instruction = i.Instruction
            GROUP BY r.Title
            HAVING AVG(it.Duration)<= ALL (
            SELECT AVG(it2.Duration)
            FROM InstructionStep i2
            JOIN InstructionTime it2 ON it2.Instruction = i2.Instruction
            GROUP BY i2.RecipeID)
`);

        if (result.rows.length > 0) {

            console.log(result.rows);

            let recipe = [];
            for (let i = 0; i < result.rows.length; i++) {
                recipe.push(result.rows[i]);
            }
            console.log(recipe);
            return recipe;
        } else {
            return []
        }
    }).catch(() => {
        console.error('Error fetching quick recipe:');
        return [];
    });
}


module.exports = {
    testOracleConnection,
    initiateAlltables,
    fetchRecipesFromDb,
    fetchRecipesFromDbById,
    fetchRatingsFromDb,
    fetchRecipesWithAvgRating,
    checkLoginStatus,
    saveRecipe,
    loginUser,
    signupUser,
    getUserDetails,
    getSavedRecipes,
    getRequiredItems,
    getInstruction,
    getCreatedRecipes,
    deleteAcount,
    getFilteredRecipes,
    findTopUser,
    fetchAllTablesColumns,
    fetchTable,
    getTags,
    getComments,
    getUsedRecipeID,
    getStoresSellingIngredients,
    toprecipe,
    updateUserDetails,
    quickrecipe
};