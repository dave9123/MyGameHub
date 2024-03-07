document.addEventListener('DOMContentLoaded', () => {
    window.search = async (event) => {
        event.preventDefault();
        const searchTerm = document.querySelector('.search-bar input').value;
        if (searchTerm.trim() === '') {
            return;
        }
        try {
            const response = await fetch(`/api/search?q=${searchTerm}`);
            const searchResults = await response.json();
            console.log(searchResults);
            //displaySearchResults(searchResults);
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    }
});