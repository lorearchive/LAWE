let lastScroll = 0;
const scrollWindow = document.getElementById('scrollableWindow')
const header = document.getElementById('lawe-header')
scrollWindow.addEventListener('scroll', () => {
    const currentScroll = scrollWindow.scrollTop;
    if (currentScroll <= 0) {
        header.classList.remove('header-hidden');
        return;
    }
    if (currentScroll > lastScroll) {
        header.classList.add('header-hidden');
    } else {
        header.classList.remove('header-hidden');
    } lastScroll = currentScroll})
