import requests
import json

f = open('debug/armorgames.json', 'r')
data = json.load(f)
for game in data:
    game_id = game['game_id']
    label = game['label']
    thumbnail = game['thumbnail']
    url = f"https://armorgames.com{game['url']}"
    if game['url'].startswith('/play'):
        pass