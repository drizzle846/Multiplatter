document.addEventListener('DOMContentLoaded', () => {
    const filtersContainer = document.getElementById('filter');
    const addButton = document.getElementById('addFilterButton');
    const applyButton = document.getElementById('apply');


    function makeFilterBar() {
        const filterBar = document.createElement('div');
        filterBar.className = 'filterBar';

        const andOr = document.createElement('select');
        andOr.className = 'andOr';
        andOr.add(new Option('AND', 'AND'));
        andOr.add(new Option('OR', 'OR'));
        filterBar.appendChild(andOr);

        const options = document.createElement('select');
        options.className = 'options';

        const descriptorOptgroup = document.createElement('optgroup');
        descriptorOptgroup.label = 'descriptors';
        descriptorOptgroup.className = 'descriptors';
        descriptorOptgroup.append(new Option('breakfast', 'breakfast'));
        descriptorOptgroup.append(new Option('lunch', 'lunch'));
        descriptorOptgroup.append(new Option('dinner', 'dinner'));
        descriptorOptgroup.append(new Option('dessert', 'dessert'));
        descriptorOptgroup.append(new Option('spicy', 'spicy'));
        descriptorOptgroup.append(new Option('quick', 'quick'));
        options.appendChild(descriptorOptgroup);

        filterBar.appendChild(options);
        filtersContainer.appendChild(filterBar);

        return filterBar;
    }

    function addFilterBar() {
        // if (filterCount < 4) {
            filtersContainer.appendChild(makeFilterBar());
            // filterCount++;
        // }
    }

    addButton.addEventListener('click', addFilterBar);
    applyButton.addEventListener('click', filterRecipes);
});

async function filterRecipes() {
    const filterBars = Array.from(document.getElementsByClassName('filterBar'));
    const filters = [];
    for (let i = 0; i < filterBars.length; i++) {
        const options = filterBars[i].getElementsByClassName('options')[0];
        const option = options ? options.value : '';
        const andOrs = filterBars[i].getElementsByClassName('andOr')[0];
        const andOr = andOrs ? andOrs.value : '';
        const ratings = filterBars[i].getElementsByClassName('ratings')[0];
        const rating = ratings ? ratings.value : '';
        // const isNumeric = !isNaN(option);
        // const type = isNumeric ? 'rating' : 'descriptor';
        console.log(option, rating, andOr);

        filters.push({
            option: option,
            rating: rating,
            andOr: andOr
        });

        console.log('Filters:', filters);

        try {
            console.log('Fetching filtered recipes...');
            const response = await fetch('/filteredRecipes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({filters: filters}),
            });

            console.log('js response', response);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Data received:', data);
            console.log('Data to display', data.data);

            const recipeContainer = document.getElementById('recipes-container');
            recipeContainer.innerHTML = '';
            const username = localStorage.getItem('username');

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
    }
}

