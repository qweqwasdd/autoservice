const smallScreen = window.matchMedia('(max-width: 730px)');
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
document.documentElement.classList.add('js');

function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  menu.textContent = 'Меню';
  navigation.classList.remove('is-open');
}

function syncMenu() {
  menu.hidden = !smallScreen.matches;
  closeMenu();
}

syncMenu();
smallScreen.addEventListener('change', syncMenu);
menu.addEventListener('click', () => {
  if (menu.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    return;
  }
  menu.setAttribute('aria-expanded', 'true');
  menu.textContent = 'Закрыть';
  navigation.classList.add('is-open');
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});

const photos = {
  all: ['maintenance.jpg', 'Автомобиль с открытым капотом в ремонтном цехе'],
  maintenance: ['reception.jpg', 'Стойка приёмки автомобилей в АвтоВэлт'],
  engine: ['engine.jpg', 'Двигатель автомобиля под открытым капотом'],
  chassis: ['chassis.jpg', 'Автомобиль на подъёмнике, вид из цеха'],
  bodywork: ['bodywork.jpg', 'Участок автомобильного кузова со следами коррозии']
};
const filters = document.querySelector('.filters');
const rows = [...document.querySelectorAll('.price-table tbody tr')];
const serviceImage = document.querySelector('#service-image');
const resultCount = document.querySelector('#result-count');
filters.hidden = false;
filters.addEventListener('click', event => {
  const button = event.target.closest('button[data-filter]');
  if (!button || button.getAttribute('aria-pressed') === 'true') return;
  const category = button.dataset.filter;
  for (const control of filters.querySelectorAll('button')) {
    control.setAttribute('aria-pressed', String(control === button));
  }
  for (const row of rows) {
    row.hidden = category !== 'all' && row.dataset.category !== category;
  }
  const [file, alt] = photos[category];
  serviceImage.src = 'assets/' + file;
  serviceImage.srcset = category === 'bodywork'
    ? ''
    : 'assets/' + file.replace('.jpg', '-640.jpg') + ' 640w, assets/' + file + ' 1200w';
  serviceImage.alt = alt;
  resultCount.textContent = 'Работ в списке: ' + rows.filter(row => !row.hidden).length;
});

const actionbar = document.querySelector('.actionbar');
const heroActions = document.querySelector('.hero-actions');
const visitActions = document.querySelector('.visit-info');
const visibleActions = new Map();
const actionObserver = new IntersectionObserver(entries => {
  for (const entry of entries) visibleActions.set(entry.target, entry.isIntersecting);
  const heroAbove = heroActions.getBoundingClientRect().bottom < 0;
  actionbar.classList.toggle('is-visible', heroAbove && !visibleActions.get(visitActions));
});
actionObserver.observe(heroActions);
actionObserver.observe(visitActions);

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const statement = document.querySelector('.mo-wh__text');
for (const parent of [statement, statement.querySelector('strong')]) {
  for (const child of [...parent.childNodes]) {
    if (child.nodeType !== Node.TEXT_NODE) continue;
    const fragment = document.createDocumentFragment();
    for (const token of child.textContent.split(/(\s+)/)) {
      if (!token.trim()) {
        fragment.append(token);
        continue;
      }
      const word = document.createElement('span');
      word.className = 'word';
      word.textContent = token;
      fragment.append(word);
    }
    child.replaceWith(fragment);
  }
}
const orderedWords = [...statement.querySelectorAll('.word')];
let frame = 0;
function paintStatement() {
  const rect = statement.getBoundingClientRect();
  const progress = (innerHeight * .87 - rect.top) / (innerHeight * .45 + rect.height);
  const count = Math.round(progress * orderedWords.length);
  orderedWords.forEach((word, index) => word.classList.toggle('is-on', motionPreference.matches || index < count));
  frame = 0;
}
function queueStatement() {
  if (!frame) frame = requestAnimationFrame(paintStatement);
}
addEventListener('scroll', queueStatement, { passive: true });
addEventListener('resize', queueStatement);
motionPreference.addEventListener('change', queueStatement);
paintStatement();
