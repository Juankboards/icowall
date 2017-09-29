const infoSection = document.getElementById("info-section");
const listSection = document.getElementById("list-section");
const uploadSection = document.getElementById("upload-section");
const gridSection = document.getElementById("grid-section");
const listTable = document.getElementById("list-table");
const infoContainer = document.getElementById("info-container");
const grid = document.getElementById("grid");
const gridInfo = document.getElementById("grid").getBoundingClientRect();
const sizeProportion = gridInfo.width/1000;
const gridBlocks = Array.from({length: 100}, (element, id) => id);
const unavailableBlocks = [];

function init() {
  window.scrollTo(0, 0);
  const iconsContainer = document.getElementById("icons-container");
  const gridContainer = document.getElementById("grid-container");  
  
  const iconsData = [
    {"title":"logo1.png", "name": "ico1", "width":100, "height":100, "position":{"X": 0, "Y": 0}, "link": "https://www.logo1.com", "description": "This is the logo1 description", "date": "2017-08-23"},
    {"title":"logo2.jpg", "name": "ico2", "width":100, "height":100, "position":{"X": 900, "Y": 900}, "link": "https://www.logo2.com", "description": "This is the logo2 description", "date": "2017-11-16"},
    {"title":"logo3.png", "name": "ico3", "width":250, "height":130, "position":{"X": 500, "Y": 500}, "link": "https://www.logo2.com", "description": "This is the logo3 description", "date": "1991-04-29"}
  ]


  if (document.documentElement.clientWidth <= document.documentElement.clientHeight) {
    gridContainer.style.width = "100%";
    gridContainer.style.height = document.documentElement.clientWidth + "px";
  }


  
  iconsContainer.style.width = gridInfo.width + "px";
  iconsContainer.style.height = gridInfo.height + "px";
  iconsContainer.style.top = gridInfo.top + "px";
  iconsContainer.style.left = gridInfo.left + "px";


  

  iconsData.forEach((element) => {

    let newIcon = populateElement(iconsContainer, {"type": "IMG", "hasText": false, "text": "", 
                                      "attributes": [{"type": "src", "value": "uploads/"+element.title}, 
                                                    {"type": "width", "value": Math.round(Math.round(element.width/10)*10*sizeProportion)},
                                                    {"type": "height", "value": Math.round(Math.round(element.height/10)*10*sizeProportion)}]});
    newIcon.style.top = Math.round(element.position.X*sizeProportion) + "px";
    newIcon.style.left = Math.round(element.position.Y*sizeProportion) + "px";

    //add used blocks to unavailableBlocks
    let firstBlockXIndex = element.position.X/10;
    let lastBlockXIndex = firstBlockXIndex + element.width/10 - 1;
    let firstBlockYIndex = element.position.Y/10;
    let lastBlockYIndex = firstBlockYIndex + element.height/10 - 1;
    let unavailableColumn = Array.of(gridBlocks[firstBlockXIndex], gridBlocks[lastBlockXIndex]);    
    let unavailableRow = Array.of(gridBlocks[firstBlockYIndex], gridBlocks[lastBlockYIndex]); 
    unavailableBlocks.push({"columnBlocks": unavailableColumn, "rowBlocks": unavailableRow})
    

    newIcon.onclick = () => {
      populateInfo(infoContainer, element);
      closeAll();
      infoSection.style.display = "block";
    }
  });

  document.getElementById("list").onclick = () =>{
    populateTable(listTable, iconsData);
    closeAll();
    listSection.style.display = "block";
  }

  document.getElementById("home").onclick = () =>{
    closeAll();
    gridSection.style.display = "block";
  }  
};

function closeAll() {
  [infoSection, listSection, gridSection, uploadSection].forEach((element) => element.style.display = "none");
  if(document.getElementById("icon-preview")){
    document.getElementById("icon-preview").removeAttribute("src");
    document.getElementById("icon-preview").removeAttribute("class");
    document.getElementById("icon-preview").removeAttribute("width");
    document.getElementById("icon-preview").removeAttribute("height");
    document.getElementById("icon-preview").style.zIndex = "unset";
  }
} 

function cleanElement (element) { 
  while (element.lastChild) {
    element.removeChild(element.lastChild);
  }
}

function populateElement (parentElement, options) {
  let newElement = createElement(options);
  appendElement(parentElement, newElement);
  return newElement;
}

function createElement (options) {
  let element = document.createElement(options.type);

  options.attributes.forEach((attribute) => {
    element.setAttribute(attribute.type, attribute.value);
  })

  if (options.text) {
    let text = document.createTextNode(options.text); 
    element.appendChild(text);
  }
  return element;
}

function appendElement (parentElement, childElement) {
  parentElement.appendChild(childElement);
}

function populateInfo (parentElement, data) {
  cleanElement(parentElement);
  populateElement(parentElement, {"type": "IMG", "hasText": false, "text": "", "attributes": [{"type": "src", "value": "uploads/"+data.title}]});
  populateElement(parentElement, {"type": "H1", "hasText": true, "text": data.name, "attributes": []});
  populateElement(parentElement, {"type": "P", "hasText": true, "text": data.description, "attributes": []});
  populateElement(parentElement, {"type": "A", "hasText": true, "text": data.link, 
                                  "attributes": [{"type": "href", "value": data.link}, {"type": "target", "value": "_blank"}]});
}

function populateTable (parentElement, data) {
  if (parentElement.lastChild.localName != "tr" && data.length > 0){
    data.forEach((element) => {
      let newRow = populateElement(parentElement, {"type": "TR", "hasText": false, "text": "", "attributes": []});
      let imgColumn = populateElement(newRow, {"type": "TD", "hasText": false, "text": "", "attributes": [{"type": "class", "value": "img-column"}]});
      populateElement(imgColumn, {"type": "IMG", "hasText": false, "text": "", "attributes": [{"type": "src", "value": "uploads/"+element.title}]});
      populateElement(newRow, {"type": "TD", "hasText": true, "text": element.name, "attributes": []});
      populateElement(newRow, {"type": "TD", "hasText": true, "text": element.description, "attributes": []});
      populateElement(newRow, {"type": "TD", "hasText": true, "text": element.date, "attributes": []});

      imgColumn.onclick = () => {
        populateInfo(infoContainer, element);
        listSection.style.display = "none";
        infoSection.style.display = "block";
      }
    });
  }
}

document.getElementById("buy").onclick = () =>{
  closeAll();
  let leftAdjust = (document.documentElement.clientWidth > 1150)?70 : 0;

  let imgPreview = document.getElementById("icon-preview");
  gridSection.style.display = "block";
  let iconContainerClone = document.getElementById("icons-container").cloneNode(false);
  iconContainerClone.setAttribute("id", "buy-grid")
  iconContainerClone.style.left = iconContainerClone.style.left.split("px")[0] - leftAdjust + "px";
  let blockSize = iconContainerClone.style.width.split("px")[0]/100;
  const array = Array.from({length: 101}, (element, id) => id);
  const blocksX = array.map((element) => Math.round(element*blockSize) + parseInt(iconContainerClone.style.left.split("px")[0]));
  const blocksY = array.map((element) => Math.round(element*blockSize) + parseInt(iconContainerClone.style.top.split("px")[0]));
  iconContainerClone.onmousemove = (event) => {
    if(!imgPreview.className){
      if (blocksX[Math.round((event.pageX - leftAdjust - parseInt(iconContainerClone.style.left.split("px")[0]))/blockSize)]+imgPreview.width <= blocksX[blocksX.length -1] + 1){
        imgPreview.style.left = blocksX[Math.floor((event.pageX - leftAdjust - parseInt(iconContainerClone.style.left.split("px")[0]))/blockSize)] + "px";
      } else {
        imgPreview.style.left = blocksX[blocksX.length - 1 - Math.round(imgPreview.width/blockSize)] + "px";
      }
      if (blocksY[Math.round((event.pageY - parseInt(iconContainerClone.style.top.split("px")[0]))/blockSize)]+imgPreview.height <= blocksY[blocksY.length -1] + 1){
        imgPreview.style.top = blocksY[Math.floor((event.pageY - parseInt(iconContainerClone.style.top.split("px")[0]))/blockSize)] + "px";
      } else {
        imgPreview.style.top = blocksY[blocksX.length - 1 - Math.round(imgPreview.height/blockSize)] + "px";
      } 
    }  
  }


  if(!document.getElementById("buy-grid")){
    uploadSection.appendChild(iconContainerClone);
  }
  uploadSection.style.display = "block";
  document.getElementById("icon").click();
  iconContainerClone.onclick = (event) => {
    let validPosition = true;
    if(imgPreview.src != "" && !imgPreview.className){
      let firstXblock = blocksX.indexOf(parseInt(imgPreview.style.left.split("px")[0]));
      let lastXblock = firstXblock + Math.round(imgPreview.width/blockSize) - 1;
      let firstYblock = blocksY.indexOf(parseInt(imgPreview.style.top.split("px")[0]));
      let lastYblock = firstYblock + Math.round(imgPreview.height/blockSize) - 1;
      unavailableBlocks.forEach((unavailable) => {
        if((firstXblock >= unavailable.columnBlocks[0] && firstXblock <= unavailable.columnBlocks[1]) || (lastXblock >= unavailable.columnBlocks[0] && lastXblock <= unavailable.columnBlocks[1])){
          if((firstYblock >= unavailable.rowBlocks[0] && firstYblock <= unavailable.rowBlocks[1]) || (lastYblock >= unavailable.rowBlocks[0] && lastYblock <= unavailable.rowBlocks[1])){
            alert("Invalid position");
            validPosition = false;
            return;
          }
        }      
      });
      if(validPosition){
        alert("The coords for the image are ([" + [firstXblock, lastXblock] + "], [" + [firstYblock, lastYblock] + "])");
        imgPreview.setAttribute("class", "no-drag");
        imgPreview.style.zIndex = 10;
      }
    }
  }
}



document.getElementById("icon-preview").onclick = (event) => {
  if(event.target.className){
    event.target.removeAttribute("class");
    event.target.style.zIndex = "unset";
  }
}

document.getElementById("icon").onchange = () => {
  let preview = document.getElementById('icon-preview');
  let file    = document.getElementById('icon').files[0];
  imageInfoCatcher(preview);
  let display  = new FileReader();

  display.onloadend = function () {
    preview.src = display.result;      
    
  }

  if (file) {
    display.readAsDataURL(file);
  } else {
    preview.src = "";
  }
}

function imageInfoCatcher (element) {
  element.onload = function () {
    let imgWidth = element.width;
    let imgHeight = element.height;
    let width = Math.round(Math.round(element.width/10)*10*sizeProportion);
    let height = Math.round(Math.round(element.height/10)*10*sizeProportion);
    element.width = width;
    element.height = height;
  }
  
}

window.onload = init();