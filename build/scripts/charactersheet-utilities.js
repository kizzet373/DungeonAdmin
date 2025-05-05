function generateSection(id, title, classes, show, fields, sectionHeaderContent="") {
  return `<div class="section ${classes}">
                <div class="section-header relative">
                  <div class="section-header-title" data-bs-toggle="collapse" data-bs-target="#${id}">${title}</div>
                  ${sectionHeaderContent}
                </div>
                <div id="${id}" class="section-content container collapse ${show ? "show" : ""}">
                    <div class="row justify-content-center">${fields.join('')}</div>
                </div>
            </div>`;
}

function generateSubSection(id, title, classes, fields) {
  return `<div id="${id}" class="form-subsection ${classes}">
                <label><h4><b>${title}</b></h4></label>
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
    attrs = "",
    watch = "",
    restriction = "text",
  } = attributes;

  let inputHTML = "";

  switch (type) {
    case "textarea":
      inputHTML = `
        <div class="auto-height-container">
          <div class="mirror" x-text="form.${model} || ' '" aria-hidden="true"></div>
          <textarea id="${id}" ${attrs} ${watch ? `x-init="$watch('form.${model}', () => {${watch}})"` : ''} class="${classes} auto-height-textarea form-control my-1"${model ? `x-model="form.${model}"` : ''}></textarea>
        </div>
      `;
      break;

    case "awesomplete":
      inputHTML = `<input type="${restriction}" id="${id}" ${attrs} ${watch ? `x-init="$watch('form.${model}', () => {${watch}})"` : ''} class="${classes} awesomplete form-control my-1" ${xtext ? `x-text="${xtext}"` : ''} ${model ? `x-ref="${model}" x-model.${restriction}="form.${model}" @awesomplete-selectcomplete="form.${model} = ${restriction==="number" ? "+" : ""}$event.target.value; ${awesomParams.additionalSelectionCode}"` : ""} />`;
      
      window.awesompleteInits[id] = {
        options: Array.isArray(awesomParams.options) ? (awesomParams.options[0]?.name ? awesomParams.options.map(o => o.name) : awesomParams.options) : awesomParams.options,
        inputFilterFunction: awesomParams.filter,
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
      inputHTML = `<input type="${type}" id="${id}" ${attrs} ${watch ? `x-init="$watch('form.${model}', () => {${watch}})"` : ''} class="${classes} ${type !== "checkbox" ? "form-control" : ""} my-1" ${xtext ? `x-text="${xtext}"` : ''} ${model ? `x-ref="${model}" x-model.${restriction}="form.${model}"` : ''}>`;
  }

  return `<div class="${containerClasses}">${title ? `<label for="${id}"><u>${title}</u></label>` : ""}${inputHTML}</div>`;
}

function generateLabel(title, classes) {
  return `<div class="${classes}"><label>${title}</label></div>`
}

function generateHR() {
  return `<div class="col-12"><hr></div>`
}

function generateButton(id, classes, title, dataTable, onClickFunction) {
  return `<button style="margin-top:1rem;" type="button" class="${classes}"
                    id="${id}" data-table="${dataTable}" onclick="${onClickFunction}">${title}</button>`;
}

function generateTable(id, headers) {
  return `<table id="${id}" class="table table-bordered">
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
                      ${h.awesomParams?.optionsEntityKey ? `data-options-key="${h.awesomParams?.optionsEntityKey}"`:""}
                      ${h.awesomParams?.targetKey ? `target-key="${h.awesomParams?.targetKey}"`: ""}
                      ${h.awesomParams?.targetOptionsKey ? `target-options-key="${h.awesomParams?.targetOptionsKey}"`: ""}
                      ${h.awesomParams?.targetFilterProperty ? `target-filter-property="${h.awesomParams?.targetFilterProperty}"`: ""}
                      ${h.awesomParams?.additionalSelectionCode ? `additional-selection-code="${h.awesomParams?.additionalSelectionCode}"`: ""}
                    >
                    ${h.text}
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
  const alpineComponent = document.querySelector('[x-data]')?._x_dataStack[0];
  
  alpineComponent.form[modelPath].push({});
  
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
    const dataOptionsKey = $th.attr("data-options-key");
    const dataOptions = JSON.parse($th.attr("data-options"));
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
      options = result;
    } else if (dataOptions) {
      options = dataOptions;
    }

    let content = "";
    if (type === "remove") {
      content = `<button type="button" class="btn btn-danger btn-sm remove-row">X</button>`;
    } else if (type === "toggle-details") {
      content = `<button class="btn btn-sm btn-secondary toggle-details" type="button" data-bs-toggle="collapse" data-bs-target="#${tableId}_details${rowIndex}">▼</button>`;
    } else {
      content = generateInput({
        classes: classes,
        type: type,
        model: fullModelPath,
        id: fullModelPath,
        watch: watch,
        restriction: restriction,
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
      mainRowHTML += `<td class="${containerClasses}">${content}</td>`;
    
    if (type === "awesomplete") awesompleteIds.push(fullModelPath);
  });
  
  $table.find("tbody").append(`<tr class="row" id="${tableId}_row_${rowIndex}">${mainRowHTML}</tr>`);
  $(`#${tableId}_row_${rowIndex}`).append(`<div class="collapse row p-2 details-row" id="${tableId}_details${rowIndex}">${detailsHTML}</div>`);
  
  awesompleteIds.forEach(fullModelPath => initAwesomplete(fullModelPath, awesompleteInits[fullModelPath]));
  updateTableColors(tableId);
}
