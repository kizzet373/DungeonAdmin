function generateView(id, title, classes, show, fields, sectionHeaderContent="") {
  const viewButton = `<li class="nav-item col-2"><a class="nav-link ${show ? "active" : ""}" id="${id}-tab" data-bs-toggle="tab" href="#${id}" role="tab">${title}</a></li>`;
  $("#character-tabs").append(viewButton);
  
  return `<div class="tab-pane fade ${show ? "show active" : ""} ${classes}" id="${id}" role="tabpanel">
                <div class="relative">
                  <h2 class="d-none d-md-inline">${title}</h2>
                  ${sectionHeaderContent}
                </div>
                <div class="section-content">
                    <div class="row justify-content-center">${fields.join('')}</div>
                </div>
            </div>`;
}

function generateCollapsible(id, title, classes, show, fields, sectionHeaderContent="") {
  return `<div class="section ${classes}">
                <div class="collapsible-header relative">
                  <div id="${id}-header-title" class="collapsible-header-title" data-bs-toggle="collapse" data-bs-target="#${id}">${title}</div>
                  ${sectionHeaderContent}
                </div>
                <div id="${id}" class="collapse ${show ? "show" : ""}" toggler="#${id}-header-title">
                    <div class="row justify-content-center">${fields.join('')}</div>
                </div>
            </div>`;
}

function generateSubSection(id, title, classes, fields) {
  return `<div id="${id}" class="form-subsection ${classes}">
                <label><h6><b>${title}</b></h6></label>
                <hr>
                <div class="row">${fields.join('')}</div>
            </div>`;
}

function generateDiv(id, classes, fields) {
  return `<div id="${id}" class="${classes}">
        ${fields.join('')}
    </div>`;
}

function generateInput(attributes = {}) {
  const {
    id = "",
    title = "",
    containerClasses = "",
    classes = "",
    type = "text",
    model = "",
    xtext = "",
    awesomParams = {},
    watch = "",
    restriction = "text",
    classBind = "",
    styles = "",
  } = attributes;

  let inputHTML = "";

  switch (type) {
    case "textarea":
      inputHTML = `
        <div class="auto-height-container">
          <div class="mirror" x-text="form.${model} || ' '" aria-hidden="true"></div>
          <textarea id="${id}" ${watch ? `x-init="$watch('form.${model}', () => {${watch}})"` : ''} class="${classes} auto-height-input form-control cs-form" x-model="form.${model}" spellcheck="false" ${styles ? `:style="${styles}"` : ""}></textarea>
        </div>
      `;
      break;

    case "awesomplete":
      inputHTML = `<input type="${restriction}" id="${id}" ${watch ? `x-init="$watch('form.${model}', () => {${watch}})"` : ''} ${styles ? `:style="${styles}"` : ""} class="${classes} awesomplete form-control my-1 cs-form" x-ref="${model}" x-model.${restriction}="form.${model}" @awesomplete-selectcomplete="form.${model} = ${restriction==="number" ? "+" : ""}$event.target.value; ${awesomParams.additionalSelectionCode}"" />`;
      
      window.awesompleteInits[id] = {
        options: awesomParams.options,
        inputFilterFunction: awesomParams.inputFilterFunction,
        minChars: awesomParams.minChars,
        autoFirst: awesomParams.autoFirst,
        maxItems: awesomParams.maxItems,
        sort: awesomParams.sort,
        filterTarget: awesomParams.filterTarget,
        targetOptionsKey: awesomParams.targetOptionsKey,
        targetFilterProperty: awesomParams.targetFilterProperty
      };
      break;

    default:
      inputHTML = `<input type="${type}" id="${id}" ${watch ? `x-init="$watch('form.${model}', () => {${watch}})"` : ''} class="${classes} ${type !== "checkbox" ? "form-control" : ""} my-1 cs-form" ${model ? `x-ref="${model}" x-model.${restriction}="form.${model}"` : ''} ${styles ? `:style="${styles}"` : ""}>`;
  }

  return `<div class="${containerClasses}">${title ? `<label for="${id}">${title}</label>` : ""}${inputHTML}</div>`;
}

function generateLabel(title, classes) {
  return `<div class="${classes}"><label>${title}</label></div>`
}

function generateHR() {
  return `<div class="col-12"><hr></div>`
}

function generateButton(id, classes, title, dataTable, onClickFunction) {
  return `<button style="margin-top:1rem;" type="button" class="${classes} cs-form"
                    id="${id}" data-table="${dataTable}" onclick="${onClickFunction}">${title}</button>`;
}

function generateTable(id, headers) {
  return `<table id="${id}" class="table table-bordered border border-black">
            <thead class="table-dark">
              <tr class="row">
                ${headers.map(h => 
                  `<th class="${h.containerClasses}" 
                      data-classes="${h.classes}"
                      data-type="${h.type}" 
                      data-key="${h.key || ''}" 
                      data-watch="${h.watch || ''}"
                      data-restriction="${h.restriction || ''}"
                      data-options='${JSON.stringify(h.awesomParams?.options || [])}'
                      data-styles='${h.styles}'
                      ${h.awesomParams?.optionsEntityKey ? `data-options-entity-key="${h.awesomParams?.optionsEntityKey}"`:""}
                      ${h.awesomParams?.targetKey ? `target-key="${h.awesomParams?.targetKey}"`: ""}
                      ${h.awesomParams?.targetOptionsKey ? `target-options-key="${h.awesomParams?.targetOptionsKey}"`: ""}
                      ${h.awesomParams?.targetFilterProperty ? `target-filter-property="${h.awesomParams?.targetFilterProperty}"`: ""}
                      ${h.awesomParams?.additionalSelectionCode ? `additional-selection-code="${h.awesomParams?.additionalSelectionCode}"`: ""}
                    >
                    ${h.text || ""}
                  </th>`).join('')}
              </tr>
            </thead>
            <tbody></tbody>
          </table>`;
}

function generateTableRow(tableId) {
  const $table = $("#" + tableId);
  const rowIndex = $table.find("tbody tr").length;
  const modelPath = tableId;
  const alpineComponent = window.alpineComponent;
  
  if (!alpineComponent.form[modelPath][rowIndex]) alpineComponent.form[modelPath].push({});
  
  let mainRowHTML = "";
  let detailsHTML = "";
  let awesompleteIds = [];
  
  //Process each header
  $table.find("thead th").each((colIndex, th) => {
    const $th = $(th);
    const type = $th.attr("data-type");
    const containerClasses = $th.attr("class")
    const classes = $th.attr("data-classes");
    const modelKey = $th.attr("data-key");
    const watch = $th.attr("data-watch");
    const restriction = $th.attr("data-restriction");
    const dataOptionsKey = $th.attr("data-options-entity-key");
    const dataOptions = JSON.parse($th.attr("data-options"));
    const styles = $th.attr("data-styles");
    const fullModelPath = modelKey ? `${modelPath}[${rowIndex}].${modelKey}` : undefined;
    const targetModelKey = $th.attr("target-key");
    const targetFilterProperty = $th.attr("target-filter-property");
    const targetOptionsKey = $th.attr("target-options-key");
    const additionalSelectionCode = $th.attr("additional-selection-code");
    
    let options = [];
    if (dataOptionsKey) {
      const segments = dataOptionsKey.split('.');
      let result = window.entities;
      segments.forEach(s => result = result[s])
      options = result.map(r => r.name);
    } else if (dataOptions) {
      options = dataOptions;
    }

    let content = "";
    if (type === "remove") {
      content = `<button type="button" class="btn btn-danger btn-sm remove-row">X</button>`;
    } else if (type === "toggle-details") {
      content = `<button id="${modelPath}-${rowIndex}-toggle-details" class="btn btn-sm btn-secondary toggle-details" type="button" data-bs-toggle="collapse" data-bs-target="#${tableId}_details${rowIndex}">▼</button>`;
    } else {
      content = generateInput({
        classes: classes,
        type: type,
        model: fullModelPath,
        id: fullModelPath,
        watch: watch,
        restriction: restriction,
        styles: styles,
        awesomParams: {
          options: options,
          filterTarget: targetModelKey ? `${modelPath}[${rowIndex}].${targetModelKey}` : "",
          targetOptionsKey: targetOptionsKey ?? "",
          targetFilterProperty: targetFilterProperty ?? "",
          additionalSelectionCode: additionalSelectionCode ?? ""
        }
      });
    }

    if ($th.hasClass("detail"))
      detailsHTML += `<div class="${containerClasses}"><label>${$th.text()}</label>${content}</div>`;
    else
      mainRowHTML += `<td :style="\`background-color:\${form.${modelPath}[${rowIndex}].row_color || ''};\`" class="${containerClasses}">${content}</td>`;
    
    if (type === "awesomplete") awesompleteIds.push(fullModelPath);
  });
  
  $table.find("tbody").append(`<tr class="row" id="${tableId}_row_${rowIndex}">${mainRowHTML}</tr>`);
  if(detailsHTML) 
    $(`#${tableId}_row_${rowIndex}`).append(`<div class="collapse row p-2 details-row align-items-center" id="${tableId}_details${rowIndex}" toggler="#${tableId}-${rowIndex}-toggle-details" :style="\`background-color:\${form.${modelPath}[${rowIndex}].row_color || ''};\`">${detailsHTML}</div>`);
  
  awesompleteIds.forEach(fullModelPath => initAwesomplete(fullModelPath, awesompleteInits[fullModelPath]));
  updateTableColors(tableId);
}

function createAbilityInstance(abilityId, classes="",useSkills=true) {
  skillIds = useSkills ? window.entities.skills.filter(skill => skill.ability === abilityId).map(skill => skill.name) : [];

  return generateSubSection(`${abilityId}_subsection`, abilityId.replaceAll('_',' '), `text-capitalize ${classes}`, [
      generateInput({ id: `${abilityId}_score${useSkills?"_skills":""}`, model: `${abilityId}_score`, title: "Score", containerClasses: useSkills ? "col-6 col-md-3" : "col-6", type: "awesomplete", restriction:"number", watch: `calculateAbilityMod('${abilityId}')`, awesomParams: { options: [...Array(31)].map((_, i) => i + 1), model: `${abilityId}_score` } }),
      generateInput({ id: `${abilityId}_mod${useSkills?"_skills":""}`, classes: "calculated", model: `${abilityId}_mod`, title: "Modifier", containerClasses: useSkills ? "col-6 col-md-3" : "col-6", type: "number", restriction: "number", watch: `calculateAbilitySkillMods(['${abilityId}']);calculateSpellBonuses()`, model: `${abilityId}_mod` }),
      generateHR(),
      generateLabel("Save",`${useSkills ? "col-6 col-md-8" : "col-4"} text-start align-items-center float-left text-capitalize text-primary`),
      generateInput({id: `${abilityId}_save_prof${useSkills?"_skills":""}`, classes: "fs-7", containerClasses: useSkills ? "col-3 col-md-2 px-1" : "col-4 px-1", model: `${abilityId}_save_prof`, type: "awesomplete", watch:`calculateSkillMod('${abilityId}','${abilityId}_save')` , awesomParams: { options: [{ label: "ⒶAdvantage", value: "Ⓐ" },{ label: "⭕Half‑Proficient", value: "⭕" },{ label: "🔵 Proficient", value: "🔵" },{ label: "⭐ Expertise", value: "⭐" }]}}),
      generateInput({id: `${abilityId}_save_mod${useSkills?"_skills":""}`, classes: "fs-7 calculated", containerClasses: useSkills ? "col-3 col-md-2 px-1" : "col-4 px-1", model: `${abilityId}_save_mod`, type: "number", restriction: "number" }),
      useSkills ? skillIds.reduce((accumulator, skillId) => {
          return accumulator + generateHR() + createSkillInstance(skillId, abilityId);
      }, "") : ""
  ])
}

function createSkillInstance(skillId, abilityId) {
  return generateLabel(skillId.replaceAll('_',' '), "fs-7 col-6 col-md-8 text-start align-items-center float-left text-capitalize") +
      generateInput({id: `${skillId}_prof`, classes: "fs-7", containerClasses: "col-3 col-md-2 px-1", model: `${skillId}_prof`, type: "awesomplete", watch: `calculateSkillMod('${abilityId}','${skillId}')`, awesomParams: { options: [{ label: "ⒶAdvantage", value: "Ⓐ" },{ label: "⭕Half‑Proficient", value: "⭕" },{ label: "🔵 Proficient", value: "🔵" },{ label: "⭐ Expertise", value: "⭐" }]}}) +
      generateInput({id: `${skillId}_mod`, classes: "fs-7 calculated", containerClasses: "col-3 col-md-2 px-1", model: `${skillId}_mod`, type: "number", restriction: "number" })
}

function createSpellLevelTable() {
  if (currentSpellLevel >= spellLevelTitles.length) return;

  let spellLevelTitle = spellLevelTitles[currentSpellLevel];
  let spellTableId = `level_${currentSpellLevel}_spells`;

  let newTable =
      generateDiv("","",[
          generateCollapsible(spellTableId + "_container", spellLevelTitle + " ▼", "secondary-section text-start", false, [
              generateTable(spellTableId, [
                  { text: "Details", containerClasses: "col-2 col-md-2", type: "toggle-details" },
                  { key: "name", text: "Name", containerClasses: "col-7 col-md-8", type: "awesomplete", awesomParams: { optionsEntityKey: `level${currentSpellLevel}Spells`, additionalSelectionCode:"populateSpellDetails($event.target);"} },
                  { key: "prepared", text: "Prepared", containerClasses: "col-3 col-md-2", type: "checkbox" },
                  { key: "range", text: "Range", containerClasses: "col-4 col-md-2 detail", type: "text" },
                  { key: "casting_time", text: "Casting Time", containerClasses: "col-4 col-md-3 detail", type: "text" },
                  { key: "ritual", text: "Ritual", containerClasses: "col-4 col-md-2 detail", type: "checkbox" },
                  { key: "duration", text: "Duration", containerClasses: "col-12 col-md-5 detail", type: "text" },
                  { key: "school", text: "School", containerClasses: "col-4 detail", type: "text" },
                  { key: "components", text: "Components", containerClasses: "detail col-6 offset-2", type: "text"},
                  { key: "description", text: "Description", containerClasses: "col-12 col-md-12 detail", type: "textarea" },
                  { key: "notes", text: "Notes", containerClasses: "col-12 detail", type: "textarea"},
                  { text: "Remove", containerClasses: "col-2 detail", type: "remove" },
                  { key: "row_color", text: "Color", containerClasses: "col-2 col-md-1 offset-2 detail", type: "color"}
              ]),
              generateButton("", "btn btn-primary add-spell", "Add Spell", spellTableId, "generateTableRow($(this).data('table'));")
          ]
          ,currentSpellLevel === 0 ? "" : generateDiv("","spell-slot-input-container row", [
              generateLabel("Slots:","col-3 col-md-2 h3 text-white my-auto"),    
              generateInput({model: `level_${currentSpellLevel}_spell_slots_available`, id:`level_${currentSpellLevel}_spell_slots_available`, containerClasses:"col-3 col-md-2 px-2",type:"text" }),
              generateDiv("","col-1 text-white h4 p-0 mx-0 my-auto",["/"]),
              generateInput({model: `level_${currentSpellLevel}_spell_slot_max`, id:`level_${currentSpellLevel}_spell_slot_max`,containerClasses:"col-3 col-md-2 px-2",type:"text" })
          ])),
      ])

  $("#spell_levels_container").append(newTable);
  currentSpellLevel++;
}

function populateSpellDetails(inputElement) {
  const spellName = inputElement.value.trim();
  const idParts = inputElement.id.match(/level_(\d+)_spells\[(\d+)\]\.name/);
  const spellLevel = parseInt(idParts[1]);
  const spellIndex = parseInt(idParts[2]);
  const spell = window.entities[`level${spellLevel}Spells`].find(s => s.name.toLowerCase() === spellName.toLowerCase());
  spell.description = spell.description.replaceAll("<br>", "\n").replaceAll("<b>", '').replaceAll("</b>", '');
  window.alpineComponent.form[`level_${spellLevel}_spells`][spellIndex] = Object.assign({}, spell);
}

function populateItems(inputElement) {
  const itemName = inputElement.value.trim();
  const idParts = inputElement.id.match(/(.*?)\[(\d+)\]\.name/);
  const tableName = idParts[1];
  const itemTableIndex = parseInt(idParts[2]);
  const item = window.entities[`items`].find(i => i.name.toLowerCase() === itemName.toLowerCase());
  item.description = item.description.replaceAll("<br>", "\n").replaceAll("<b>", '').replaceAll("</b>", '');
  window.alpineComponent.form[tableName][itemTableIndex] = Object.assign({}, item);
}

function updateTableColors(tableId) {
  $(`#${tableId} tbody tr *`).removeClass('primary-color secondary-color');
  $(`#${tableId} tbody > *:not(.disabled-row)`).each(function(index) {
      $(this).children('td,div').addClass(index % 2 === 0 ? "primary-color" : "secondary-color");
  });
}

function initAwesomplete(elementOrId, awesomParams = {}) {
  let element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  
  element._awesomplete?.destroy();
  element._awesomplete = null;
  
  const originalOptions = awesomParams.options || [];
  
  const awesompleteInstance = new Awesomplete(element, {
      list: originalOptions,
      minChars: 0,
      autoFirst: awesomParams.autoFirst ?? true,
      maxItems: awesomParams.maxItems || 400,
      sort: awesomParams.sort ?? false,
      filter: function(text, input) {
          // If the input field is focused hasn't been modified since focus, show all options
          if (element.dataset.justFocused === "true") return true;
          
          const filterFunc = awesomParams.inputFilterFunction || Awesomplete.FILTER_CONTAINS;
          return filterFunc(text, input);
      }
  });
  
  element._awesomplete = awesompleteInstance;

  element.addEventListener("focus", () => {
      element.dataset.justFocused = "true";
      element.dataset.originalValue = element.value;
      element._awesomplete.evaluate();
  });
  
  element.addEventListener("input", () => {
      if (element.value !== element.dataset.originalValue) {
          element.dataset.justFocused = "false";
      }
  });
  
  // Handle filtering target if specified
  if (awesomParams.filterTarget) {
      const updateOptions = () => {
          let targetElement = document.getElementById(awesomParams.filterTarget);
          const sourceValue = element.value;
          const targetOptionsEntity = window.entities[awesomParams.targetOptionsKey] || [];
          
          const filteredOptions = sourceValue 
              ? targetOptionsEntity.filter(item => item[awesomParams.targetFilterProperty] === sourceValue).map(item => item.name)
              : targetOptionsEntity.map(item => item.name);
          
          targetElement._awesomplete.list = filteredOptions;
      };
      
      element.addEventListener('change', updateOptions);
      element.addEventListener('awesomplete-selectcomplete', updateOptions);
      
      element.dataset.filterInitialized = "true";
      
      if (element.value) {
          updateOptions();
      }
  }
}

function initializeEventListeners() {
  $(document).on("show.bs.collapse hide.bs.collapse", ".collapse", function (event) {
      event.stopImmediatePropagation();

      let title = $($(this).attr("toggler"))
      let txt = title.text();
      title.text(txt[txt.length-1] === "▼" ? txt.replace("▼","▲") : txt.replace("▲","▼"));
  });

  $(document).on("click", ".remove-row", function () {
      let tableId = $(this).closest("table").attr("id");
      let row = $(this).closest("tr");
      row.addClass("disabled-row");
      window.alpineComponent.form[tableId][row.index()].disabled = true;
      updateTableColors(tableId);
  });

  $(document).on('change', '#character-image-upload', async (event) => {
    if (!event.target.files || !event.target.files[0]) return;
    
    const file = event.target.files[0];
    if (!file.type.match('image.*') || file.size > 10 * 1024 * 1024) {
        alert('Please select an image file and make sure it is smaller than 10MB.');
        return;
    }
    
    $('#character-image-upload').prop("disabled",true)
    $('#character-image').hide()
    $('#image-loading-spinner').show()

    const formData = new FormData();
    formData.append(`character_image_${characterId}`, file);
    formData.append('_version', window.alpineComponent._version);

    try {
      const response = await fetch(`/dungeonadmin-api/upload-character-image/${characterId}`, {
          method: 'POST',
          body: formData,
      });

      if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 409) {
              alert(`Version mismatch: ${errorData.error}\nYour image upload failed because the sheet was updated by someone else. Please refresh the page.`);
              setReadOnlyMode(true);
          }
          throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();

      $('#character-image').show().attr('src', data.imageUrl + '?t=' + new Date().getTime());
      window.alpineComponent.form.character_image_path = data.imageUrl;
      window.alpineComponent._version = data._version;
      $('#character-image-upload').prop("disabled",false)
      showSaveStatus(true);
    } catch (error) {
      console.error('Error uploading image:', error);
      $('#character-image').hide();
      alert('Failed to upload image.');
      $('#character-image-upload').prop("disabled",false)
      showSaveStatus(false);
    } finally {
      $('#image-loading-spinner').hide();
    }
  });
}



async function loadCharacterData() {
  const urlParams = new URLSearchParams(window.location.search);
  characterId = urlParams.get('id');
  
  if (!characterId) {
      showError("No character ID provided");
      return;
  }
  
  const response = await fetch(`/dungeonadmin-api/characters/${characterId}`)
  if (!response.ok)
    showError(response.status === 403 ? "You don't have permission to view this character" : "Error loading character")

  const data = await response.json();

  isOwner = data.isOwner;
  isReadOnly = !isOwner;
  document.title = `${data.form.character_name || 'Character'} - Character Sheet`;
  setupAutosave();
  populateFormData(data.form);
  window.alpineComponent._version = data._version || 0;
}

function showError(message) {
  $('#error-message').text(message);
  $('.error-container').show();
  $('.sheet-container').hide();
}

function populateFormData(formData) {
  alpineForm = structuredClone(CSModel.form);
  window.alpineComponent.form = alpineForm;
  
  Object.keys(formData).forEach(key => {
      if (Array.isArray(formData[key])) {
          alpineForm[key] = formData[key].filter(item => Object.keys(item).length && !item.disabled).map(item => structuredClone(item));

          if (!alpineForm[key][0]) alpineForm[key].push({})
      } else if (typeof formData[key] === 'object' && formData[key] !== null) {
          alpineForm[key] = JSON.parse(JSON.stringify(formData[key]));
      } else {
          alpineForm[key] = formData[key];
      }
  });

  $('.locked-sheet').hide();
  $('.sheet-container').show();

  if (alpineForm.character_image_path) {
      $('#character-image').attr('src', alpineForm.character_image_path + '?t=' + new Date().getTime());
      $('#character-image').show();
  }
}

function populateTablesFromForm() {
  Object.keys(alpineComponent.form).forEach(key => {
    if (Array.isArray(alpineComponent.form[key])) {
      if (key.endsWith('_spells') && alpineComponent.form[key][0] && Object.keys(alpineComponent.form[key][0])?.length !== 0 && parseInt(key.match(/level_(\d+)_spells/)[1]) <= currentSpellLevel) {
        createSpellLevelTable();
      }

      alpineComponent.form[key].forEach(obj => generateTableRow(key)) 
    }
  })
}

function setReadOnlyMode(isReadOnly) {
  if (isReadOnly) {
      $('.cs-form').prop('disabled', true);
      $('.add-row, .remove-row, .add-spell, #addSpellLevel, #add_class_level_btn').hide();
      $('.readonly-notice').show();
  } else {
      $('.cs-form').prop('disabled', false);
      $('.add-row, .remove-row, .add-spell, #addSpellLevel, #add_class_level_btn').show();
      $('.readonly-notice').hide();
  }
}

function setupAutosave() {
  if (window.alpineComponent) {
      window.alpineComponent.$watch('form', () => {
          scheduleAutoSave();
      }, { deep: true });
  } else {
      setTimeout(() => setupAutosave(), 500); // try again in a bit
  }
}

function scheduleAutoSave() {
  if (isReadOnly) return;
  if (saveTimer) clearTimeout(saveTimer);
  
  saveTimer = setTimeout(() => {
      saveCharacter();
  }, 1000); // Wait 1 second after the last change before saving
}

async function saveCharacter() {
  if (isReadOnly) return;
  if (!window.alpineComponent.form.character_name) return;
  
  const formData = window.alpineComponent.form;
  
  // Preserve metadata
  const dataToSave = {
      ...characterData,
      form: formData,
      _version: window.alpineComponent._version,
      updated: new Date().toISOString()
  };
  
  try {
    const response = await fetch(`/dungeonadmin-api/characters/${characterId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
    });

    if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
            alert(`Version mismatch: ${errorData.message}\nYour changes will not be saved. Please refresh the page to get the latest version.`);
            setReadOnlyMode(true);
        }
        throw new Error(errorData.message || 'Failed to save character');
    }

    const savedData = await response.json();
    window.alpineComponent._version = savedData._version;
    characterData = savedData;
  } catch (error) {
    console.error('Error saving character:', error);
    showSaveStatus(false);
  }
}

function showSaveStatus(success) {
  const $status = $('.save-status');
  
  if (success) {
      $status.removeClass('bg-danger').addClass('bg-success').text('Saved!');
  } else {
      $status.removeClass('bg-success').addClass('bg-danger').text('Save failed!');
  }
  
  $status.fadeIn();
  
  setTimeout(() => {
      $status.fadeOut();
  }, 2000);
}