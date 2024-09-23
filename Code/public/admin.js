document.addEventListener('DOMContentLoaded', async () => {
const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
const username = localStorage.getItem('username');
const isAdmin = localStorage.getItem('isAdmin') === 'true';

if (!isLoggedIn || !username) {
    window.location.href = 'signIn.html';
    return;
}

const loginLink = document.getElementById('loginLink');
const profileLink = document.getElementById('profileLink');
const logoutLink = document.getElementById('logoutLink');
const adminLink = document.getElementById('adminLink');

loginLink.style.display = 'none';
profileLink.style.display = 'none';
logoutLink.style.display = 'block';
adminLink.style.display = 'block';



logoutLink.addEventListener('click', (event) => {
    event.preventDefault();
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    window.location.href = 'signIn.html';
});
});

// TODO: Add filters for search bar

// function updateFilterOptions() {
//     const tableGroup = document.getElementById('tableGroup').value;
//     const attribute = document.getElementById('attribute');
//
//     attribute.options.length = 0;
//
//     const tables = {
//         UserLocation: ['PhoneNo', 'ProvinceState', 'City'],
//         Descriptors: ['DescriptorName', 'DescriptorDescription'],
//         InstructionTime: ['Instruction', 'Duration']
//     };
//
//
//    for (const category of tables[tableGroup]) {
//            const options = document.createElement('option');
//            options.value = category;
//            options.textContent = category;
//            attribute.appendChild(options);
//    }
// }


document.addEventListener('DOMContentLoaded', async () => {
        const response = await fetch('/tableColumn');
        const data = await response.json();
        const tableColumn = {};

        for (const i of data.data) {
            if (i.length === 2) {
                const tableName = i[0];
                const attributes = i[1];
                tableColumn[tableName] = attributes.split(',');
            }
        }
        createDropdown(tableColumn);
});

function createDropdown(tables) {
    const tableGroup = document.getElementById('tableGroup');
    tableGroup.options.length = 0;

    for (const tableName in tables) {
        const option = document.createElement('option');
        option.value = tableName;
        option.textContent = tableName;
        tableGroup.appendChild(option);
    }

    tableGroup.addEventListener('change', () => updateOptions(tables));
}

function updateOptions(tables) {
    const tableGroup = document.getElementById('tableGroup').value;
    const attributes = document.getElementById('attributes');

    attributes.innerHTML = '';
    let attributeNames = tables[tableGroup];
    if (attributeNames.length > 0) {
        attributeNames.forEach(attribute => {
            const checkboxes = document.createElement('div');
            const checkbox = document.createElement('input');
            const label = document.createElement('label');
            checkbox.type = 'checkbox';
            checkbox.id = attribute;
            checkbox.value = attribute;
            label.htmlFor = attribute;
            label.textContent = attribute;

            checkboxes.appendChild(checkbox);
            checkboxes.appendChild(label);
            attributes.appendChild(checkboxes);
            });
        }

}


async function fetchTableData(tableName, columns) {
    // console.log('t',tableName);
    // console.log('c',columns);
        const response = await fetch('/fetchData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tableName: tableName,
                columns: columns
            })
        });
        const data = await response.json();
        return data.data;
}

function displayResults(data) {
    const tableResult = document.getElementById('tableResult');
    tableResult.innerHTML = '';

    if (data.length > 0) {
        data.forEach(row => {
            const resultText = document.createElement('div');
            resultText.textContent = row.join(', ');
            tableResult.appendChild(resultText);
        });
    }
}

document.getElementById('applyTable').addEventListener('click', async () => {
    const tableGroup = document.getElementById('tableGroup').value;
    const attributes = document.getElementById('attributes');
    const checkboxes = attributes.getElementsByTagName('input');
    let checkedCheckboxes = [];

    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            checkedCheckboxes.push(checkboxes[i]);
        }
    }
    // console.log(checkedCheckboxes);
    let columns=[]
    checkedCheckboxes.forEach(checkbox => {
        columns.push(checkbox.value);
    });

    if (columns.length > 0) {
        const tables = await fetchTableData(tableGroup, columns);
        displayResults(tables);
    } else {
        alert('Please select an attribute!');
    }
});

