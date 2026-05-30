import json
import urllib.request
import os

icons_dir = '/Users/albertolicea00/Develop/my_portfolio/assets/icons/tech'
simple_icons_json = '/Users/albertolicea00/Develop/my_portfolio/tmp_icons/node_modules/simple-icons/data/simple-icons.json'

targets = {
    'alpine': 'alpine.js',
    'cordova': 'apache cordova',
    'coreldraw': 'coreldraw',
    'express': 'express',
    'krita': 'krita',
    'livewire': 'livewire',
    'procreate': 'procreate',
    'pygame': 'pygame',
    'renpy': 'ren\'py',
    'autograph': 'autograph'
}

with open(simple_icons_json, 'r') as f:
    data = json.load(f)

icon_map = {}
for icon in data:
    title_lower = icon['title'].lower()
    icon_map[title_lower] = icon
    
for target_file, search_term in targets.items():
    icon_info = icon_map.get(search_term)
    if icon_info:
        slug = icon_info.get('slug')
        if not slug:
            slug = search_term.replace(' ', '').replace('.','')
        hex_color = icon_info['hex']
        url = f"https://cdn.simpleicons.org/{slug}/{hex_color}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            svg_data = urllib.request.urlopen(req).read().decode('utf-8')
            with open(f"{icons_dir}/{target_file}.svg", "w") as out_f:
                out_f.write(svg_data)
            print(f"Downloaded {target_file}.svg with color {hex_color}")
        except Exception as e:
            print(f"Failed to download {target_file}: {e}")
    else:
        print(f"Could not find info for {search_term}")
