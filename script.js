// Глобальная переменная для базы данных
let gamesDatabase = {};

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
fetch('games.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        gamesDatabase = data;
        renderFilteredGames('all'); // Рисуем каталог только после успешной загрузки базы
    })
    .catch(error => {
        console.error("Ошибка загрузки базы данных (возможно нужен локальный сервер):", error);
        mainGrid.innerHTML = '<p style="text-align:center; width: 100%;">Не удалось загрузить базу проектов. Если вы открыли файл напрямую, попробуйте использовать локальный сервер.</p>';
    });


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
                { price: "50₽", color: "#ffffff", desc: "Арты", img: "sub/1.webp", link: "https://boosty.to/syslickone/purchase/2000875?ssource=DIRECT&share=subscription_link" },
                { price: "100₽", color: "#4ade80", desc: "Арты<br>Перевод простых игр", img: "sub/2.webp", link: "https://boosty.to/syslickone/purchase/3141942?ssource=DIRECT&share=subscription_link" },
                { price: "150₽", color: "#3b82f6", desc: "Арты<br>Перевод простых игр<br>Перевод реиграб. игр", img: "sub/3.webp", link: "https://boosty.to/syslickone/purchase/2033965?ssource=DIRECT&share=subscription_link" },
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
            "senran": "Senran Kagura", "manga": "Перевод манги", "arts": "Арт >>>", "free": "Перевод",
            "short": "Новичок+ (100₽) >>>", "rep": "Ренегат (150₽) >>>", "mid": "Элита (325₽) >>>", "big": "Кагура (500₽) >>>",
            "asmr": "ASMR", "games": "Игра"
        };

        const colorPalette = {
            "50": "#ffffff", "100": "#4ade80", "150": "#3b82f6", "325": "#a855f7", 
            "500": "#fbbf24", "1000": "#ef4444", "free": "#ffffff"
        };

        const defaultCategoryPrices = {
            "short": "50", "rep": "100", "mid": "150", "big": "325",
            "senran": "free", "free": "free", "manga": "free", "arts": "free", "asmr": "free", "games": "free"
        };

        const processGame = (game, key) => {
            game._originalKey = key;
            game._category = categoryNames[key] || "Проект";
            game._priceStr = game.price || defaultCategoryPrices[key] || "free";
            game._titleColor = colorPalette[game._priceStr] || colorPalette["free"];
            gamesToRender.push(game);
        };

        if (filterKey === 'all') {
            for (const key in gamesDatabase) { gamesDatabase[key].forEach(game => processGame(game, key)); }
        } else if (filterKey === 'paid') {
            ["short", "rep", "mid", "big"].forEach(key => {
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
        // ОТРИСОВКА КАРТОЧЕК
        // =====================================
        if (gamesToRender.length === 0) {
            mainGrid.innerHTML = '<p style="text-align:center; width: 100%; color: #888;">По вашему запросу ничего не найдено :(</p>';
        }

        gamesToRender.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.style.border = `1px solid ${game._titleColor}`;
            card.style.boxShadow = `0 0 10px 1px ${game._titleColor}`;
            
            const fastTravelCategories = ["arts", "short", "rep", "mid", "big"];
            let categoryHTML = '';

            if (fastTravelCategories.includes(game._originalKey) && game.link && game.link !== "#") {
                categoryHTML = `<div class="card-overlay hover-category clickable-category" onclick="event.stopPropagation(); window.open('${game.link}', '_blank');">${game._category}</div>`;
            } else {
                categoryHTML = `<div class="card-overlay hover-category">${game._category}</div>`;
            }

            // --- ДОБАВЛЕНО: Обработка даты и платформ ---
            const dateStr = game.id ? String(game.id) : "";
            let formattedDate = "";
            if (dateStr.length === 8) {
                // Перевод YYYYMMDD в DD.MM.YYYY
                formattedDate = `${dateStr.substring(6,8)}.${dateStr.substring(4,6)}.${dateStr.substring(0,4)}`;
            }

            let platformsHTML = "";
            if (game.platforms && game.platforms.length > 0) {
                platformsHTML = game.platforms.map(p => {
                    const icon = platformIcons[p.toLowerCase()];
                    return icon ? icon : `<span class="plat-text">${p}</span>`;
                }).join('');
            }

            // --- ОБНОВЛЕНО: Добавлен блок card-center-info ---
            card.innerHTML = `
                <div class="card-overlay hover-title" style="color: ${game._titleColor}">${game.title}</div>
                <img src="${game.img}" alt="${game.title}" onerror="this.onerror=null; this.src='catalog/error.webp'">
                
                <div class="card-center-info">
                    ${formattedDate ? `<div class="card-date">${formattedDate}</div>` : ''}
                    ${platformsHTML ? `<div class="card-platforms">${platformsHTML}</div>` : ''}
                </div>

                ${categoryHTML}
                <h3>${game.title}</h3>
            `;
            
            let directLink = null;
            let linkCount = 0;
            if (game.links && game.links.length > 0) {
                linkCount = game.links.length;
                if (linkCount === 1) directLink = game.links[0].url;
            } else if (game.link && game.link !== "#") {
                linkCount = 1; directLink = game.link;
            }

            const hasNoContent = !game.desc && !game.authors && !game.install && (!game.screenshots || game.screenshots.length === 0);

            if (hasNoContent && linkCount === 1 && directLink) {
                card.onclick = function() { window.open(directLink, '_blank'); };
            } else {
                card.onclick = function() { openGameInfo(game); };
            }
            mainGrid.appendChild(card);
        });

        setTimeout(() => {
            mainGrid.classList.add('visible-grid');
        }, 10); 
        
    }, delay);
}

filterButtons.forEach(button => {
    button.addEventListener('click', function() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        renderFilteredGames(this.getAttribute('data-filter'));
    });
});

// Обработчики кнопок фильтров (этот блок у вас уже есть, просто убедитесь, что он выглядит так)
filterButtons.forEach(button => {
    button.addEventListener('click', function() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        // При смене вкладки сбрасываем строку поиска, но оставляем выбранную сортировку
        searchInput.value = '';
        renderFilteredGames(this.getAttribute('data-filter'));
    });
});

// НОВЫЕ ОБРАБОТЧИКИ ДЛЯ ПОИСКА И СОРТИРОВКИ
searchInput.addEventListener('input', () => {
    const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
    renderFilteredGames(activeFilter, true); // true = без задержки анимации
});

sortSelect.addEventListener('change', () => {
    const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
    renderFilteredGames(activeFilter, true);
});

function openGameInfo(game) {
    document.getElementById("modalGameTitle").innerText = game.title;
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

    const installBlock = document.getElementById("modalGameInstallBlock");
    if (game.install) { 
        document.getElementById("modalGameInstall").innerHTML = game.install; 
        installBlock.style.display = "block"; 
        installBlock.classList.add("collapsed"); 
    } else { installBlock.style.display = "none"; }

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
    
    const linksContainer = document.getElementById("modalGameLinks");
    linksContainer.innerHTML = ''; 
    if (game.links && game.links.length > 0) {
        game.links.forEach(link => {
            const a = document.createElement('a'); a.href = link.url; a.target = "_blank"; a.className = "game-link-btn";
            if (link.color) { a.style.background = link.color; }
            let iconHtml = ''; if (link.icon) { iconHtml = `<img src="${link.icon}" alt="" onerror="this.style.display='none'">`; }
            a.innerHTML = `${iconHtml} ${link.text}`; linksContainer.appendChild(a);
        });
    } else {
        const a = document.createElement('a'); a.href = game.link || "#"; a.target = "_blank"; a.className = "game-link-btn";
        a.innerText = "Перейти к посту"; linksContainer.appendChild(a);
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