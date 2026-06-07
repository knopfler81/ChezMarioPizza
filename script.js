/* ============================================
   CHEZ MARIO PIZZERIA — script.js
   ============================================ */

/* ---- Config Google Sheets ---- */
const SHEET_ID  = '1wrYjRDiVM8_17xfu-3p689GiqXNjzl7Zhhal4Mkisg8';
const SHEET_GID = '0';
const CSV_URL   = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

/* Ordre d'affichage des catégories */
const ORDRE_CATEGORIES = [
  'Les Indémodables',
  'Les Gourmandes',
  'Les Sublimes',
  "L'Exceptionnel",
  'Menu Bambino',
];

/* ============================================
   CHARGEMENT DU MENU DEPUIS GOOGLE SHEETS
   ============================================ */

async function chargerMenu() {
  const grid = document.getElementById('pizza-grid');
  if (!grid) return;

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error('Fetch échoué');

    const texte  = await response.text();
    const pizzas = parseCSV(texte);

    if (pizzas.length === 0) {
      grid.innerHTML = '<p class="menu-error">La carte est momentanément indisponible.</p>';
      return;
    }

    /* Grouper par catégorie */
    const groupes = {};
    pizzas.forEach(p => {
      const cat = p.categorie || 'Autres';
      if (!groupes[cat]) groupes[cat] = [];
      groupes[cat].push(p);
    });

    /* Trier les catégories selon l'ordre défini */
    const catsTriees = [
      ...ORDRE_CATEGORIES.filter(c => groupes[c]),
      ...Object.keys(groupes).filter(c => !ORDRE_CATEGORIES.includes(c)),
    ];

    grid.innerHTML = '';

    catsTriees.forEach((cat, ci) => {
      /* Titre de catégorie */
      const titre = document.createElement('div');
      titre.className = 'menu-categorie reveal';
      titre.style.transitionDelay = `${ci * 0.08}s`;
      titre.innerHTML = `
        <h3 class="categorie-titre">${escapeHTML(cat)}</h3>
        <div class="categorie-prix">${escapeHTML(getPrix(groupes[cat][0].prix))}</div>
      `;
      grid.appendChild(titre);

      /* Grille des pizzas de cette catégorie */
      const sousGrille = document.createElement('div');
      sousGrille.className = 'sous-grille';
      grid.appendChild(sousGrille);

      groupes[cat].forEach((pizza, pi) => {
        const carte = document.createElement('div');
        carte.className = 'pizza-card reveal';
        carte.style.transitionDelay = `${(ci * 0.08) + (pi * 0.05)}s`;

        carte.innerHTML = `
          <div class="pizza-info">
            <div class="pizza-name">${escapeHTML(pizza.nom)}</div>
            <div class="pizza-ingredients">${escapeHTML(pizza.ingredients)}</div>
          </div>
        `;
        sousGrille.appendChild(carte);
      });
    });

    observerReveal();

  } catch (err) {
    console.error('Erreur chargement menu :', err);
    document.getElementById('pizza-grid').innerHTML =
      '<p class="menu-error">Carte indisponible — appelez-nous au 06 22 89 73 99</p>';
  }
}

/* Prix affiché en entête de catégorie */
function getPrix(raw) {
  if (!raw) return '';
  const n = parseFloat(String(raw).replace(',', '.'));
  if (isNaN(n)) return raw;
  return Number.isInteger(n) ? `${n} €` : `${n.toFixed(2).replace('.', ',')} €`;
}

/* ---- Parser CSV ---- */
function parseCSV(texte) {
  const lignes = texte.trim().split('\n');
  const pizzas = [];

  const debut = lignes[0].toLowerCase().includes('nom') ||
                lignes[0].toLowerCase().includes('categ') ? 1 : 0;

  for (let i = debut; i < lignes.length; i++) {
    const cols      = splitCSVLine(lignes[i]);
    const categorie = (cols[0] || '').trim();
    const nom       = (cols[1] || '').trim();
    const ingredients = (cols[2] || '').trim();
    const prix      = (cols[3] || '').trim();

    if (!nom) continue;
    pizzas.push({ categorie, nom, ingredients, prix });
  }
  return pizzas;
}

function splitCSVLine(ligne) {
  const cols = [];
  let courant = '';
  let dansGuillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (c === '"') { dansGuillemets = !dansGuillemets; }
    else if (c === ',' && !dansGuillemets) { cols.push(courant); courant = ''; }
    else { courant += c; }
  }
  cols.push(courant);
  return cols;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ============================================
   SCROLL REVEAL
   ============================================ */

let revealObserver = null;

function observerReveal() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
  }
  document.querySelectorAll('.reveal:not(.visible)')
    .forEach(el => revealObserver.observe(el));
}

/* ============================================
   INIT
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  chargerMenu();
  observerReveal();

  /* Hamburger */
  const hamburger = document.querySelector('.hamburger');
  const navUl     = document.querySelector('nav ul');
  if (hamburger && navUl) {
    hamburger.addEventListener('click', () => {
      navUl.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', navUl.classList.contains('open'));
    });
    navUl.querySelectorAll('a').forEach(l => l.addEventListener('click', () => navUl.classList.remove('open')));
  }

  /* Nav scroll */
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.style.background = window.scrollY > 60
      ? 'rgba(26,16,8,0.99)' : 'rgba(26,16,8,0.96)';
  });

  /* Lien actif */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav ul li a');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 100) current = s.id; });
    navLinks.forEach(l => {
      l.style.color = l.getAttribute('href') === `#${current}` ? 'var(--rouge-clair)' : '';
    });
  });

  /* Année */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});