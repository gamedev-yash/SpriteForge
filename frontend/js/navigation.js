// Add to your index.js or create a new navigation.js
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show selected page
            const targetPage = item.dataset.page;
            pages.forEach(page => {
                page.classList.toggle('hidden', page.id !== `${targetPage}Page`);
            });
        });
    });
});