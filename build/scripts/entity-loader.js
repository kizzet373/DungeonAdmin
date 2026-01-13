window.entities = window.entities || {};

const defaultEdition = 'kizzet2024';

async function loadEntity(edition, entityName) {
    edition = edition.toLowerCase();
    entityName = entityName.toLowerCase();

    const primaryPath = `/content/entities/${edition}/${edition}-${entityName}.json`;
    const fallbackPath = `/content/entities/${defaultEdition}/${defaultEdition}-${entityName}.json`;

    let data = null;
    let loadedFromEdition = null;

    try {
        const response = await fetch(primaryPath);
        if (response.ok) {
            data = await response.json();
            loadedFromEdition = edition;
        } else if (response.status === 404 && edition !== defaultEdition) {
            console.warn(`${entityName} data not found for ${edition} (status ${response.status}). Attempting fallback to ${defaultEdition} from ${fallbackPath}.`);
            
            const fallbackResponse = await fetch(fallbackPath);
            if (fallbackResponse.ok) {
                data = await fallbackResponse.json();
                loadedFromEdition = defaultEdition;
            } else {
                console.error(`Failed to load ${entityName} from fallback ${fallbackPath} (status ${fallbackResponse.status}).`);
            }
        } else if (response.status === 404 && edition === defaultEdition) {
            console.error(`${entityName} data not found for default edition ${edition} at ${primaryPath}. No other fallback attempted.`);
        } else {
            console.error(`Failed to load ${entityName} from ${primaryPath} (status ${response.status}).`);
        }
    } catch (error) {
        console.error(`Network error or JSON parsing error fetching ${entityName} (primary path: ${primaryPath}):`, error);
    }

    if (data) {
        window.entities[entityName] = data.sort((a, b) => {
          return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)
        });

        document.dispatchEvent(new CustomEvent(`${entityName}Loaded`, {
            detail: {
                edition: loadedFromEdition,
                requestedEdition: edition,
                data: data
            }
        }));
        return data; 
    } else {
        console.warn(`Data for ${entityName} (key: ${entityName}) could not be loaded for ${edition} or fallback ${defaultEdition}.`);
        return null; 
    }
}

async function loadMultipleEntities(entityConfigs, eventName = 'allEntitiesLoaded') {
    const loadPromises = entityConfigs.map(config => 
        loadEntity(config.edition, config.entityName)
    );

    const results = await Promise.allSettled(loadPromises);

    const loadedEntities = {};
    const failedEntities = [];

    results.forEach((result, index) => {
        const { entityName } = entityConfigs[index];
        if (result.status === 'fulfilled' && result.value !== null) {
            loadedEntities[entityName] = result.value;
        } else {
            failedEntities.push(entityName);
        }
    });

    if (Object.keys(loadedEntities).length > 0) {
        document.dispatchEvent(new CustomEvent(eventName, {
            detail: {
                loaded: loadedEntities,
                failed: failedEntities,
                allLoadedSuccessfully: failedEntities.length === 0
            }
        }));
    } else {
        console.warn(`No entities were successfully loaded from the batch.`);
        document.dispatchEvent(new CustomEvent(eventName, {
            detail: {
                loaded: {},
                failed: entityConfigs.map(config => config.entityName),
                allLoadedSuccessfully: false
            }
        }));
    }

    return { loaded: loadedEntities, failed: failedEntities };
}