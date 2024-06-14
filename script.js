const ibgeUrl = `https://servicodados.ibge.gov.br/api/v3/noticias/`;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(location.search);
    setDefaultQueryString(params);
    filterCount(params);
    queryNews();
});

function setDefaultQueryString(params) {
    if (!params.has('quantidade')) params.set('quantidade', 10);
    if (!params.has('page')) params.set('page', 1);
    
    history.replaceState({}, "", `${location.pathname}?${params}`);
}

function filterCount(params) {
    let count = params.size;

    for (const key of params.keys()) {
        if (key === 'page' || key === 'busca') count--;
    }

    const filterC = document.querySelector('#filter-count');
    filterC.textContent = count;
}

function openFilter() {
    document.querySelector('#modal').style.display = 'block';
}

function closeFilter() {
    document.querySelector('#modal').style.display = 'none';
}

function setQtdPicklist(count, params) {
    const qtdPage = document.querySelector('#quantidade');
    let qtd = params.get('quantidade');
    if (qtd > count || qtd == null) qtd = 10;

    qtdPage.innerHTML = `<option value="10" selected>10</option>`;

    for (let x = 15; x <= count; x += 5) {
        const opt = new Option(x, x);
        qtdPage.appendChild(opt);
    }
    document.querySelector(`option[value="${qtd}"]`).setAttribute('selected', 'selected');
}

function formatEditorias(editorias) {
    return editorias.split(";").map(e => `#${e}`).join(" ");
}

function formatImage(image) {
    if (!image) {
        return `https://scontent.fmgf11-1.fna.fbcdn.net/v/t1.6435-9/118691556_3864387280254759_4789927562788712716_n.png?_nc_cat=102&ccb=1-7&_nc_sid=5f2048&_nc_ohc=RXwdqd2-KDAQ7kNvgFc1bgu&_nc_ht=scontent.fmgf11-1.fna&oh=00_AYCtWZoTIvPmqjt39aJmk4-XSxtxTuUXDZOz7JY4t94SJw&oe=66729D6B`;
    }

    const imageObj = JSON.parse(image);
    return `https://agenciadenoticias.ibge.gov.br/${imageObj.image_intro}`;
}

function formatDate(dataHora) {
    const time = 86400000;

    const [d, m, a] = dataHora.slice(0, 10).split("/");
    const date = new Date(`${a}-${m}-${d}T00:00:00-03:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysAgo = Math.floor((today - date) / time);

    if (daysAgo === 0) {
        return `Publicado hoje`;
    } else if (daysAgo === 1) {
        return `Publicado ontem`;
    } else {
        return `Publicado há ${daysAgo} dias`;
    }
}

function formSubmit(e) {
    e.preventDefault();

    const input = document.querySelector("#search");
    const searchValue = input.value.trim();
    if (!searchValue) return;

    const params = new URLSearchParams(location.search);
    params.set('busca', searchValue);

    history.replaceState({}, "", `${location.pathname}?${params}`);

    queryNews();
}

async function queryNews() {
    const params = new URLSearchParams(location.search);
    const urlParams = `${ibgeUrl}?${params}`;

    try {
        const response = await fetch(urlParams);
        const content = await response.json();

        setQtdPicklist(content.count, params);
        fillContent(content);
        setPaginationButtons(content);
        paginationStyle(params.get('page'));
    } catch (error) {
        console.error("Erro ao obter as notícias", error);
    }
}

function applyFilters(e) {
    e.preventDefault();

    const params = new URLSearchParams(location.search);
    params.set('page', 1);

    const filters = ['tipo', 'quantidade', 'de', 'ate'];

    filters.forEach((filter) => {
        const filterComponent = document.querySelector(`#${filter}`);
        const filterValue = filterComponent.value;

        if (filterValue !== "") {
            params.set(filter, filterValue);
        } else {
            params.delete(filter);
        }
    });
    history.replaceState({}, "", `${location.pathname}?${params}`);
    filterCount(params);
    closeFilter();
    queryNews();
}

function fillContent(content) {
    const ul = document.querySelector('#content');
    ul.innerHTML = "";

    content.items.forEach(c => {
        const li = document.createElement('li');

        try {
            const imgSrc = formatImage(c.imagens);
            const editorias = formatEditorias(c.editorias);
            const publishedDate = formatDate(c.data_publicacao);

            li.innerHTML = `
                <img src="${imgSrc}" alt="${c.titulo}">
                <div class="content-text">
                    <h2>${c.titulo}</h2>
                    <p>${c.introducao}</p>
                    <div class="content-spans">
                        <span>${editorias}</span>
                        <span>${publishedDate}</span>
                    </div>
                    <a href="${c.link}" target="_blank"><button class="read-more">Leia mais</button></a>
                </div>
            `;
        } catch (e) {
            console.error('Erro ao preencher conteúdo:', e);
        }

        ul.appendChild(li);
    });
}

function setPaginationButtons(content) {
    const ul = document.querySelector('#pagination');
    ul.innerHTML = "";

    const actual = parseInt(content.page);
    const total = parseInt(content.totalPages);
    const leftSize = 5;
    const rightSize = 4;

    let start = actual - leftSize;
    let end = actual + rightSize;

    if (start <= 0) {
        end -= start - 1;
        start = 1;
    }

    if (end > total) {
        start = Math.max(start - (end - total), 1);
        end = total;
    }

    for (let i = start; i <= end; i++) {
        const li = document.createElement('li');
        const button = document.createElement('button');

        button.textContent = i;
        button.value = i;
        button.classList.add('pagination-button');

        if (i === actual) {
            button.classList.add('active');
        }

        button.addEventListener('click', setPage);

        li.appendChild(button);
        ul.appendChild(li);
    }
}

function setPage(e) {
    const value = e.target.textContent;

    const params = new URLSearchParams(location.search);
    params.set('page', value);

    history.replaceState({}, "", `${location.pathname}?${params}`);
    queryNews();
}

function paginationStyle(pageNumber) {
    const buttons = document.querySelectorAll('.pagination-button');
    buttons.forEach(button => button.classList.remove('pagination-selected'));

    const selectedButton = document.querySelector(`button[value="${pageNumber}"]`);
    if (selectedButton) {
        selectedButton.classList.add('pagination-selected');
    }
}
