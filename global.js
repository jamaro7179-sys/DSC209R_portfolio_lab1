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

document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
          Theme:
          <select>
              <option value="light dark">Automatic</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
          </select>
      </label>`,
);

let select = document.querySelector(".color-scheme select");

select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = event.target.value;
  });

if ("colorScheme" in localStorage) {
    document.documentElement.style.setProperty("color-scheme", localStorage.colorScheme);
    select.value = localStorage.colorScheme;
}


export async function fetchJSON(url) {
    try {
      const response = await fetch(url);

        // Fetch the JSON file from the given URL
  
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
    }
  }


// adding a For loop to iterate through the projects seems the most effective here
export function renderProjects(project, containerElement, headingLevel = 'h2') 
  {// Your code will go here
      containerElement.innerHTML = '';
      
      for (const p of project) {
      const article = document.createElement('article');
      
       // seems to be the best approach for this assignment, adding headingLevel
      article.innerHTML = `
          <${headingLevel}>${p.url ? `<a href="${BASE_PATH}${p.url}">${p.title}</a>` : p.title}</${headingLevel}> 
          <img src="${p.image}" alt="${p.title}">
          <p>${p.description}</p>
      `;
      containerElement.appendChild(article);
    }
  }

 export async function fetchGithubData(username) {
    // return statement here
    return fetchJSON(`https://api.github.com/users/${username}`);
 }    