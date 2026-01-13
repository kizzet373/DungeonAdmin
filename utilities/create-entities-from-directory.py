import json
import requests
from bs4 import BeautifulSoup
import os

magic_items_data = []
directory_path = "./content/magic-items"

try:
    file_names = [f for f in os.listdir(directory_path) if os.path.isfile(os.path.join(directory_path, f))]
except FileNotFoundError:
    print(f"Error: The directory '{directory_path}' was not found. Please check the path.")
    exit()

for file_name in file_names:
    file_path = os.path.join(directory_path, file_name) 
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        soup = BeautifulSoup(content, "html.parser")

        magic_item_data = {}

        try:
            magic_item_data["name"] = soup.select(".page-title")[0].get_text(strip=True)
        except (IndexError, AttributeError):
            magic_item_data["name"] = None

        try:
            magic_item_data["source"] = soup.select("#page-content > p")[0].get_text(strip=True)
        except (IndexError, AttributeError):
            magic_item_data["source"] = None

        try:
            magic_item_data["type"] = soup.select("#page-content > p")[1].get_text(strip=True)
        except (IndexError, AttributeError):
            magic_item_data["type"] = None
        
        try:
            description_elements = soup.select("#page-content > *")[2:]
            description_parts = [element.get_text(strip=True) for element in description_elements]
            magic_item_data["description"] = "\n\n".join(description_parts)
        except (IndexError, AttributeError):
            magic_item_data["description"] = None
        
        magic_items_data.append(magic_item_data)

    except Exception as e:
        print(f"Error processing {file_path}: {e}")

# Save the data to a JSON file
output_filename = "kizzet2024.json"
with open(output_filename, "w") as f:
    json.dump(magic_items_data, f, indent=4)

print(f"Magic Item data saved to {output_filename}")