// Глобальная переменная для базы данных
let gamesDatabase = {};

let currentPage = 1;      // Текущая страница
const itemsPerPage = 20;  // Количество игр на одной странице

// Запрещаем браузеру дергать скролл при обновлении страницы
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ==========================================
// ⚙️ ЗАГРУЗКА БАЗЫ И ЛОГИКА ИНТЕРФЕЙСА
// ==========================================
const gameModal = document.getElementById("gameModal");
const lightboxModal = document.getElementById("lightboxModal");
const closeGameBtn = document.getElementById("closeGameModal");
const mainGrid = document.getElementById('main-catalog-grid');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const searchSortContainer = document.getElementById('searchSortContainer');

// Глобальные стрелки прокрутки в описании
const scrollLeftBtn = document.getElementById('scrollLeftBtn');
const scrollRightBtn = document.getElementById('scrollRightBtn');

// Переменные для галереи
let currentGallery = [];
let currentGalleryIndex = 0;

// Загружаем JSON файл с базой игр
fetch('games.json?t=' + new Date().getTime())
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        gamesDatabase = data;
        updateCategoryBadges();
        renderFilteredGames('all'); // Рисуем каталог только после успешной загрузки базы
    })
    .catch(error => {
        console.error("Ошибка загрузки базы данных (возможно нужен локальный сервер):", error);
        mainGrid.innerHTML = '<p style="text-align:center; width: 100%;">Не удалось загрузить базу проектов. Если вы открыли файл напрямую, попробуйте использовать локальный сервер.</p>';
    });

// Функция для раскраски тегов в квадратных скобках
function colorizeTags(title) {
    return title.replace(/\[(.*?)\]/gi, (match, innerText) => {
        const lower = innerText.toLowerCase();
        let color = "#ef4444"; // По умолчанию красный (для версий, патчей и т.д.)
        
        if (lower === "18+") {
            color = "#ff43f2"; // Розовый
        } else if (lower === "нейросетевой перевод" || lower === "ai") {
            color = "#3b82f6"; // Синий
        } else if (lower === "kk") {
            color = "#f15f2c"; // Оранжевый (Boosty-цвет)
        }
        
        return `<span style="color: ${color}; font-weight: bold;">${match}</span>`;
    });
}

// --- НОВАЯ ФУНКЦИЯ ДЛЯ ПРОВЕРКИ НОВИНОК ---
function isGameNew(game) {
    const dateStr = game.id ? String(game.id) : "";
    if (dateStr.length === 8) {
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1; 
        const day = parseInt(dateStr.substring(6, 8));
        const gameDate = new Date(year, month, day);
        const now = new Date();
        const diffDays = (now - gameDate) / (1000 * 60 * 60 * 24);
        return (diffDays >= -1 && diffDays <= 14);
    }
    return false;
}

// --- НОВАЯ ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ ТОЧЕК НА КНОПКАХ ---
function updateCategoryBadges() {
    const filterMap = {
        'all': Object.keys(gamesDatabase).filter(k => k !== 'arts' && k !== 'games'),
        'paid': ['short', 'rep', 'mid', 'big'],
        'free': ['free', 'official'],
        'senran': ['senran'],
        'manga': ['manga'],
        'arts': ['arts'],
        'games': ['games']
    };

    document.querySelectorAll('.filter-btn').forEach(btn => {
        const filterKey = btn.getAttribute('data-filter');
        if (filterKey === 'sub') return; // Подписку пропускаем
        
        let hasNew = false;
        const keysToCheck = filterMap[filterKey] || [];
        
        for (const key of keysToCheck) {
            if (gamesDatabase[key] && gamesDatabase[key].some(isGameNew)) {
                hasNew = true;
                break;
            }
        }

        if (hasNew) {
            btn.classList.add('has-new');
        } else {
            btn.classList.remove('has-new');
        }
    });
}


function renderFilteredGames(filterKey, isInstant = false) {
    const isFirstLoad = mainGrid.innerHTML.trim() === '';
    
    if (!isFirstLoad && !isInstant) {
        mainGrid.classList.remove('visible-grid');
    }

    const delay = (isFirstLoad || isInstant) ? 0 : 300;

    setTimeout(() => {
        mainGrid.innerHTML = ''; 
        
        // Скрываем или показываем поиск для вкладки "Подписка"
        if (filterKey === 'sub') {
            searchSortContainer.classList.add('hidden');
            mainGrid.classList.add('sub-layout'); 

            const subTiers = [
                { price: "50₽", color: "#ffffff", desc: "Арты + <a href='https://boosty.to/syslickone/posts/9bb887a8-8e1d-4ad1-9cb6-2a76e14f606a?share=post_link' target='_blank' class='sub-link'>Предложка</a>", img: "sub/1.webp", link: "https://boosty.to/syslickone/purchase/2000875?ssource=DIRECT&share=subscription_link" },
                { price: "100₽", color: "#4ade80", desc: "Арты + <a href='https://boosty.to/syslickone/posts/9bb887a8-8e1d-4ad1-9cb6-2a76e14f606a?share=post_link' target='_blank' class='sub-link'>Предложка</a><br>Перевод простых игр", img: "sub/2.webp", link: "https://boosty.to/syslickone/purchase/3141942?ssource=DIRECT&share=subscription_link" },
                { price: "150₽", color: "#3b82f6", desc: "Арты + <a href='https://boosty.to/syslickone/posts/9bb887a8-8e1d-4ad1-9cb6-2a76e14f606a?share=post_link' target='_blank' class='sub-link'>Предложка</a><br>Перевод простых игр<br>Перевод реиграб. игр", img: "sub/3.webp", link: "https://boosty.to/syslickone/purchase/2033965?ssource=DIRECT&share=subscription_link" },
                { price: "325₽", color: "#a855f7", desc: "⚠️Скоро⚠️", img: "sub/4.webp", link: "https://boosty.to/syslickone/purchase/2000895?ssource=DIRECT&share=subscription_link" },
                { price: "500₽", color: "#fbbf24", desc: "⚠️Скоро⚠️", img: "sub/5.webp", link: "https://boosty.to/syslickone/purchase/2001006?ssource=DIRECT&share=subscription_link" }
            ]; 
            
            subTiers.forEach(tier => {
                const card = document.createElement('a');
                card.href = tier.link; card.target = "_blank"; card.className = 'game-card sub-card';
                card.style.border = `1px solid ${tier.color}`; card.style.boxShadow = `0 0 10px 1px ${tier.color}`;
                card.style.textDecoration = "none";
                card.innerHTML = `
                    <img src="${tier.img}" alt="${tier.price}" class="sub-img">
                    <h2 style="color: ${tier.color}; font-size: 2em; margin: 15px 0 10px 0;">${tier.price}</h2>
                    <hr style="border: none; border-top: 1px solid ${tier.color}; width: 80%; opacity: 0.6; margin-bottom: 15px;">
                    <div style="font-size: 0.95em; line-height: 1.6; text-align: center; color: #ddd; flex-grow: 1;">${tier.desc}</div>
                `;
                mainGrid.appendChild(card);
            });

            setTimeout(() => { mainGrid.classList.add('visible-grid'); }, 10); 
            document.getElementById('pagination-container').style.display = 'none'; // <--- Добавить это
            return; 
        } else {
            searchSortContainer.classList.remove('hidden');
            mainGrid.classList.remove('sub-layout');
        }

        // =====================================
        // ИКОНКИ ПЛАТФОРМ (WEBP)
        // =====================================
        const platformIcons = {
            "windows": '<img src="catalog/win.webp" alt="Win" class="plat-img">',
            "mac": '<img src="catalog/mac.webp" alt="Mac" class="plat-img">',
            "android": '<img src="catalog/andr.webp" alt="Android" class="plat-img">',
            "steam": '<img src="catalog/steam_icon.webp" alt="Steam" class="plat-img">',
            "itch": '<img src="catalog/itch.webp" alt="Itch" class="plat-img">',
            "ps": '<img src="catalog/ps.webp" alt="PS" class="plat-img">',
            "switch": '<img src="catalog/sw.webp" alt="Switch" class="plat-img">',
            "steamdeck": '<img src="catalog/sd.webp" alt="Deck" class="plat-img">'
        };

        let gamesToRender = [];

        const categoryNames = {
            "senran": "Senran Kagura", "manga": "Перевод манги", "arts": "Арт >>>", "free": "Перевод", "official": "Официальный перевод",
            "short": "Новичок+ (100₽) >>>", "rep": "Ренегат (150₽) >>>", "mid": "Элита (325₽) >>>", "big": "Кагура (500₽) >>>",
            "asmr": "ASMR", "games": "Игра"
        };

        const colorPalette = {
            "50": "#ffffff", "100": "#4ade80", "150": "#3b82f6", "325": "#a855f7", 
            "500": "#fbbf24", "1000": "#ef4444", "free": "#ffffff"
        };

        const defaultCategoryPrices = {
            "short": "100", "rep": "150", "mid": "325", "big": "500",
            "senran": "free", "free": "free", "manga": "free", "official": "free", "arts": "50", "asmr": "free", "games": "free"
        };

        const processGame = (game, key) => {
            game._originalKey = key;
            game._category = categoryNames[key] || "Проект";
            game._priceStr = game.price || defaultCategoryPrices[key] || "free";
            game._titleColor = colorPalette[game._priceStr] || colorPalette["free"];
            gamesToRender.push(game);
        };

        if (filterKey === 'all') {
    for (const key in gamesDatabase) { 
        if (key !== 'arts' && key !== 'games') { // Исключаем арты и оригинальные игры
            gamesDatabase[key].forEach(game => processGame(game, key)); 
        }
    }
} else if (filterKey === 'paid') {
            ["short", "rep", "mid", "big"].forEach(key => {
                if (gamesDatabase[key]) gamesDatabase[key].forEach(game => processGame(game, key));
            });
        } else if (filterKey === 'free') {
            ["free", "official"].forEach(key => { // Включаем official в Бесплатные
                if (gamesDatabase[key]) gamesDatabase[key].forEach(game => processGame(game, key));
            });
        } else {
            if (gamesDatabase[filterKey]) gamesDatabase[filterKey].forEach(game => processGame(game, filterKey));
        }

        // =====================================
        // УМНЫЙ ПОИСК
        // =====================================
        const searchQuery = searchInput.value.toLowerCase().trim();
        if (searchQuery) {
            gamesToRender = gamesToRender.filter(game => {
                // Ищем по оригинальному названию и по очищенному от [...]
                const cleanTitle = game.title.replace(/^\[.*?\]\s*/, '').toLowerCase();
                return game.title.toLowerCase().includes(searchQuery) || cleanTitle.includes(searchQuery);
            });
        }

        // =====================================
        // СОРТИРОВКА
        // =====================================
        const sortValue = sortSelect.value;
        gamesToRender.sort((a, b) => {
            // Вспомогательная функция для чистки имени (удаляет [18+] и подобное из начала)
            const getCleanName = (title) => title.replace(/^\[.*?\]\s*/, '').trim().toLowerCase();
            // Вспомогательная функция для превращения 'free', '150', '325' в числа
            const getPriceVal = (priceStr) => priceStr === "free" ? 0 : parseInt(priceStr, 10);

            switch(sortValue) {
                case 'date-desc': return (b.id || 0) - (a.id || 0);
                case 'date-asc':  return (a.id || 0) - (b.id || 0);
                case 'name-asc':  return getCleanName(a.title).localeCompare(getCleanName(b.title), 'ru');
                case 'name-desc': return getCleanName(b.title).localeCompare(getCleanName(a.title), 'ru');
                case 'price-desc': return getPriceVal(b._priceStr) - getPriceVal(a._priceStr);
                case 'price-asc':  return getPriceVal(a._priceStr) - getPriceVal(b._priceStr);
                default: return 0;
            }
        });

        // =====================================
        // ПАГИНАЦИЯ (РАСЧЕТЫ) И ОТРИСОВКА
        // =====================================
        const totalItems = gamesToRender.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        // Защита, если текущая страница стала больше возможной (например, после фильтра)
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }

        // Вырезаем только те игры, которые нужны для текущей страницы
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedGames = gamesToRender.slice(startIndex, endIndex);

        if (totalItems === 0) {
            mainGrid.innerHTML = '<p style="text-align:center; width: 100%; color: #888;">По вашему запросу ничего не найдено :с</p>';
            renderPagination(0);
        } else {
            // ВАЖНО: теперь мы перебираем paginatedGames, а не gamesToRender
            paginatedGames.forEach(game => {
                const card = document.createElement('div');
                // Автоматически вешаем базовый класс градиента и класс цены (например, tier-150 или tier-GOAT)
                card.className = `game-card animated-gradient-card tier-${game._priceStr}`;
                
                // Если проект бесплатный — вешаем класс с градиентом
                if (game._priceStr === "free") {
                    card.classList.add('free-gradient-card');
                } else {
                    // Для платных оставляем стандартный сплошной цвет
                    card.style.border = `1px solid ${game._titleColor}`;
                    card.style.boxShadow = `0 0 10px 1px ${game._titleColor}`;
                }
                
                // --- НОВАЯ ЛОГИКА: Определяем прямую ссылку заранее ---
                let directLink = null;
                let linkCount = 0;

                // Проверяем массив links
                if (game.links && game.links.length > 0) {
                    linkCount = game.links.length;
                    if (linkCount === 1) directLink = game.links[0].url;
                } 
                // Проверяем одиночный параметр link
                else if (game.link && game.link !== "#") {
                    linkCount = 1; 
                    directLink = game.link;
                }

                const fastTravelCategories = ["arts", "short", "rep", "mid", "big"];
                let categoryHTML = '';

                // Теперь категория станет кнопкой, если найдена единственная ссылка (directLink)
                if (fastTravelCategories.includes(game._originalKey) && directLink && directLink !== "#") {
                    categoryHTML = `<div class="card-overlay hover-category clickable-category" onclick="event.stopPropagation(); window.open('${directLink}', '_blank');">${game._category}</div>`;
                } else {
                    categoryHTML = `<div class="card-overlay hover-category">${game._category}</div>`;
                }
                // -------------------------------------------------------

                const dateStr = game.id ? String(game.id) : "";
                let formattedDate = "";
                let isNew = isGameNew(game); 

                if (dateStr.length === 8) {
                    formattedDate = `${dateStr.substring(6,8)}.${dateStr.substring(4,6)}.${dateStr.substring(0,4)}`;
                    const year = parseInt(dateStr.substring(0, 4));
                    const month = parseInt(dateStr.substring(4, 6)) - 1; 
                    const day = parseInt(dateStr.substring(6, 8));
                    const gameDate = new Date(year, month, day);
                    const now = new Date();
                    const diffDays = (now - gameDate) / (1000 * 60 * 60 * 24);
                    if (diffDays >= -1 && diffDays <= 14) isNew = true;
                }

                let platformsHTML = "";
                if (game.platforms && game.platforms.length > 0) {
                    platformsHTML = game.platforms.map(p => {
                        const icon = platformIcons[p.toLowerCase()];
                        return icon ? icon : `<span class="plat-text">${p}</span>`;
                    }).join('');
                }

                // Добавляем раскраску заголовка
                // Добавляем раскраску заголовка
               // Добавляем раскраску заголовка
                const coloredTitle = colorizeTags(game.title);

                // --- ЛОГИКА ИКОНКИ ПЕРЕХОДА ---
                const hasNoContent = !game.desc && !game.authors && !game.install && (!game.screenshots || game.screenshots.length === 0);
                const isDirectLink = hasNoContent && linkCount === 1 && directLink;
                
                // Показываем иконку ТОЛЬКО если это прямая ссылка И категория НЕ "arts"
                const showIcon = isDirectLink && game._originalKey !== "arts";
                
                // Используем красивую SVG-иконку вместо колхозных >>>
                const arrowsHTML = showIcon ? `
                    <div class="hover-arrows">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </div>` : '';

                card.innerHTML = `
                    ${isNew ? '<div class="new-badge">Новинка!</div>' : ''}
                    <div class="card-overlay hover-title" style="color: ${game._titleColor}">${coloredTitle}</div>
                    <img src="${game.img}" alt="${game.title}" onerror="this.onerror=null; this.src='catalog/error.webp'">
                    
                    <div class="card-center-info">
                        ${formattedDate ? `<div class="card-date">${formattedDate}</div>` : ''}
                        ${platformsHTML ? `<div class="card-platforms">${platformsHTML}</div>` : ''}
                    </div>

                    ${categoryHTML}
                    ${arrowsHTML}
                    <h3>${coloredTitle}</h3>
                `;

                // Логика открытия модалки или перехода по ссылке
                if (isDirectLink) {
                    card.onclick = function() { window.open(directLink, '_blank'); };
                } else {
                    card.onclick = function() { openGameInfo(game); };
                }
                
                mainGrid.appendChild(card);
            });
            
            renderPagination(totalPages); // Вызываем отрисовку кнопок страниц
        }

        setTimeout(() => {
            mainGrid.classList.add('visible-grid');
        }, 10); 
        
    }, delay);
}

// Обработчики кнопок фильтров (этот блок у вас уже есть, просто убедитесь, что он выглядит так)
filterButtons.forEach(button => {
    button.addEventListener('click', function() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        // При смене вкладки сбрасываем строку поиска, но оставляем выбранную сортировку
        searchInput.value = '';
        currentPage = 1;
        renderFilteredGames(this.getAttribute('data-filter'));
    });
});

// НОВЫЕ ОБРАБОТЧИКИ ДЛЯ ПОИСКА И СОРТИРОВКИ
searchInput.addEventListener('input', () => {
    currentPage = 1;
    const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
    renderFilteredGames(activeFilter, true); // true = без задержки анимации
});

sortSelect.addEventListener('change', () => {
    currentPage = 1;
    const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
    renderFilteredGames(activeFilter, true);
});

// Функция для плавной прокрутки к началу каталога при смене страницы
function scrollToCatalog() {
    const gridTop = document.getElementById('searchSortContainer').offsetTop;
    window.scrollTo({ top: gridTop - 20, behavior: 'smooth' });
}

// Генерация кнопок пагинации
function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return; 
    }
    
    paginationContainer.style.display = 'flex';

    // Кнопка "Назад"
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerText = '◄';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
            renderFilteredGames(activeFilter, true);
            scrollToCatalog(); 
        }
    };
    paginationContainer.appendChild(prevBtn);

    // Кнопки страниц (1, 2, 3...)
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.innerText = i;
        pageBtn.onclick = () => {
            currentPage = i;
            const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
            renderFilteredGames(activeFilter, true);
            scrollToCatalog();
        };
        paginationContainer.appendChild(pageBtn);
    }

    // Кнопка "Вперед"
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerText = '►';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
            renderFilteredGames(activeFilter, true);
            scrollToCatalog();
        }
    };
    paginationContainer.appendChild(nextBtn);
}

function openGameInfo(game) {
    document.getElementById("modalGameTitle").innerHTML = colorizeTags(game.title);
    const coverImg = document.getElementById("modalGameCover");
    coverImg.classList.add("img-loading"); // Вешаем заглушку
    coverImg.onload = function() {
        this.classList.remove("img-loading"); // Убираем заглушку, когда загрузилось
    };
    coverImg.src = game.img;
    document.getElementById("modalGameDesc").innerHTML = game.desc || "";

    const authorsBlock = document.getElementById("modalGameAuthorsBlock");
    if (game.authors) { 
        document.getElementById("modalGameAuthors").innerHTML = game.authors; 
        authorsBlock.style.display = "block"; 
        authorsBlock.classList.add("collapsed"); 
    } else { authorsBlock.style.display = "none"; }

    // Подготовка галереи (Обложка + Скриншоты)
    currentGallery = [game.img];
    if (game.screenshots && game.screenshots.length > 0) {
        currentGallery = currentGallery.concat(game.screenshots);
    }

    coverImg.onclick = () => openLightbox(0);

    const screensContainer = document.getElementById("modalGameScreenshots");
    screensContainer.innerHTML = '';

    // Скрытие/показ стрелок прокрутки описания
    if (game.screenshots && game.screenshots.length > 1) {
        scrollLeftBtn.style.display = "flex";
        scrollRightBtn.style.display = "flex";
    } else {
        scrollLeftBtn.style.display = "none";
        scrollRightBtn.style.display = "none";
    }

    if (game.screenshots && game.screenshots.length > 0) {
        game.screenshots.forEach((src, index) => {
            const img = document.createElement('img'); 
            
            img.classList.add("img-loading"); // Вешаем заглушку на каждый скриншот
            
            img.onload = function() {
                this.classList.remove("img-loading"); // Убираем, как только скачался
            };
            
            img.src = src; 
            img.loading = "lazy";
            img.style.cursor = "pointer";
            img.title = "Нажмите, чтобы увеличить";
            img.onclick = () => openLightbox(index + 1);
            img.onerror = function() { this.style.display='none'; }; 
            screensContainer.appendChild(img);
        });
    } else { 
        screensContainer.innerHTML = '<p style="color:#777; font-size:0.9em;">Скриншоты отсутствуют.</p>'; 
    }

    const installBlock = document.getElementById("modalGameInstallBlock");
    const installContent = document.getElementById("modalGameInstall");
    const linksContainer = document.getElementById("modalGameLinks");
    const versionsContainer = document.getElementById("modalGameVersions");

    const renderInstallAndLinks = (installText, linksData, directLink) => {
        if (installText) {
            installContent.innerHTML = installText;
            installBlock.style.display = "block";
            installBlock.classList.add("collapsed");
        } else {
            installBlock.style.display = "none";
        }

        linksContainer.innerHTML = '';
        if (linksData && linksData.length > 0) {
            linksData.forEach(link => {
                const a = document.createElement('a'); a.href = link.url; a.target = "_blank"; a.className = "game-link-btn";
                if (link.color) { a.style.background = link.color; }
                let iconHtml = ''; if (link.icon) { iconHtml = `<img src="${link.icon}" alt="" onerror="this.style.display='none'">`; }
                a.innerHTML = `${iconHtml} ${link.text}`; linksContainer.appendChild(a);
            });
        } else if (directLink && directLink !== "#") {
            const a = document.createElement('a'); a.href = directLink; a.target = "_blank"; a.className = "game-link-btn";
            a.innerText = "Перейти к посту"; linksContainer.appendChild(a);
        }
    };

    // Проверяем, есть ли у игры разные версии (ПК, Switch и т.д.)
    if (game.versions && game.versions.length > 0) {
        versionsContainer.style.display = "flex";
        versionsContainer.innerHTML = ''; // Очищаем контейнер

        game.versions.forEach((ver, index) => {
            const btn = document.createElement('button');
            btn.className = `version-btn ${index === 0 ? 'active' : ''}`;
            btn.innerText = ver.name;
            
            btn.onclick = () => {
                // Убираем подсветку со всех кнопок и подсвечиваем нажатую
                document.querySelectorAll('.version-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Перерисовываем инструкцию и ссылки под выбранную версию
                renderInstallAndLinks(ver.install, ver.links, ver.link);
            };
            versionsContainer.appendChild(btn);
        });

        // При открытии окна показываем данные первой версии по умолчанию
        renderInstallAndLinks(game.versions[0].install, game.versions[0].links, game.versions[0].link);
    } else {
        // Если версий нет — используем стандартное поведение
        versionsContainer.style.display = "none";
        renderInstallAndLinks(game.install, game.links, game.link);
    }

    screensContainer.scrollLeft = 0;
    gameModal.classList.add("show");
}

// ==========================================
// 🖼️ ЛОГИКА ГАЛЕРЕИ (LIGHTBOX)
// ==========================================
function openLightbox(index) {
    currentGalleryIndex = index;
    updateLightbox();
    lightboxModal.classList.add('show');
}

function updateLightbox() {
    const imgEl = document.getElementById('lightboxImg');
    imgEl.style.opacity = 0; 
    setTimeout(() => {
        imgEl.src = currentGallery[currentGalleryIndex];
        imgEl.style.opacity = 1;
    }, 150);
    document.getElementById('lightboxCounter').innerText = `${currentGalleryIndex + 1} / ${currentGallery.length}`;
    
    // Скрываем стрелки галереи, если картинка всего одна
    const navButtons = document.querySelectorAll('.lightbox-nav');
    if (currentGallery.length <= 1) {
        navButtons.forEach(btn => btn.style.display = 'none');
    } else {
        navButtons.forEach(btn => btn.style.display = 'flex');
    }
}

// Кнопки навигации галереи
function prevScreen(e) {
    if (e) e.stopPropagation();
    if (currentGallery.length <= 1) return;
    currentGalleryIndex = (currentGalleryIndex - 1 + currentGallery.length) % currentGallery.length;
    updateLightbox();
}

function nextScreen(e) {
    if (e) e.stopPropagation();
    if (currentGallery.length <= 1) return;
    currentGalleryIndex = (currentGalleryIndex + 1) % currentGallery.length;
    updateLightbox();
}

document.getElementById('lightboxPrev').onclick = prevScreen;
document.getElementById('lightboxNext').onclick = nextScreen;

function closeLightboxModal() {
    lightboxModal.classList.remove('show');
}

document.getElementById('closeLightbox').onclick = closeLightboxModal;

// Закрытие галереи по клику на свободное поле (фон)
lightboxModal.onclick = closeLightboxModal;


// Скролл скриншотов внутри описания (не галерея)
const screensContainerInsideModal = document.getElementById("modalGameScreenshots");
scrollLeftBtn.onclick = function() { screensContainerInsideModal.scrollBy({ left: -250, behavior: 'smooth' }); };
scrollRightBtn.onclick = function() { screensContainerInsideModal.scrollBy({ left: 250, behavior: 'smooth' }); };

// Обычные модалки (донаты, описание)
const donateModal = document.getElementById("donateModal");
const btnDonate = document.getElementById("donateBtn");
const closeDonateBtn = document.getElementById("closeDonateModal");

btnDonate.onclick = function() { donateModal.classList.add("show"); }
closeDonateBtn.onclick = function() { donateModal.classList.remove("show"); }
closeGameBtn.onclick = function() { gameModal.classList.remove("show"); }

// ==========================================
// 📋 СПИСОК БУСТЕРОВ (ЗАГРУЗКА ИЗ JSON)
// ==========================================
const boostersModal = document.getElementById("boostersModal");
const btnBoosters = document.getElementById("boostersBtn");
const closeBoostersBtn = document.getElementById("closeBoostersModal");

btnBoosters.onclick = function() {
    // Скачиваем актуальный JSON прямо в момент нажатия (с защитой от кэша)
    fetch('boosters.json?t=' + new Date().getTime())
        .then(response => {
            if (!response.ok) throw new Error('Ошибка сети');
            return response.json();
        })
        .then(boostersData => {
            const boostersListContainer = document.getElementById('boostersListContainer');
            if (boostersListContainer) {
                let html = '';
                boostersData.forEach(tierObj => {
                    let usersHtml = '<div style="text-align: center; color: #777; font-size: 0.9em; padding: 10px 0;">Пока никого нет :(</div>';
                    
                    if (tierObj.users && tierObj.users.length > 0) {
                        usersHtml = tierObj.users.map(u => `
                            <div class="booster-item ${u.isNsfw ? 'booster-nsfw' : 'booster-safe'}">
                                <span>${u.name}</span>
                                <span class="${u.isNsfw ? 'nsfw-tag' : 'safe-tag'}">${u.isNsfw ? '18+' : 'Safe'}</span>
                            </div>
                        `).join('');
                    }

                    html += `
                        <div class="tier-section">
                            <div class="tier-title">${tierObj.tier}</div>
                            ${usersHtml}
                        </div>
                    `;
                });
                boostersListContainer.innerHTML = html;
            }
            boostersModal.classList.add("show");
        })
        .catch(error => {
            console.error("Ошибка загрузки бустеров:", error);
            const boostersListContainer = document.getElementById('boostersListContainer');
            if (boostersListContainer) {
                boostersListContainer.innerHTML = '<p style="text-align:center; color:#ef4444; padding: 20px;">Не удалось загрузить список. Попробуйте позже.</p>';
            }
            boostersModal.classList.add("show");
        });
}

closeBoostersBtn.onclick = function() { boostersModal.classList.remove("show"); }

// Обновляем общее закрытие по фону (ищем window.onclick = function(event) { ... })
// Замени свой существующий window.onclick на этот:
window.onclick = function(event) {
    if (event.target == donateModal) { donateModal.classList.remove("show"); }
    if (event.target == gameModal) { gameModal.classList.remove("show"); }
    if (event.target == boostersModal) { boostersModal.classList.remove("show"); }
}

// Обновляем закрытие по Escape (ищем event.key === 'Escape')
// Добавь туда закрытие boostersModal:
document.addEventListener('keydown', function(event) {
    if (lightboxModal.classList.contains('show')) {
        if (event.key === 'ArrowLeft' || event.key === 'Left') prevScreen();
        else if (event.key === 'ArrowRight' || event.key === 'Right') nextScreen();
        else if (event.key === 'Escape' || event.key === 'Esc') closeLightboxModal();
    }
    else if (event.key === 'Escape' || event.key === 'Esc') {
        donateModal.classList.remove("show");
        gameModal.classList.remove("show");
        boostersModal.classList.remove("show"); // <--- ДОБАВЛЕНО
    }
});

// Общее закрытие по фону
window.onclick = function(event) {
    if (event.target == donateModal) { donateModal.classList.remove("show"); }
    if (event.target == gameModal) { gameModal.classList.remove("show"); }
}

// Обработка клавиатуры
document.addEventListener('keydown', function(event) {
    if (lightboxModal.classList.contains('show')) {
        if (event.key === 'ArrowLeft' || event.key === 'Left') {
            prevScreen();
        } else if (event.key === 'ArrowRight' || event.key === 'Right') {
            nextScreen();
        } else if (event.key === 'Escape' || event.key === 'Esc') {
            closeLightboxModal();
        }
    }
    else if (event.key === 'Escape' || event.key === 'Esc') {
        donateModal.classList.remove("show");
        gameModal.classList.remove("show");
    }
});

// Кнопка наверх
const topBtn = document.getElementById("scrollToTopBtn");
window.onscroll = function() {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) { topBtn.classList.add("show"); } else { topBtn.classList.remove("show"); }
};
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ==========================================
// 👆 СВАЙПЫ ДЛЯ МОБИЛЬНЫХ УСТРОЙСТВ (ГАЛЕРЕЯ)
// ==========================================
let touchStartX = 0;
let touchEndX = 0;

const lightboxEl = document.getElementById('lightboxModal');

lightboxEl.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

lightboxEl.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const minSwipeDistance = 50; // Минимальная длина свайпа в пикселях
    
    // Если окно галереи закрыто — ничего не делаем
    if (!lightboxEl.classList.contains('show')) return;

    if (touchEndX < touchStartX - minSwipeDistance) {
        // Свайп влево
        nextScreen();
    }
    if (touchEndX > touchStartX + minSwipeDistance) {
        // Свайп вправо
        prevScreen();
    }
}