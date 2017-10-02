// Static data. Will be from db
const iconsData = [
  {"title":"logo1.png", "name": "ico1", "width":100, "height":100, "position":{"X": 0, "Y": 0}, "link": "https://www.logo1.com", "description": "This is the logo1 description", "date": "2017-08-23"},
  {"title":"logo2.jpg", "name": "ico2", "width":100, "height":100, "position":{"X": 900, "Y": 900}, "link": "https://www.logo2.com", "description": "This is the logo2 description", "date": "2017-11-16"},
  {"title":"logo3.png", "name": "ico3", "width":250, "height":130, "position":{"X": 500, "Y": 500}, "link": "https://www.logo2.com", "description": "This is the logo3 description", "date": "1991-04-29"}
]


const infoSection = document.getElementById("info-section"),
    listSection = document.getElementById("list-section"),
    uploadSection = document.getElementById("upload-section"),
    gridSection = document.getElementById("grid-section"),
    listTable = document.getElementById("list-table"),
    infoContainer = document.getElementById("info-container"),
    unavailableBlocks = []  , //provisional
    iconsContainer = document.getElementById("icons-container"),
    imgPreviewContainer = document.getElementById("buy-grid"),
    gridContainer = document.getElementById("grid-container"),
    imgPreview = document.getElementById("icon-preview"),
    inputImg = document.getElementById("icon");
    display  = new FileReader(); 

// will wrap all functionality 
function init() {
  window.scrollTo(0, 0); //Always start at top of the page
  arrangeElement(iconsContainer, gridAttributes());
  setIcons(iconsContainer, iconsData);
  arrangeImgPreviewGrid();
  const imgGridBlocks = getImgGridBlocks(imgPreviewContainer);
  addEvent(document.getElementById("list"), "click", populateTable.bind(null, listTable, iconsData), listSection);
  addEvent(document.getElementById("home"), "click", undefined, gridSection);
  addEvent(document.getElementById("buy"), "click", browseImage, gridSection, uploadSection);
  addEvent(display, "loadend", () => imgPreview.src = display.result); 
  addEvent(inputImg, "change", loadImage);
  addEvent(imgPreview, "load", setImgPrevAttributes);
  addEvent(imgPreview, "click", unsetImgPreviewPosition);
  imgPreviewDragg(imgGridBlocks);  
  addEvent(imgPreviewContainer, "click", setImgPreviewPosition.bind(null, imgGridBlocks)); 
}

window.onload = init();



//helpers
function gridAttributes () {
  const grid = document.getElementById("grid").getBoundingClientRect();
  return ({
        "width": grid.width,
        "height": grid.height,
        "top": grid.top,
        "left": grid.left
      });
}

function arrangeElement (element, attributes) {
  Object.keys(attributes).forEach((attr) => {
    element.style[attr] = attributes[attr] + "px";
  })
}   

function setIcons (parentElement, elements) {
  const sizeProportion = getSizeProportion();
  elements.forEach((element) => {
    elementAttributes = {"type": "IMG", 
      "hasText": false, "text": "", 
      "attributes": [{"type": "src", "value": "uploads/"+element.title}, 
                    {"type": "width", "value": Math.round(Math.round(element.width/10)*10*sizeProportion)},
                    {"type": "height", "value": Math.round(Math.round(element.height/10)*10*sizeProportion)}
                    ]
    };

    let newIcon = populateElement(parentElement, elementAttributes);
    arrangeElement(newIcon, {"top": Math.round(element.position.X*sizeProportion), "left": Math.round(element.position.Y*sizeProportion)});
    makeElementBlocksUnavailable(element); //later not her but when buy blocks
    addEvent(newIcon, "click", populateInfo.bind(null, infoContainer, element), infoSection);
  });
} 

function getSizeProportion () {
  return document.getElementById("grid").width/1000;
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

function makeElementBlocksUnavailable (element) {
  //later will be a post request
  const blocks = getElementBlocks(element);
  unavailableBlocks.push({"columnBlocks": blocks.column, "rowBlocks": blocks.row})
}

function getElementBlocks (element) {
  const gridBlocks= Array.from({length: 100}, (_, id) => id),
    firstBlockXIndex = element.position.X/10,
    lastBlockXIndex = firstBlockXIndex + element.width/10 - 1,
    firstBlockYIndex = element.position.Y/10,
    lastBlockYIndex = firstBlockYIndex + element.height/10 - 1,
    elementColumnBlocks = Array.of(gridBlocks[firstBlockXIndex], gridBlocks[lastBlockXIndex]),
    elementRowBlocks = Array.of(gridBlocks[firstBlockYIndex], gridBlocks[lastBlockYIndex]);

  return {"column": elementColumnBlocks, "row": elementRowBlocks};
}  

function addEvent (element, type, fn = ()=>{}, ...section) {
  element.addEventListener(type, (event) => {
    showSection(...section);
    fn(event);
  })
}

function showSection(...elements) { 
  if(elements[0]){  
    Array.from(document.body.getElementsByTagName("section")).forEach((element) => element.style.display = "none");
    elements.forEach((element) => element.style.display = "block");
  }
}

function populateInfo (parentElement, data) {
  cleanElement(parentElement);
  populateElement(parentElement, {"type": "IMG", "hasText": false, "text": "", "attributes": [{"type": "src", "value": "uploads/"+data.title}]});
  populateElement(parentElement, {"type": "H1", "hasText": true, "text": data.name, "attributes": []});
  populateElement(parentElement, {"type": "P", "hasText": true, "text": data.description, "attributes": []});
  populateElement(parentElement, {"type": "A", "hasText": true, "text": data.link, 
                                  "attributes": [{"type": "href", "value": data.link}, {"type": "target", "value": "_blank"}]});
}

function cleanElement (element) { 
  while (element.lastChild) {
    element.removeChild(element.lastChild);
  }
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

function unsetImgPreviewPosition () {
  if(imgPreview.className){
    imgPreview.removeAttribute("class");
    imgPreview.style.zIndex = "unset";
  }
}

function browseImage() {
  cleanImgPreview();  
  inputImg.click(); //select image
}

function cleanImgPreview() {
  imgPreview.removeAttribute("src");
  imgPreview.removeAttribute("width");
  imgPreview.removeAttribute("height");
  unsetImgPreviewPosition();
}

function arrangeImgPreviewGrid() {
  const imgPreviewGridAttributes = gridAttributes();
  imgPreviewGridAttributes.left -= window.innerWidth >= 1150? 70 : 0;
  arrangeElement(imgPreviewContainer, imgPreviewGridAttributes);
}


function getImgGridBlocks(imgGrid) {
  const blockSize = imgGrid.style.width.split("px")[0]/100;
  const blocksX = Array.from({length: 101}, (_, block) => Math.round(block*blockSize) + parseInt(imgGrid.style.left.split("px")[0]));
  const blocksY = Array.from({length: 101}, (_, block) => Math.round(block*blockSize) + parseInt(imgGrid.style.top.split("px")[0]));
  return {"X": blocksX, "Y": blocksY, "size": blockSize};
}

function imgPreviewDragg(imgGridBlocks) {
  const leftAdjust = window.innerWidth >= 1150? 70 : 0;
  addEvent(imgPreviewContainer, "mousemove", setTempImgPreviewPosition.bind(null, imgGridBlocks.X, imgGridBlocks.Y, imgGridBlocks.size, leftAdjust));
}

function setTempImgPreviewPosition (blocksX, blocksY, blockSize, leftAdjust, event) {
  if(!imgPreview.className){ //className is added when user select imgPreview position
    imgPreview.style.left = tempImgPreviewLeftPosition(event, blocksX, blocksY, blockSize, leftAdjust) + "px";
    imgPreview.style.top = tempImgPreviewTopPosition(event, blocksX, blocksY, blockSize)  + "px";
  }
}

function tempImgPreviewLeftPosition (event, blocksX, blocksY, blockSize, leftAdjust) {
  if (blocksX[Math.round((event.pageX - leftAdjust - parseInt(imgPreviewContainer.style.left.split("px")[0]))/blockSize)]+imgPreview.width <= blocksX[blocksX.length -1] + 1){
    return blocksX[Math.floor((event.pageX - leftAdjust - parseInt(imgPreviewContainer.style.left.split("px")[0]))/blockSize)];
  }
  return blocksX[blocksX.length - 1 - Math.round(imgPreview.width/blockSize)];
}

function tempImgPreviewTopPosition (event, blocksX, blocksY, blockSize) {
  if (blocksY[Math.round((event.pageY - parseInt(imgPreviewContainer.style.top.split("px")[0]))/blockSize)]+imgPreview.height <= blocksY[blocksY.length -1] + 1){
    return blocksY[Math.floor((event.pageY - parseInt(imgPreviewContainer.style.top.split("px")[0]))/blockSize)];
  }    
  return blocksY[blocksX.length - 1 - Math.round(imgPreview.height/blockSize)];
}

function setImgPreviewPosition (imgGridBlocks){
  if(imgPreview.src != "" && !imgPreview.className){  
    const imgPrevBlocks = getImgPrevBlocks(imgGridBlocks);
    if(validPosition(...imgPrevBlocks)){
      alert("The coords for the image are ([" + [imgPrevBlocks[0], imgPrevBlocks[1]] + "], [" + [imgPrevBlocks[2], imgPrevBlocks[3]] + "])");
      freezeImgPreview();
    } else{
      alert("Invalid Position");        
    }
  }
}

function getImgPrevBlocks(imgGridBlocks) {
  const firstXblock = imgGridBlocks.X.indexOf(parseInt(imgPreview.style.left.split("px")[0])),
   lastXblock = firstXblock + Math.round(imgPreview.width/imgGridBlocks.size) - 1,
   firstYblock = imgGridBlocks.Y.indexOf(parseInt(imgPreview.style.top.split("px")[0])),
   lastYblock = firstYblock + Math.round(imgPreview.height/imgGridBlocks.size) - 1;

   return [firstXblock, lastXblock, firstYblock, lastYblock];
}

function freezeImgPreview() {
  imgPreview.setAttribute("class", "no-drag");
  imgPreview.style.zIndex = 10;
}

function validPosition(firstXblock, lastXblock, firstYblock, lastYblock) {
  return unavailableBlocks.every((unavailable) => validBlockPosition(unavailable, firstXblock, lastXblock, firstYblock, lastYblock));
}

function validBlockPosition(unavailable, firstXblock, lastXblock, firstYblock, lastYblock) {
  if((firstXblock >= unavailable.columnBlocks[0] && firstXblock <= unavailable.columnBlocks[1]) || (lastXblock >= unavailable.columnBlocks[0] && lastXblock <= unavailable.columnBlocks[1])){
    if((firstYblock >= unavailable.rowBlocks[0] && firstYblock <= unavailable.rowBlocks[1]) || (lastYblock >= unavailable.rowBlocks[0] && lastYblock <= unavailable.rowBlocks[1])){
      return false;
    }
  }
  return true;
}

function setImgPrevAttributes() {
  const sizeProportion = getSizeProportion(),
   width = Math.round(Math.round(imgPreview.width/10)*10*sizeProportion),
   height = Math.round(Math.round(imgPreview.height/10)*10*sizeProportion);

  imgPreview.width = width;
  imgPreview.height = height;
}

function loadImage() {
  const img = inputImg.files[0];
  if(img) {
    display.readAsDataURL(img);
  }
}