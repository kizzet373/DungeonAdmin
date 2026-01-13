import time, os, json, re
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Define entities and their configuration
ENTITIES = [
    {
        "name": "classes",
        "watch_dir": "./content/classes",
        "exclude_suffixes": ["all.html"],
        "output": "./content/entities/classlist.js",
        "strip_prefix": "",
        "strip_suffix":"main"
    },
    {
        "name": "subclasses",
        "watch_dir": "./content/classes/subclasses",
        "exclude_suffixes": ["all.html"],
        "output": "./content/entities/subclasslist.js",
        "strip_prefix": "",
        "strip_suffix":""
    },
    {
        "name": "spells",
        "watch_dir": "./content/spells",
        "exclude_suffixes": ["all-spells.html","spell-content.html"],
        "output": "./content/entities/spelllist.js",
        "strip_prefix": "spell",
        "strip_suffix":""
    },
    {
        "name": "backgrounds",
        "watch_dir": "./content/backgrounds",
        "exclude_suffixes": ["all.html"],
        "output": "./content/entities/backgroundlist.js",
        "strip_prefix": "background",
        "strip_suffix":""
    },
    {
        "name": "species",
        "watch_dir": "./content/species",
        "exclude_suffixes": ["all.html"],
        "output": "./content/entities/specieslist.js",
        "strip_prefix": "species",
        "strip_suffix":""
    },
]

# Update function for a specific entity
def update_entity_list(entity):
    if not os.path.exists(entity["watch_dir"]):
        print(f"[WARN] Directory not found: {entity['watch_dir']}")
        return

    prefix = entity.get("strip_prefix", "")
    suffix = entity.get("strip_suffix", "")
    excluded = entity.get("exclude_suffixes", [])

    entries = []

    for filename in os.listdir(entity["watch_dir"]):
        filepath = os.path.join(entity["watch_dir"], filename)
        if not os.path.isfile(filepath):
            continue
        if any(filename.endswith(ex) for ex in excluded):
            continue
        if not filename.endswith(".html"):
            continue

        name_part = filename[:-5]  # remove .html
        if prefix and name_part.startswith(prefix):
            name_part = name_part[len(prefix):]
        if suffix and name_part.endswith(suffix):
            name_part = name_part[:-len(suffix)]

        name_part = name_part.replace("-s-", "'s-").replace("-", " ")

        if entity["name"] == "subclasses":
            if "_" not in name_part:
                continue
            class_part, subclass_part = name_part.split("_", 1)
            entries.append({
                "class": class_part.strip().title(),
                "name": subclass_part.strip().title(),
                "file": filename
            })
        elif entity["name"] == "spells":
            from bs4 import BeautifulSoup

            casting_time = ""
            spellRange = ""
            components = ""
            duration = ""
            description = ""
            level_text = ""
            ritual = False

            # Read file and extract level label
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    soup = BeautifulSoup(f.read(), "html.parser")

                    casting_time_raw = soup.select_one("#casting-time").get_text(strip=True)
                    ritual = " or ritual" in casting_time_raw.lower()
                    casting_time = casting_time_raw.lower().replace(" or ritual", "") if ritual else casting_time_raw
                    spellRange = soup.select_one("#range").get_text(strip=True)
                    components = soup.select_one("#components").get_text(strip=True)
                    duration = soup.select_one("#duration").get_text(strip=True)
                    description = ""
                    for p in soup.select_one("#description").find_all("p"):
                        description += p.get_text().replace("\n                      "," ") + "\n\n"
                    description = description[:-2]
                    level_text = soup.select_one("#spell-level-label").get_text(strip=True).lower()
                    source = soup.select_one("#source").get_text(strip=True).lower()
            except Exception as e:
                print(f"Error parsing {filename}: {e}")

            level_match = None
            school = None
            if "cantrip" in level_text:
                level_match = 0
                school = re.search(r"(\w+)\s+cantrip",level_text).group(1)
            else:
                match = re.search(r"level\s+([1-9]) (.*?) \(", level_text)
                if match:
                    level_match = int(match.group(1))
                    school = match.group(2)

            classes = re.search(r"\((.*?)\)",level_text).group(1).replace(" ","").split(",")

            entries.append({
                "name": name_part.strip().title(),
                "file": filename,
                "level": level_match,
                "casting_time": casting_time,
                "ritual": ritual,
                "range":spellRange,
                "components":components,
                "duration":duration,
                "description":description,
                "spell_classes":classes,
                "school":school,
                "source":source
            })
        else:
            entries.append({
                "name": name_part.strip().title(),
                "file": filename
            })

    entries.sort(key=lambda x: x["name"])
    
    entries_by_level = []
    if entity["name"] == "spells":
        for i in range(10):
            entries_by_level.append([])
        
        for entry in entries:
            if entry["level"] is not None:
                entries_by_level[entry["level"]].append(entry)

    os.makedirs(os.path.dirname(entity["output"]), exist_ok=True)
    with open(entity["output"], 'w') as out:
        out.write(f'(window.entities ??= {{}}).{entity["name"]} = ')
        json.dump(entries_by_level or entries, out, indent=2)

    print(f"[{time.ctime()}] Updated {entity['output']}")

# Check and initialize all entity JSON files
for entity in ENTITIES:
    if not os.path.exists(entity["output"]):
        print(f"{entity['output']} not found. Creating it...")
        update_entity_list(entity)

# Watch handler for a single entity
def make_handler(entity):
    class CustomHandler(FileSystemEventHandler):
        def on_moved(self, event): update_entity_list(entity)
        def on_created(self, event): update_entity_list(entity)
        def on_deleted(self, event): update_entity_list(entity)
    return CustomHandler()

# Start all watchers
if __name__ == "__main__":
    observers = []
    for entity in ENTITIES:
        update_entity_list(entity)
        handler = make_handler(entity)
        observer = Observer()
        observer.schedule(handler, path=entity["watch_dir"], recursive=False)
        observer.start()
        observers.append(observer)
        print(f"Watching {entity['watch_dir']} for {entity['name']}...")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        for obs in observers:
            obs.stop()
        for obs in observers:
            obs.join()
