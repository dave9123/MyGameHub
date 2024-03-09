document.addEventListener('DOMContentLoaded', () => {
    window.searchGames = async (event) => {
        event.preventDefault();

        const searchTerm = document.querySelector('.search-bar input').value;
        if (searchTerm.trim() === '') {
            return;
        }
        try {
            const response = await fetch(`/api/search?q=${searchTerm}`);
            const searchResults = await response.json();
            console.log(searchResults);
            displaySearchResults(searchResults);
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    };
    const displaySearchResults = (results) => {
        const searchResultsSection = document.getElementById('searchresults');
        var resultsArray = Object.values(results);
        searchResultsSection.innerHTML = '';
        if (resultsArray.length > 0) {
            resultsArray.forEach(result => {
                const gameElement = document.createElement('div');
                gameElement.classList.add('search-result');
                if (result.provider === "Flashpoint") {
                    gameElement.innerHTML = `
                        <h3>${result.title}</h3>
                        <p>Provider: Flashpoint</p>
                        <button><a onclick="playFlashpoint('${result.id}', '${result.title}')" target="_blank">Play Game</a></button>
                        <img loading="lazy" src="${result.cover}" alt="${result.title} Cover">
                    `;
                    searchResultsSection.appendChild(gameElement);
                    return;
                } else if (result.provider === "Armor Games") {
                    gameElement.innerHTML = `
                    <h3>${result.title}</h3>
                    <p>Provider: Armor Games</p>
                    <img loading="lazy" src="${result.cover}" alt="${result.title} Cover">
                    <button><a onclick="playArmor('${result.id}', '${result.gameUrl}')" target="_blank">Play Game</a></button>
                `;
                }
                searchResultsSection.appendChild(gameElement);
            });
        } else {
            searchResultsSection.innerHTML = '<p>No results found.</p>';
        }
    };
});
async function playFlashpoint(id, gameName) {
    //if (localStorage.getItem('userId') != null) {
    //    fetch(`play?userId=${localStorage.getItem('userId')}&gameName=${gameName}`);
    //};
    const get = `api/getgame?id=${id}&provider=flashpoint`;
    f = fetch(get)
        .then(async response => {
            if (response.status == 404) {
                alert('Game not found. Please report this to the developer.');
            } else {
                gamePath = await response.json();
                localStorage.setItem('gamePath', gamePath);
                window.location.href = 'flash';
            }
        });
};
async function playArmor(id, url) {
    //if (localStorage.getItem('userId') != null) {
    //    fetch(`play?userId=${localStorage.getItem('userId')}&gameName=${gameName}`);
    //};
    const get = `api/getgame?id=${id}&url=${url}&provider=armorgames`;
    f = await fetch(get)
        .then(async response => {
            if (response.status === 404) {
                alert('Game not found. Please report this to the developer.');
            } else if (response.status === 200) {
                response = await response.json();
                localStorage.setItem('gamePath', response.gameFile);
                window.location.href = 'flash';
            }
        });
}