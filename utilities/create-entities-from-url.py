import json
import requests
from bs4 import BeautifulSoup

urls = [
"http://dnd2024.wikidot.com/feat:Alert",
"http://dnd2024.wikidot.com/feat:Crafter",
"http://dnd2024.wikidot.com/feat:Healer",
"http://dnd2024.wikidot.com/feat:Lucky",
"http://dnd2024.wikidot.com/feat:Magic-Initiate",
"http://dnd2024.wikidot.com/feat:Musician",
"http://dnd2024.wikidot.com/feat:Savage-Attacker",
"http://dnd2024.wikidot.com/feat:Skilled",
"http://dnd2024.wikidot.com/feat:Tavern-Brawler",
"http://dnd2024.wikidot.com/feat:Tough",
"http://dnd2024.wikidot.com/feat:Ability-Score-Improvement",
"http://dnd2024.wikidot.com/feat:Actor",
"http://dnd2024.wikidot.com/feat:Athlete",
"http://dnd2024.wikidot.com/feat:Charger",
"http://dnd2024.wikidot.com/feat:Chef",
"http://dnd2024.wikidot.com/feat:Crossbow-Expert",
"http://dnd2024.wikidot.com/feat:Crusher",
"http://dnd2024.wikidot.com/feat:Defensive-Duelist",
"http://dnd2024.wikidot.com/feat:Dual-Wielder",
"http://dnd2024.wikidot.com/feat:Durable",
"http://dnd2024.wikidot.com/feat:Elemental-Adept",
"http://dnd2024.wikidot.com/feat:Fey-Touched",
"http://dnd2024.wikidot.com/feat:Grappler",
"http://dnd2024.wikidot.com/feat:Great-Weapon-Master",
"http://dnd2024.wikidot.com/feat:Heavily-Armored",
"http://dnd2024.wikidot.com/feat:Heavy-Armor-Master",
"http://dnd2024.wikidot.com/feat:Inspiring-Leader",
"http://dnd2024.wikidot.com/feat:Keen-Mind",
"http://dnd2024.wikidot.com/feat:Lightly-Armored",
"http://dnd2024.wikidot.com/feat:Mage-Slayer",
"http://dnd2024.wikidot.com/feat:Martial-Weapon-Training",
"http://dnd2024.wikidot.com/feat:Medium-Armor-Master",
"http://dnd2024.wikidot.com/feat:Moderately-Armored",
"http://dnd2024.wikidot.com/feat:Mounted-Combatant",
"http://dnd2024.wikidot.com/feat:Observant",
"http://dnd2024.wikidot.com/feat:Piercer",
"http://dnd2024.wikidot.com/feat:Poisoner",
"http://dnd2024.wikidot.com/feat:Polearm-Master",
"http://dnd2024.wikidot.com/feat:Resilient",
"http://dnd2024.wikidot.com/feat:Ritual-Caster",
"http://dnd2024.wikidot.com/feat:Sentinel",
"http://dnd2024.wikidot.com/feat:Shadow-Touched",
"http://dnd2024.wikidot.com/feat:Sharpshooter",
"http://dnd2024.wikidot.com/feat:Shield-Master",
"http://dnd2024.wikidot.com/feat:Skill-Expert",
"http://dnd2024.wikidot.com/feat:Skulker",
"http://dnd2024.wikidot.com/feat:Slasher",
"http://dnd2024.wikidot.com/feat:Speedy",
"http://dnd2024.wikidot.com/feat:Spell-Sniper",
"http://dnd2024.wikidot.com/feat:Telekinetic",
"http://dnd2024.wikidot.com/feat:Telepathic",
"http://dnd2024.wikidot.com/feat:War-Caster",
"http://dnd2024.wikidot.com/feat:Weapon-Master",
"http://dnd2024.wikidot.com/feat:Archery",
"http://dnd2024.wikidot.com/feat:Blind-Fighting",
"http://dnd2024.wikidot.com/feat:Defense",
"http://dnd2024.wikidot.com/feat:Dueling",
"http://dnd2024.wikidot.com/feat:Great-Weapon-Fighting",
"http://dnd2024.wikidot.com/feat:Interception",
"http://dnd2024.wikidot.com/feat:Protection",
"http://dnd2024.wikidot.com/feat:Thrown-Weapon-Fighting",
"http://dnd2024.wikidot.com/feat:Two-Weapon-Fighting",
"http://dnd2024.wikidot.com/feat:Unarmed-Fighting",
"http://dnd2024.wikidot.com/feat:Boon-Of-Combat-Prowess",
"http://dnd2024.wikidot.com/feat:Boon-Of-Dimensional-Travel",
"http://dnd2024.wikidot.com/feat:Boon-Of-Energy-Resistance",
"http://dnd2024.wikidot.com/feat:Boon-Of-Fate",
"http://dnd2024.wikidot.com/feat:Boon-Of-Fortitude",
"http://dnd2024.wikidot.com/feat:Boon-Of-Irresistible-Offense",
"http://dnd2024.wikidot.com/feat:Boon-Of-Recovery",
"http://dnd2024.wikidot.com/feat:Boon-Of-Skill",
"http://dnd2024.wikidot.com/feat:Boon-Of-Speed",
"http://dnd2024.wikidot.com/feat:Boon-Of-Spell-Recall",
"http://dnd2024.wikidot.com/feat:Boon-Of-The-Night-Spirit",
"http://dnd2024.wikidot.com/feat:Boon-Of-Truesight"
]

all_spells_data = []

for url in urls:
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes
        soup = BeautifulSoup(response.content, "html.parser")

        spell_data = {}

        try:
            spell_data["name"] = soup.select(".page-title")[0].get_text(strip=True)
        except (IndexError, AttributeError):
            spell_data["name"] = None

        try:
            spell_data["source"] = soup.select("#page-content > p")[0].get_text(strip=True)
        except (IndexError, AttributeError):
            spell_data["source"] = None

        try:
            spell_data["others"] = soup.select("#page-content > p")[2].get_text(strip=True)
        except (IndexError, AttributeError):
            spell_data["others"] = None
        
        try:
            description_elements = soup.select("#page-content > *")[4:-2]
            description_parts = [element.get_text(strip=True) for element in description_elements]
            spell_data["description"] = "\n\n".join(description_parts)
        except (IndexError, AttributeError):
            spell_data["description"] = None

        try:
            spell_data["classes"] = soup.select("#page-content > *")[-2].get_text(strip=True)
        except (IndexError, AttributeError):
            spell_data["classes"] = None
        

        all_spells_data.append(spell_data)

    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}")
    except Exception as e:
        print(f"Error processing {url}: {e}")

# Save the data to a JSON file
output_filename = "2024-feat-list.json"
with open(output_filename, "w") as f:
    json.dump(all_spells_data, f, indent=4)

print(f"Spell data saved to {output_filename}")

