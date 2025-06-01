let lastScroll = 0;
const header = document.getElementById('lawe-header')
window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll <= 0) {
        header.classList.remove('header-hidden');
        return;
    }
    if (currentScroll > lastScroll) {
        header.classList.add('header-hidden');
    } else {
        header.classList.remove('header-hidden');
    } lastScroll = currentScroll})
