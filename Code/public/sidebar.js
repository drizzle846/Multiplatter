document.getElementById('toggleSidebarBtn').addEventListener('click', function() {

    var sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
});

//Closes sidebar
document.getElementById('closeSidebarBtn').addEventListener('click', function() {
    var sidebar = document.getElementById('sidebar');

    sidebar.classList.remove('open');
});