function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('visible');
}

function showContent(contentId) {
    const contents = document.querySelectorAll('.content');
    contents.forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById(contentId).style.display = 'block';
}

document.getElementById('menuToggleButton').addEventListener('click', function(event) {
    const sideMenu = document.getElementById('menu-icon');
    sideMenu.classList.toggle('hidden');
    event.stopPropagation(); // Ngăn chặn sự kiện lan truyền lên body
});

document.body.addEventListener('click', function() {
    const sideMenu = document.getElementById('menu-icon');
    if (!sideMenu.classList.contains('hidden')) {
        sideMenu.classList.add('hidden');
    }
});

// Ngăn chặn event cho sideMenu để không bị ảnh hưởng khi click nội dung trong menu
document.getElementById('menu-icon').addEventListener('click', function(event) {
    event.stopPropagation();
});

document.getElementById('menu-icon').addEventListener('click', function() {
    var menu = document.getElementById('menu');
    menu.classList.toggle('show');
});



//tuy bien
document.querySelectorAll('details').forEach((detail) => {
            detail.addEventListener('toggle', (event) => {
                const arrow = event.target.querySelector('.arrow');
                if (event.target.open) {
                    arrow.textContent = '▼';
                } else {
                    arrow.textContent = '▶';
                }
            });
        });