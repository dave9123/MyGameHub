function checkCookie(name) {
    let cookieArr = document.cookie.split(";");
    for(let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].split("=");
        if(name == cookiePair[0].trim()) {
            return true;
        }
    }
    return false;
}

// Function to fetch user profile and replace the content
async function fetchUserProfileAndReplace() {
    if (checkCookie('token')) {
        try {
            const response = await fetch('/api/userprofile');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            } else if (response.ok) {
                const userProfile = await response.json();
                const userProfileElement = document.getElementById('userprofile');
                if (userProfileElement && userProfile.discordProfileLink) {
                    userProfileElement.src = userProfile.avatar;
                }
            }
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }
}

// Call the function to check the cookie and fetch the user profile
fetchUserProfileAndReplace();
