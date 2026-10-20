console.log('IT’S ALIVE!');


function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let navLinks = $$("nav a");

let currentLink = navLinks.find(
    (a) => a.host === location.host && a.pathname === location.pathname,
);

if (currentLink) {
   // or if (currentLink !== undefined)
   currentLink.classList.add('current');  
}

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'Resume' },
    { url: 'https://github.com/jamaro7179-sys', title: 'GitHub' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);

const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '/' // Local server
    : '/DSC209R_portfolio_lab1/'; // GitHub Pages repo name


for (let p of pages) {
    let url = p.url;
    let title = p.title;

    url = !url.startsWith('http') ? BASE_PATH + url : url;
    
    // next step: create link and add it to nav
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.appendChild(a);

if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
}

a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname,
);
}

