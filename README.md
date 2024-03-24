# My Game Hub
Flash games player
# API Reference 
### [/api/search] Searching
Example: `http://localhost/api/search?q=game`<br/>
Accepts: GET request and `q` request query
### [/api/getgame] Get Game Information
Example: `http://localhost/api/getgame?provider=armorgames&id=186`<br/>
Accepts: GET request, `provider` and `id` request query
### [/api/userprofile]
Example: `http://localhost/api/userprofile`<br/>
Accepts GET request and `token` cookie<br/>
Example output:<br/>
```json
{"userid": 781708312466554940, "username":"dave9123","avatar":"https://cdn.discordapp.com/avatars/781708312466554940/9094894eb05f1df2535812ce63583133.png"}
```
# Supported Sites
- Flashpoint
- Armor Games
# Credits
Thanks Michael for making the logo<s><i>, sorry for backpain</i></s><br/>
Thanks G9 Aerospace for styling game result image