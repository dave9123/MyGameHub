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
    if (checkCookie('token')) { // Replace 'token' with the actual name of your cookie
        try {
            const response = await fetch('/api/userprofile');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const userProfile = await response.json();
            // Assuming the userProfile object has a property 'discordProfileLink'
            const userProfileElement = document.getElementById('userprofile');
            if (userProfileElement && userProfile.discordProfileLink) {
                userProfileElement.href = userProfile.discordProfileLink;
                userProfileElement.textContent = userProfile.discordProfileLink; // Or any other content you want to display
            }
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }
}

// Call the function to check the cookie and fetch the user profile
fetchUserProfileAndReplace();
