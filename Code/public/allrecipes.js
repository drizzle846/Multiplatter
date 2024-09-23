document.addEventListener('DOMContentLoaded', async () => {
    const recipeContainer = document.getElementById('recipes-container');
    const username = localStorage.getItem('username');


    try {
        const response = await fetch('/recipestable');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data);

        if (!data.data || !Array.isArray(data.data)) {
            console.error('Invalid data format');
            return;
        }

        data.data.forEach(recipe => {
            const [id, title, description, avgRating] = recipe;

            const recipeCard = document.createElement('div');
            recipeCard.classList.add('recipe-card');

            const img = document.createElement('img');
            img.alt = title || 'No title';

            const titleDiv = document.createElement('div');
            titleDiv.classList.add('title');
            titleDiv.textContent = title || 'No title';

            const ratingDiv = document.createElement('div');
            ratingDiv.classList.add('rating');
            ratingDiv.textContent = `Average Rating: ${avgRating !== null && avgRating !== undefined ? avgRating.toFixed(2) : 'N/A'}`;

            const link = document.createElement('a');
            link.href = `/recipe/${id}`;
            link.classList.add('recipe-link');


            const heartButton = document.createElement('button');
            heartButton.classList.add('heart-button');
            heartButton.innerHTML = '❤';
            heartButton.addEventListener('click', async () => {


                if (!username) {
                    alert('Please log in to save recipes');
                    window.location.href = 'signIn.html';
                    return;
                } else {
                    saveRecipe(id, username);
                }

            });
            link.appendChild(titleDiv);
            recipeCard.appendChild(link);
            //recipeCard.appendChild(titleDiv);
            recipeCard.appendChild(ratingDiv);
            recipeCard.appendChild(heartButton);

            recipeContainer.appendChild(recipeCard);
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
    }
});

async function saveRecipe(recipeId, username) {
    try {
        const response = await fetch('/saveRecipe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ recipeId, username }),
        });
        if (response.ok) {
            alert('Recipe saved successfully!');
        } else {
            throw new Error('Failed to save recipe');
        }
    } catch (error) {
        console.error('Error saving recipe:', error);
        alert('Failed to save recipe');
    }
}
