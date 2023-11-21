window.onload = function() {
    const savedUser = getUser();
    checkLoginStatus();
    if (savedUser.username !== null) {
        fetchRoutes(savedUser.username, savedUser.password);
        toggleRouteBlock(savedUser.role)
    }
};

function saveUser(username, password, role) {
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    localStorage.setItem('role', role);
}

function getUser() {
    const username = localStorage.getItem('username');
    const password = localStorage.getItem('password');
    const role = localStorage.getItem('role');
    return { username, password, role };
}


function logOff() {
    localStorage.removeItem('username');
    localStorage.removeItem('password'); 
    localStorage.removeItem('role');               
    window.location.href = 'index.html';
}

function checkLoginStatus() {
    const username = localStorage.getItem('username');
    const password = localStorage.getItem('password');

    if (username && password) {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('registerBtn').style.display = 'none';
        document.getElementById('logoffButton').style.display = 'inline-block';
        document.getElementById('logoffButton').innerHTML = username + ' <i class="fa fa-sign-out" style="font-size:16px"></i>';

    } 
    else 
    {
        document.getElementById('loginBtn').style.display = 'inline-block';
        document.getElementById('registerBtn').style.display = 'inline-block';
        document.getElementById('logoffButton').style.display = 'none';
    }
}
const routesTable = document.getElementById('routesTable');

async function fetchRoutes(username, password) {
    try 
    {
        const basicAuth = 'Basic ' + btoa(username + ':' + password);
        const response = await fetch('http://localhost:5000/login', 
        {
            method: 'POST',
            headers: {
                'Authorization': basicAuth,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.status === 200) 
        {
            const allRoutesResponse = await fetch('http://localhost:5000/routes');
            const allRoutes = await allRoutesResponse.json();
            renderRoutes(allRoutes, data.role);   
        } 
        else 
        {
            alert('Authentication failed.');
        }
    } 
    catch (error) 
    {
        console.error('Error fetching routes:', error);
    }
}


function renderRoutes(routesData, userRole) 
{
    const routes = routesData.routes;
    routesTable.innerHTML = '';

    routes.forEach(route => {
        const row = `
            <tr>
                ${userRole === 'employee' ? `<td data-bs-toggle="modal" data-bs-target="#routeInfoModal" onclick="displayRouteInfo(${route.id})">${route.departure_location}</td>` : `<td>${route.departure_location}</td>`}                           
                ${userRole === 'employee' ? `<td data-bs-toggle="modal" data-bs-target="#routeInfoModal" onclick="displayRouteInfo(${route.id})">${route.destination}</td>` : `<td>${route.destination}</td>`}                           
                ${userRole === 'employee' ? `<td data-bs-toggle="modal" data-bs-target="#routeInfoModal" onclick="displayRouteInfo(${route.id})">${route.departure_time}</td>` : `<td>${route.departure_time}</td>`}                           
                ${userRole === 'employee' ? `<td><button class="btn btn-danger" onclick="deleteRoute(${route.id})">Delete</button></td>` : ''}
            </tr>
        `;
        routesTable.innerHTML += row;
    });

    const deleteColumnHeader = document.querySelector('th:nth-child(4)');
    if (userRole !== 'employee') 
    {
        deleteColumnHeader.style.display = 'none';
    } 
    else 
    {
        deleteColumnHeader.style.display = '';
    }
}


async function deleteRoute(routeId) 
{
    try 
    {
        const response = await fetch(`http://localhost:5000/routes/${routeId}`, 
        {
            method: 'DELETE'
        });

        if (response.status === 200) 
        {
            const user = getUser();
            fetchRoutes(user.username, user.password);
            alert('Route deleted successfully');
        } 
        else 
        {
            console.error('Failed to delete route.');
        }
    } 
    catch (error) 
    {
        console.error('Error deleting route:', error);
    }
}

async function deleteRouteFromModal() 
{
    const routeId = document.getElementById('routeId').value;

    try 
    {
        const response = await fetch(`http://localhost:5000/routes/${routeId}`, 
        {
            method: 'DELETE'
        });

        if (response.status === 200) 
        {
            const user = getUser();
            fetchRoutes(user.username, user.password);
            alert('Route deleted successfully');
            $('#routeInfoModal').modal('hide');
        } 
        else 
        {
            console.error('Failed to delete route.');
        }
    } 
    catch (error) 
    {
        console.error('Error deleting route:', error);
    }
}

async function displayRouteInfo(routeId) 
{
    try {
        const response = await fetch(`http://localhost:5000/routes/${routeId}`);
        const route = await response.json();
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="mb-3">
                <label for="routeId">Route ID:</label>
                <input type="text" class="form-control" id="routeId" readonly value="${route.id}">
            </div>
            <table class="table table-striped">
                <tr><th>Departure Location</th><td>${route.departure_location}</td></tr>
                <tr><th>Destination</th><td>${route.destination}</td></tr>
                <tr><th>Departure Time</th><td>${route.departure_time}</td></tr>
            </table>
        `;

        document.getElementById('routeId').value = route.id;
        document.getElementById('departureLocation').value = route.departure_location;
        document.getElementById('destination').value = route.destination;
        document.getElementById('departureTime').value = route.departure_time;
    } 
    catch (error)
    {
        console.error('Error fetching route information:', error);
    }
}

async function updateRouteInTable() 
{
    const updatedRouteData = getFormData();
    const routeId = updatedRouteData.id;

    try 
    {
        const response = await fetch(`http://localhost:5000/routes/${routeId}`, 
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedRouteData)
        });

        if (response.status === 200) 
        {
            const user = getUser();
            fetchRoutes(user.username, user.password);
            alert('Route updated successfully');

            document.getElementById('departureLocation').value = '';
            document.getElementById('destination').value = '';
            document.getElementById('departureTime').value = '';

            $('#routeInfoModal').modal('hide'); 
        } 
        else 
        {
            console.error('Failed to update route.');
        }
    } 
    catch (error) 
    {
        console.error('Error updating route:', error);
    }
}

async function updateRoute(routeId, updatedRouteData) 
{
    try 
    {
        const response = await fetch(`http://localhost:5000/routes/${routeId}`, 
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedRouteData)
        });

        if (response.status === 200) 
        {
            const user = getUser();
            fetchRoutes(user.username, user.password);
        } 
        else 
        {
            console.error('Failed to update route.');
        }
    } 
    catch (error) 
    {
        console.error('Error updating route:', error);
    }
}

async function addNewRoute() {
    const newRouteData = getFormData(true);
    const isEmpty = Object.values(newRouteData).some(value => value === null || value === undefined || value.trim() === '');
    if (isEmpty) {
        alert('Please fill in all fields.');
        return;
    }
    try 
    {
        const response = await fetch('http://localhost:5000/routes', 
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newRouteData)
        });

        if (response.status === 201) 
        {
            const user = getUser();
            fetchRoutes(user.username, user.password);
            alert('Route added successfully');

            document.getElementById('newDepartureLocation').value = '';
            document.getElementById('newDestination').value = '';
            document.getElementById('newDepartureTime').value = '';
        } 
        else 
        {
            console.error('Failed to add route.');
        }
    } 
    catch (error) 
    {
        console.error('Error adding route:', error);
    }
}

function getFormData(isNewRoute) 
{
    let id = null;
    if (!isNewRoute) 
    {
        id = document.getElementById('routeId').value;
    }

    const departureLocation = isNewRoute ? document.getElementById('newDepartureLocation').value : document.getElementById('departureLocation').value;
    const destination = isNewRoute ? document.getElementById('newDestination').value : document.getElementById('destination').value;
    const departureTime = isNewRoute ? document.getElementById('newDepartureTime').value : document.getElementById('departureTime').value;

    const formData = 
    {
        departure_location: departureLocation,
        destination: destination,
        departure_time: departureTime
    };

    if (!isNewRoute) 
    {
        formData.id = parseInt(id);
    }

    return formData;
}

async function loginUser() 
{
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const basicAuth = 'Basic ' + btoa(username + ':' + password);
    try 
    {
        const response = await fetch('http://localhost:5000/login', 
        {
            method: 'POST',
            headers: {
                'Authorization': basicAuth,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.status === 200) 
        {
            alert(data.message);
            saveUser(username, password, data.role);
            fetchRoutes(username, password);
            toggleRouteBlock(data.role);   
            checkLoginStatus();                
        } 
        else 
        {
            alert(data.message);
        }
    } 
    catch (error) 
    {
        console.error('Error logging in:', error);
    }
}

async function registerUser(username, password, role) 
{
    try 
    {
        const response = await fetch('http://localhost:5000/register', 
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, role })
        });

        const data = await response.json();
        if (response.status === 201) 
        {
            alert(data.message);
        } else {
            alert(data.message);
        }
    } 
    catch (error) 
    {
        console.error('Error registering user:', error);
    }
}

document.getElementById('loginButton').addEventListener('click', () => {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    loginUser(username, password);
});

document.getElementById('registerButton').addEventListener('click', () => {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    if (username.trim() === '' || password.trim() === '' || password.length < 6) {
        alert('Please fill in all fields and ensure the password is at least 6 characters long.');
        return;
    }
    registerUser(username, password, role); 
});

function toggleRouteBlock(userRole) {
    const addRouteBlock = document.querySelector('.container.mt-5');
    const searchBlock = document.querySelector('#searchRegular');
    const sortBlock = document.querySelector('#sortRegular');

    if (userRole !== 'employee') 
    {
        addRouteBlock.style.display = 'none'; 
        searchBlock.style.display = 'block'; 
        sortBlock.style.display = 'block'; 
    } 
    else 
    {
        addRouteBlock.style.display = 'block'; 
        searchBlock.style.display = 'none'; 
        sortBlock.style.display = 'none'; 
    }
}

function searchTable() 
{
    let input, filter, table, tr, td, i, j, txtValue;
    input = document.getElementById("routeSearch");
    filter = input.value.toUpperCase();
    table = document.querySelector("table");
    tr = table.getElementsByTagName("tr");
    for (i = 1; i < tr.length; i++) 
    {
        let found = false;
        for (j = 0; j < 3; j++) 
        {
            td = tr[i].getElementsByTagName("td")[j];
            if (td) 
            {
                txtValue = td.textContent || td.innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) 
                {
                    found = true;
                    break;
                }
            }
        }
        if 
        (found) 
        {
            tr[i].style.display = "";
        }
        else 
        {
            tr[i].style.display = "none";
        }
    }
}  
let sortByTimeAscending = true;
let sortAlphabeticallyAscending = true;

function filterByTime() 
{
    const table = document.querySelector("table");
    const rows = table.querySelectorAll("tbody tr");

    const fragment = document.createDocumentFragment();
    const sortedRows = Array.from(rows).sort((rowA, rowB) => 
    {
        const timeA = rowA.cells[2].innerText.toLowerCase().trim();
        const timeB = rowB.cells[2].innerText.toLowerCase().trim();

        return sortByTimeAscending ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA);
    });

    sortedRows.forEach(row => 
    {
        fragment.appendChild(row);
    });

    table.querySelector("tbody").appendChild(fragment);

    sortByTimeAscending = !sortByTimeAscending;
}

function filterAlphabetically() 
{
    const table = document.querySelector("table");
    const rows = Array.from(table.getElementsByTagName("tr")).slice(1); 

    const fragment = document.createDocumentFragment();
    const sortedRows = rows.sort((rowA, rowB) => 
    {
        const textA = rowA.cells[0].innerText.toLowerCase().trim();
        const textB = rowB.cells[0].innerText.toLowerCase().trim();

        return sortAlphabeticallyAscending ? textA.localeCompare(textB) : textB.localeCompare(textA);
    });

    sortedRows.forEach(row => 
    {
        fragment.appendChild(row);
    });

    table.querySelector("tbody").appendChild(fragment);

    sortAlphabeticallyAscending = !sortAlphabeticallyAscending;
}             