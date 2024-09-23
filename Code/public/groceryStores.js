async function getRecipes() {
    try {
        const response = await fetch(`/recipestable1`)

        const recipes = []
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } else {
            const data = await response.json();
            // console.log('Fetched recipes:', data);

            data.data.forEach(r => {
                const [rTitle, rImg, rDescription, rID, rCreator, rCategory] = r;

                let nextRecipe = [rTitle, rID];
                recipes.push(nextRecipe);
            })
        }
        return recipes;
    } catch (error) {
        console.error('Error fetching recipes:', error);
    }
}


async function filterStores() {
    const storeContainer = document.getElementById('stores-container');
    storeContainer.innerHTML = "";
    try {

        const filterBars = Array.from(document.getElementsByClassName('filterBar'));
        const id = [];

        const options = filterBars[0].getElementsByClassName('options')[0];
        const option = options ? options.value : '';

        id.push(option);

        const response = await fetch('/filterStores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({id: id}),
        });


        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data);

        data.forEach(store => {
            const [StoreName, Address, PostalCode, City, ProvinceState, DaysOpen, Timings] = store;
            console.log(store);

            const recipeCard = document.createElement('div');
            recipeCard.classList.add('store-card');

            const titleDiv = document.createElement('div');
            titleDiv.classList.add('title');
            titleDiv.textContent = StoreName;

            const addressDiv = document.createElement('div');
            addressDiv.classList.add('address');
            addressDiv.textContent = `Address: ${Address}`;

            const CityProvStateDiv = document.createElement('div');
            CityProvStateDiv.classList.add('cityProvState');
            CityProvStateDiv.textContent = `City & Province/State: ${City} ${ProvinceState}`;

            const hoursDiv = document.createElement('div');
            hoursDiv.classList.add('hours');
            hoursDiv.textContent = `Hours: ${DaysOpen} ${Timings}`;

            recipeCard.appendChild(titleDiv);
            recipeCard.appendChild(addressDiv);
            recipeCard.appendChild(CityProvStateDiv);
            recipeCard.appendChild(hoursDiv);


            storeContainer.appendChild(recipeCard);
        });
    } catch (error) {
        console.error('Error fetching stores:', error);
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    const filtersContainer = document.getElementById('filter');
    const applyButton = document.getElementById('apply');
    const dropdown = document.getElementById("options");

    const options = await getRecipes()

    for (var i = 0; i < options.length; i++) {
        var title = options[i][0];
        var id = options[i][1];
        var opt = document.createElement("option");
        opt.textContent = title;
        opt.value = id;
        dropdown.appendChild(opt);
    }

    applyButton.addEventListener('click', filterStores);
});
