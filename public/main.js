//INIT
let path = window.location.pathname.slice(1);
let ratio = 1;
const approvedIcons = {"icons": []},
    allIcons = {"icons": []},
    unavailableBlocks = [],
    countdownIntervals = [],
    infoSection = getElement("info-section"),
    listSection = getElement("list-section"),
    feedSection = getElement("feed"),
    subsSection = getElement("subscribe-wrapper"),
    uploadSection = getElement("upload-section"),
    invalidSection = getElement("invalid-section"),
    gridSection = getElement("grid-section"),
    listTable = getElement("list-table"),
    infoContainer = getElement("info-container"),
    iconsContainer = getElement("icons-container"),
    imgPreviewContainer = getElement("buy-grid"),
    gridContainer = getElement("grid-container"),
    imgPreview = getElement("icon-preview"),
    inputImg = getElement("icon"),
    gridAttr = gridAttributes(),
    display  = new FileReader(); 


//Routes function. Handle diff routes

function router(path) {
  if(path == "") {
    history.replaceState({title:"IcoWall-Home", url:"home"}, "IcoWall-Home", "home");    
  }else if(path == "home") {
    getElement("home").click();    
  }else if(path == "list") {
    getElement("list").click();    
  }else if(path == "profile") {
    getElement("account").click();    
  }else if(path == "buy") {
    getElement("buy").click();    
  }else if(path.split("_")[0] == "ico") {   
    ajaxRequest('GET', '/api/getIcon?id='+path.split("_")[1], null, (res, err) => {
      if(err){
        showSection(invalidSection);
        return;
      }
      populateInfo (infoContainer, JSON.parse(this.responseText).icon);
      showSection(infoSection);
    })
  }else if(path == "emailverification") {
    const queue = window.location.href.split("?")[1];
    ajaxRequest('PUT', '/api/emailverification?'+queue, null, (res, err) => {
      if(err){
        swal("Ooos!", err, "error");
        history.replaceState({title:"IcoWall-Home", url:"home"}, "IcoWall-Home", "home");
        return;
      }
      swal("Awesome!", "You're email was verified. Now login to your account", "success");
    })
  }else if(path == "passwordrecovery") {
    const queue = window.location.href.split("?")[1];
    ajaxRequest('GET', '/api/passwordrecovery?'+queue, null, (res, err) => {
      if(err){
        swal("Ooos!", err, "error");
        history.replaceState({title:"IcoWall-Home", url:"home"}, "IcoWall-Home", "home");
        return;
      }
      elementVisibility([{id:"password-recovery-modal", visibility: "block"}])
    }) 
  } else {
    showSection(invalidSection);    
  }
}

//Everytime the url change call the route function
window.onpopstate = function(event) {
  router(window.location.pathname.slice(1));
}

//Common Functions -------------------------------------------------------------------------------

function getElement(id) {
  return document.getElementById(id)
}

function ajaxRequest(type, url, parameters, callback) {
  const httpRequest = new XMLHttpRequest(); 
  httpRequest.open(type, url, false);
  httpRequest.onreadystatechange = function () {
    if(this.readyState === 4){
      if(this.status < 400) {
        callback(JSON.parse(this.responseText).message, null);
      }else{
        callback(null, JSON.parse(this.responseText).message);
      }
    }
  };
  httpRequest.setRequestHeader("Content-type", "application/json");
  httpRequest.withCredentials = true;
  if(type=='POST' || type=='PUT') {
    httpRequest.send(JSON.stringify(parameters));
  }
  httpRequest.send();
}

function modifyHtml(elements) {
  elements.forEach((element) => {
    getElement(element.id).innerHTML = element.content;
  })
}

function elementVisibility(ids, visibility) {
  ids.forEach((id, idx) => {
    getElement(id).style.display = visibility[idx];
  })
}

function addEvent (element, type, fn = ()=>{}, ...section) {
  element.addEventListener(type, (event) => {
    showSection(...section);
    fn(event);
  })
}

//check if info not registered already
function checkUniqueFields(parameter) {
    const input = getElement(parameter);
    if (checkUniqueness(parameter, input)) {
      return true;
    }
    return false;
}

//Check function used on form submition 
function checkEmailFormat(email) {
  const validEmail = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,63}$/.test(email.toLowerCase());
  return validEmail;
}

// check not empty
function checkFill(value) {
  if(value.length < 1) {
    return false;
  }
  return true;
}

// check no space on username
function checkSpace(value) {
  const validEmail = /\s/.test(value);
  return validEmail;
}

function checkPasswordConfirmation() {
  const password = getElement("password"),
    passwordConfirmation = getElement("password-confirmation");
    if(password.value != passwordConfirmation.value){
      passwordNotEqual(password, passwordConfirmation);
      return false;
    }
    return true;
}

// Clean if password confirmation are not equal
function passwordNotEqual(field1, field2){
  field1.value = "";
  field2.value = "";
}

// check password and password confirmation are equal
function checkPasswordConfirmationReset() {
  const password = getElement("new-password-reset"),
    passwordConfirmation = getElement("confirm-password-reset");
    if(password.value != passwordConfirmation.value){
      passwordNotEqual(password, passwordConfirmation);
      return false;
    }
    return true;
}

//Get actual state of the app (users, icons, reserved icons) ---------------------------------------

function getUniqueUsers() {
  ajaxRequest('GET', '/api/getUniqueUsers', null, (res, err) => {
    if(err){
      swal("Ooos!", err, "error");
      return;
    }
    modifyHtml([{id: "user-counter", content: "Unique visitors today: " + res}])
  })
} 

function getApprovedIcons() {
  ajaxRequest('GET', '/api/getapprovedicons', null, (res, err) => {
    if(err){
      swal("Ooos!", err, "error");
      return;
    }
    approvedIcons.icons = res;
  })
}

function getAllIcons() {
  ajaxRequest('GET', '/api/getallicons', null, (res, err) => {
    if(err){
      swal("Ooos!", err, "error");
      return;
    }
    allIcons.icons = res;
    showReservePixelsPlaceholder(allIcons);
  })
}

function showReservePixelsPlaceholder(allIcons) {
  allIcons.icons.forEach((icon, id, array) => {
    if(!icon.approved){
      array[id].filename = "img/reserved.png";
    }
  })
}

// will wrap all functionality 
function init() {
  window.scrollTo(0, 0); //Always start at top of the page
  getUniqueUsers();
  getApprovedIcons();
  getAllIcons();
  arrangeElement(iconsContainer, gridAttr);
  populateHome(null);
  arrangeImgPreviewGrid();
  const imgGridBlocks = getImgGridBlocks(imgPreviewContainer);
  addEvent(getElement("list"), "click", populateTable.bind(null, listTable, approvedIcons["icons"], false), listSection);
  addEvent(getElement("home"), "click", populateHome.bind(null, {title: "IcoWall-Home", url: "home"}), gridSection, feedSection, subsSection);
  addEvent(getElement("account"), "click", isLogged, gridSection);
  addEvent(getElement("buy"), "click", browseImage, gridSection, feedSection, subsSection);
  addEvent(display, "loadend", () => imgPreview.src = display.result); 
  addEvent(inputImg, "change", loadImage);
  addEvent(imgPreview, "load", setImgPrevAttributes);
  addEvent(imgPreview, "click", unsetImgPreviewPosition);
  imgPreviewDragg(imgGridBlocks);  
  addEvent(imgPreviewContainer, "click", setImgPreviewPosition.bind(null, imgGridBlocks)); 
  addEvent(getElement("ico-registration-submit"), "click", iconRegistration.bind(null, imgGridBlocks));
}


//clean home and set icons
function populateHome(obj) {
  if(obj && window.location.pathname.slice(1)!=obj.url) {
    history.pushState(obj, obj.title, obj.url);
    const path = window.location.pathname.slice(1);
    
  }
  cleanElement(iconsContainer);
  setIcons(iconsContainer, approvedIcons["icons"]);
}


//Get the grid width, height, top and left pixel position. Those depends on the screen. Widht = Height
function gridAttributes () {
  const grid = getElement("grid").getBoundingClientRect();
  let width = grid.width,
      height = grid.height,
      top = grid.top,
      left = grid.left;
  if(window.innerWidth > 1150) { 
    width = grid.height; //Adapts to the screen height
  } else {
    height = grid.width; //Adapts to the screen width
    top = 150; //Top margin
  }
  if(grid.width == 0){
    left = grid.left - width/2; //left margin
  }
  return ({
        "width": width,
        "height": height,
        "top": top,
        "left": left
      });
}

//Set the position of an element in the grid
function arrangeElement (element, attributes) {
  Object.keys(attributes).forEach((attr) => {
    element.style[attr] = attributes[attr] + "px";
  })
}   


//create html icon elements and set position on the grid
function setIcons (parentElement, elements) {
  const sizeProportion = getSizeProportion();
  const blockProperties = getImgGridBlocks(iconsContainer);
  elements.forEach((element, id) => {
    elementAttributes = {"type": "IMG", 
      "hasText": false, "text": "", 
      "attributes": [{"type": "src", "value": element.filename},
                    {"type": "width", "value": element.columnSize*blockProperties.size},
                    {"type": "height", "value": element.rowSize*blockProperties.size}
                    ]
    };
    let newIcon = populateElement(parentElement, elementAttributes);
    arrangeElement(newIcon, {"top": Math.round(element.rows[0]*blockProperties.size), "left": Math.round(element.columns[0]*blockProperties.size)});
    makeElementBlocksUnavailable(element); //Set unavaiable block on the buy grid
    addEvent(newIcon, "click", populateInfo.bind(null, infoContainer, element, id), infoSection); //Show icon info on click
    addEvent(newIcon, "mousemove", setTitlePosition.bind(null)); //Set the position of the mouseover title
    addEvent(newIcon, "mouseover", showTitle.bind(null, element)); //Set the content of the mouseover title
  });
} 

function setTitlePosition(event) {
  getElement("hover-title").style.left = event.pageX + 5 + "px";
  getElement("hover-title").style.top = event.pageY + 5 + "px";
}

function showTitle(element, event) {
  event.stopPropagation();
  getElement("hover-title").innerHTML = "<p>" + element.name + "</p>";
  getElement("hover-title").style.display = "block";
}


//Calculate the width of the square sections of the grid (1000*1000 px)
function getSizeProportion () {
  return getElement("grid").width/1000;
}


//Create a new html element and add it to an existing on the DOM
function populateElement (parentElement, options) {
  let newElement = createElement(options);
  appendElement(parentElement, newElement);
  return newElement;
}

//Create an html element
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

//Add an html element inside another
function appendElement (parentElement, childElement) {
  parentElement.appendChild(childElement);
}

function makeElementBlocksUnavailable (element) {
  unavailableBlocks.push({"columnBlocks": element.columns, "rowBlocks": element.rows})
}



/////check this one
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



//Show sections on the DOM
function showSection(...elements) { 
  if(elements[0]){  
    let isFeed = false;
    Array.from(document.body.getElementsByTagName("section")).forEach((element) => element.style.display = "none"); //Hide all sections on the DOM
    elements.forEach((element) => {
        element.style.display = "block";
        getElement("tools").style.display = "none";
        if(window.innerWidth < 1150) {
          isFeed = true;
          getElement("feed").style.display = "none"; //On mobile it doesnt show twitter feed
        }
        if(element.id == "feed"){
          isFeed = true;
        }
    })
    if(isFeed){
      getElement("user").style.display = "block";
    } else {
      getElement("user").style.display = "none"; //if not twitter feed, not user counter
    }
  }
}

function populateInfo (parentElement, data, id, event) {
  //update url and add to history
  if(window.location.pathname.slice(1)!="ico_" + data._id) {
    const listObj = {title: "IcoWall-Icon", url: "ico_" + data._id};
    history.pushState(listObj, listObj.title, listObj.url);
    const path = window.location.pathname.slice(1);
    
  }
  if(event){
    event.stopPropagation();
  }
  getElement("hover-title").style.display = "none";
  const web = data.web.split("//");
  cleanElement(parentElement);
  populateElement(parentElement, {"type": "IMG", "hasText": false, "text": "", "attributes": [{"type": "src", "value": data.filename}]});
  populateElement(parentElement, {"type": "H1", "hasText": true, "text": data.name, "attributes": []});
  populateElement(parentElement, {"type": "A", "hasText": true, "text": data.web, 
                                  "attributes": [{"type": "href", "value": "http://"+web[web.length-1]}, {"type": "target", "value": "_blank"}]});
  populateElement(parentElement, {"type": "DIV", "hasText": false, "text": "", "attributes": [{"type": "id", "value": "countdown"}]});
  populateElement(parentElement, {"type": "P", "hasText": true, "text": data.description, "attributes": []}); 
  let social = populateElement(parentElement, {"type": "DIV", "hasText": false, "text": "", "attributes": [{"type": "class", "value": "social-accounts"}]}); 
  for (const account in data.social){
    const link = data.social[account].split("//");
    if(data.social[account]){
      populateElement(social, {"type": "A", "hasText": false, "text": "", "attributes": [
                                {"type": "href", "value": "http://"+link[link.length-1]}, {"type": "class", "value": "fa fa-" + account + " accounts"}, {"type": "target", "value": "_blank"}]}); 
    }
  }
  const start = counter(data.date);
  if(start.total>=0){
    refreshClock(start);
    initializeClock(data.date);
  }else{
    refreshClock(counter(data.dateFinish));
    initializeClock(data.dateFinish);
  }
  
}

// initialize clock for icon info
function initializeClock(icoDate){
  clearInterval(countdownIntervals[0]);
  let timeinterval = setInterval(function(){ 
  let timeInfo = counter(icoDate); 
    refreshClock(timeInfo);
    if(timeInfo.total<=0 || isNaN(timeInfo.total)){   
      clearInterval(timeinterval);
    }
  },1000);
  countdownIntervals[0] = timeinterval;
}

function counter(icoDate) {
  const remaining = Date.parse(icoDate) - Date.parse(new Date())
  const dateInfo = { "total": remaining,
    "seconds": Math.floor((remaining/1000) % 60 )>=10?Math.floor((remaining/1000) % 60 ) : '0'+Math.floor((remaining/1000) % 60 ),
    "minutes": Math.floor( (remaining/1000/60) % 60 )>=10?Math.floor( (remaining/1000/60) % 60 ) : '0'+Math.floor( (remaining/1000/60) % 60 ),
    "hours": Math.floor( (remaining/(1000*60*60)) % 24 )>=10?Math.floor( (remaining/(1000*60*60)) % 24 ) : '0'+Math.floor( (remaining/(1000*60*60)) % 24 ),
    "days": Math.floor( remaining/(1000*60*60*24) )>=10?Math.floor( remaining/(1000*60*60*24) ) : '0'+Math.floor( remaining/(1000*60*60*24) )
  }
  return dateInfo;
}

function refreshClock(t) {
  console.log(t)
  let clock = getElement("countdown");
  if(t.total>=0 && !isNaN(t.total)){
  clock.innerHTML = "<div class='date-element-wraper'>\
            <div class='date-number'>" + t.days + "</div>\
          <h3 class='date-title'>DAYS</h3>\
          </div>\
          <div class='date-separator'>:</div>\
          <div class='date-element-wraper'>\
              <div class='date-number'>" + t.hours + "</div>\
            <h3 class='date-title'>HOURS</h3>\
          </div>\
          <div class='date-separator'>:</div>\
          <div class='date-element-wraper'>\
              <div class='date-number'>" + t.minutes + "</div>\
            <h3 class='date-title'>MINUTES</h3>\
          </div>\
          <div class='date-separator'>:</div>\
          <div class='date-element-wraper'>\
              <div class='date-number'>" + t.seconds + "</div>\
            <h3 class='date-title'>SECONDS</h3>\
          </div>";
  } else{
    clock.innerHTML = "<div class='date-element-wraper'>\
            <div class='date-number'>00</div>\
          <h3 class='date-title'>DAYS</h3>\
          </div>\
          <div class='date-separator'>:</div>\
          <div class='date-element-wraper'>\
              <div class='date-number'>00</div>\
            <h3 class='date-title'>HOURS</h3>\
          </div>\
          <div class='date-separator'>:</div>\
          <div class='date-element-wraper'>\
              <div class='date-number'>00</div>\
            <h3 class='date-title'>MINUTES</h3>\
          </div>\
          <div class='date-separator'>:</div>\
          <div class='date-element-wraper'>\
              <div class='date-number'>00</div>\
            <h3 class='date-title'>SECONDS</h3>\
          </div>";
  }
}

// remove element from DOM
function cleanElement (element) { 
  while (element.lastChild) {
    element.removeChild(element.lastChild);
  }
} 

function fillDate(value) {
  const date = value<10?"0"+value:value;
  return date;
}

function populateTable (parentElement, data, profile) {
  if(!profile && window.location.pathname.slice(1)!='list') {
    const listObj = {title: "IcoWall-List", url: "list"};
    history.pushState(listObj, listObj.title, listObj.url);
    const path = window.location.pathname.slice(1);
    
  }
  if (parentElement.lastChild.localName != "tr" && data.length > 0){
    data.forEach((element,id) => {
      let description = element.description.length>144?element.description.slice(0,145)+"..." : element.description;
      let date = new Date(element.date);
      let newRow = populateElement(parentElement, {"type": "TR", "hasText": false, "text": "", "attributes": []});
      let imgColumn = populateElement(newRow, {"type": "TD", "hasText": false, "text": "", "attributes": [{"type": "class", "value": "img-column"}]});
      populateElement(imgColumn, {"type": "IMG", "hasText": false, "text": "", "attributes": [{"type": "src", "value": element.filename}]});
      populateElement(newRow, {"type": "TD", "hasText": true, "text": element.name, "attributes": [{"type": "class", "value": 'name-col'}]});
      if(!profile) {
        populateElement(newRow, {"type": "TD", "hasText": true, "text": description, "attributes": [{"type": "class", "value": 'description-col'}]});
      }
      populateElement(newRow, {"type": "TD", "hasText": true, "text": ""+fillDate(date.getUTCMonth()+1)+"-"+fillDate(date.getUTCDate())+"-"+date.getUTCFullYear(), "attributes": [{"type": "class", "value": 'date-col'}]});
      if(profile) {
        populateElement(newRow, {"type": "TD", "hasText": true, "text": element.totalBlocks, "attributes": []});
        populateElement(newRow, {"type": "TD", "hasText": true, "text": element.cost_btc+"_BTC - "+element.cost_eth+"_ETH", "attributes": []});
        populateElement(newRow, {"type": "TD", "hasText": true, "text": element.approved?"Approved":"Pending", "attributes": []});
      }
      imgColumn.onclick = (event) => {
          populateInfo(infoContainer, element, id, event);
          listSection.style.display = "none";
          infoSection.style.display = "block";
      
      }
    });
  }
}

//unfreeze preview image
function unsetImgPreviewPosition () {
  if(imgPreview.className){
    imgPreview.removeAttribute("class");
    imgPreview.style.zIndex = "unset";
  }
}

//select image from user local
function browseImage() {
  if(!checkSession().logged){
    getElement("account").click();
    return;
  }
  getElement("ratio").className = "";
  getElement("no-ratio").className = "hide-scale-option";
  cleanImgPreview(); 
  populateHome({title: "IcoWall-Buy", url: "buy"});
  inputImg.click(); //select image
}

//no image to upload
function cleanImgPreview() {
  imgPreview.removeAttribute("src");
  imgPreview.removeAttribute("width");
  imgPreview.removeAttribute("height");
  unsetImgPreviewPosition();
}

//set buy grid properties based on grid
function arrangeImgPreviewGrid() {
  const imgPreviewGridAttributes = gridAttributes();
  imgPreviewGridAttributes.left -= window.innerWidth >= 1150? 70 : 0;
  uploadSection.style.height = window.innerWidth >= 1150? "100%" : window.getComputedStyle(gridSection, null).height;
  arrangeElement(imgPreviewContainer, imgPreviewGridAttributes);
}

//generate array with each block of the grid position
function getImgGridBlocks(imgGrid) {
  const blockSize = imgGrid.style.width.split("px")[0]/100;
  const blocksX = Array.from({length: 101}, (_, block) => Math.round(block*blockSize) + parseInt(imgGrid.style.left.split("px")[0]));
  const blocksY = Array.from({length: 101}, (_, block) => Math.round(block*blockSize) + parseInt(imgGrid.style.top.split("px")[0]));
  return {"X": blocksX, "Y": blocksY, "size": blockSize};
}

//move preview image with mouse position
function imgPreviewDragg(imgGridBlocks) {
  const leftAdjust = window.innerWidth >= 1150? 70 : 0;
  addEvent(imgPreviewContainer, "mousemove", setTempImgPreviewPosition.bind(null, imgGridBlocks.X, imgGridBlocks.Y, imgGridBlocks.size, leftAdjust));
}

//it set the preview image top and left position (not position selected)
function setTempImgPreviewPosition (blocksX, blocksY, blockSize, leftAdjust, event) {
  if(!imgPreview.className){ //className is added when user select imgPreview position
    imgPreview.style.left = tempImgPreviewLeftPosition(event, blocksX, blocksY, blockSize, leftAdjust) + "px";
    imgPreview.style.top = tempImgPreviewTopPosition(event, blocksX, blocksY, blockSize)  + "px";
  }
}

//set preview image left position 
function tempImgPreviewLeftPosition (event, blocksX, blocksY, blockSize, leftAdjust) {
  if (blocksX[Math.round((event.pageX - leftAdjust - parseInt(imgPreviewContainer.style.left.split("px")[0]))/blockSize)]+imgPreview.width <= blocksX[blocksX.length -1] + 1){
    return blocksX[Math.floor((event.pageX - leftAdjust - parseInt(imgPreviewContainer.style.left.split("px")[0]))/blockSize)];
  }
  return blocksX[blocksX.length - 1 - Math.round(imgPreview.width/blockSize)];
}

//set preview image top position 
function tempImgPreviewTopPosition (event, blocksX, blocksY, blockSize) {
  if (blocksY[Math.round((event.pageY - parseInt(imgPreviewContainer.style.top.split("px")[0]))/blockSize)]+imgPreview.height <= blocksY[blocksY.length -1] + 1){
    return blocksY[Math.floor((event.pageY - parseInt(imgPreviewContainer.style.top.split("px")[0]))/blockSize)];
  }    
  return blocksY[blocksX.length - 1 - Math.round(imgPreview.height/blockSize)];
}

//after click on a valid block, select the upload image coordinates
function setImgPreviewPosition (imgGridBlocks){
  if(imgPreview.src != "" && !imgPreview.className){ 
    const period = getElement("rent-weeks").value>1? " Weeks":" Week"; 
    const imgPrevBlocks = getImgPrevBlocks(imgGridBlocks);
    const cost = blockCost();
    if(validPosition(...imgPrevBlocks)){
      getElement("buy-modal").style.display = "block";
      getElement("position-info").innerHTML = "Position: X[" + imgPrevBlocks[0] + "-" + imgPrevBlocks[1] + "], Y[" + imgPrevBlocks[2] + "-" + imgPrevBlocks[3] + "]\
      <br>Total blocks: " + ((imgPrevBlocks[1] - imgPrevBlocks[0] + 1) * (imgPrevBlocks[3] - imgPrevBlocks[2] + 1)) 
      + "<br>Block cost per week: " + cost.btc + " BTC<br>"
      + cost.eth + " ETH"
      + "<br>Rent period: " + getElement("rent-weeks").value + period 
      + "<br><br>Total cost<br>" + ((imgPrevBlocks[1] - imgPrevBlocks[0] + 1) * (imgPrevBlocks[3] - imgPrevBlocks[2] + 1)*parseInt(getElement("rent-weeks").value)*cost.btc).toFixed(8) + " BTC"
      + "<br>" + ((imgPrevBlocks[1] - imgPrevBlocks[0] + 1) * (imgPrevBlocks[3] - imgPrevBlocks[2] + 1)*parseInt(getElement("rent-weeks").value)*cost.eth).toFixed(8) + " ETH";
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

//check if the selected position is not used or reserved compairing with unavailable blocks
function validPosition(firstXblock, lastXblock, firstYblock, lastYblock) {
  return unavailableBlocks.every((unavailable) => validBlockPosition(unavailable, firstXblock, lastXblock, firstYblock, lastYblock));
}

//check if position selected dont cause the preview image overlap a registered or reserved position
function validBlockPosition(unavailable, firstXblock, lastXblock, firstYblock, lastYblock) {
  if((firstXblock >= unavailable.columnBlocks[0] && firstXblock <= unavailable.columnBlocks[1]) || (lastXblock >= unavailable.columnBlocks[0] && lastXblock <= unavailable.columnBlocks[1]) || (firstXblock < unavailable.columnBlocks[0] && lastXblock > unavailable.columnBlocks[1])){
    if((firstYblock >= unavailable.rowBlocks[0] && firstYblock <= unavailable.rowBlocks[1]) || (lastYblock >= unavailable.rowBlocks[0] && lastYblock <= unavailable.rowBlocks[1]) || (firstYblock < unavailable.rowBlocks[0] && lastYblock > unavailable.rowBlocks[1])){
      return false;
    }
  }
  return true;
}

//set preview image width and height
function setImgPrevAttributes() {
  const sizeProportion = getSizeProportion(),
   colBlocks = Math.round(imgPreview.width/10)<=100?Math.round(imgPreview.width/10):100,//In a grid with 1000x1000px each block is 10px width. Normalize
   rowsBlocks = Math.round(imgPreview.height/10)<=100?Math.round(imgPreview.height/10):100,   
   width = Math.round(colBlocks*10*sizeProportion),
   height = Math.round(rowsBlocks*10*sizeProportion);
   ratio = colBlocks/rowsBlocks;
   setSizeToolsValues(colBlocks, rowsBlocks);

  imgPreview.width = width <= 1000*sizeProportion? width : Math.round(1000*sizeProportion);
  imgPreview.height = height <= 1000*sizeProportion? height : Math.round(1000*sizeProportion);
}


//update when change # of columns or rows
function updateImgPrevAttributes(colBlocks, rowsBlocks) {
  const sizeProportion = getSizeProportion();
  if(colBlocks){
    imgPreview.width = Math.round(colBlocks*10*sizeProportion);
    if(getElement("no-ratio").className){
      imgPreview.height = Math.round(Math.round(colBlocks/ratio)*10*sizeProportion);
      getElement("blocks-rows").value = Math.round(colBlocks/ratio);
    }
  }

  if(rowsBlocks){
    imgPreview.height = Math.round(rowsBlocks*10*sizeProportion);
    if(getElement("no-ratio").className){
      imgPreview.width = Math.round(Math.round(rowsBlocks*ratio)*10*sizeProportion);
      getElement("blocks-columns").value = Math.round(rowsBlocks*ratio);
    }
  }
}

//load selected image from user local machine
function loadImage() {
  const img = inputImg.files[0];
  if(img) {
    cleanElement(iconsContainer);
    showSection(gridSection, uploadSection)
    setIcons(iconsContainer, allIcons["icons"]); 
    display.readAsDataURL(img);
    getElement("feed").style.display = "none";
    getElement("tools").style.display = "block";
  }
}

//set initial values for colums and rows of preview image
function setSizeToolsValues(columns, rows){
  getElement("blocks-columns").value = columns;
  getElement("blocks-rows").value = rows;
}



// DB API --------------------------------------------------------------------------------------------------------

function iconRegistration(imgGridBlocks) {
  const formInfo = getElement("ico-registration-form"),
   formAccounts = getElement("form-accounts"),
   imgBlocks = getImgPrevBlocks(imgGridBlocks),  
   imgInfo = {
    "name": formInfo[0].value,
    "description": formInfo[1].value,
    "web": formInfo[2].value,
    "date": new Date(parseInt(formInfo[5].value),parseInt(formInfo[3].value)-1,parseInt(formInfo[4].value)),
    "dateFinish": new Date(parseInt(formInfo[8].value),parseInt(formInfo[6].value)-1,parseInt(formInfo[7].value)),
    "columnSize": getElement("blocks-columns").value,
    "rowSize": getElement("blocks-rows").value,
    "columns": [imgBlocks[0], imgBlocks[1]],
    "rows": [imgBlocks[2], imgBlocks[3]],
    "period": getElement("rent-weeks").value,
    "image": imgPreview.src,
    "facebook": formAccounts[0].value,
    "twitter": formAccounts[1].value,
    "github": formAccounts[2].value,
    "telegram": formAccounts[3].value,
    "bitcoin": formAccounts[4].value,
    "reddit": formAccounts[5].value,
    "slack": formAccounts[6].value
  };

  ajaxRequest('POST', '/api/upload', imgInfo, (res, err) => {
    if(err){
      swal("Something went wrong!", err, "error");
      return;
    }
    getElement("close-accounts").click();
    swal("Well done!", res, "success");
  })
}

function checkUniqueness(parameter, input) {
  let unique;
  ajaxRequest('POST', '/api/uniqueness', {"parameter": parameter, "value": input.value}, (res, err) => {
    if(err){
      input.style.border = "1px solid #E34234";
      swal("Ooops!", err, "warning");
      unique =  false;
    }
    input.style.border = "none";
    unique = true;
  })
  return unique;
}

function registerAccount() {
  let submit = true;
  let error = [];
  const form = getElement("signup-form");
  const userInfo = {
    "username": form[0].value,
    "email": form[1].value,
    "password": form[2].value
  }

  if(!checkFill(userInfo.username)){
    submit = false;
    error.push("Enter a username")
    form[0].style.border = "1px solid #E34234";
  }

  if(checkSpace(userInfo.username)){
    submit = false;
    error.push("Don't use spaces on your username");
    form[0].style.border = "1px solid #E34234";
  }

  if(!checkFill(userInfo.email)){
    submit = false;
    error.push("Enter a valid email");
    form[1].style.border = "1px solid #E34234";
  } else {
    if(!checkEmailFormat(userInfo.email)){
      submit = false;
      error.push("The email you provided is invalid");
      form[1].style.border = "1px solid #E34234";
    }
  }

  if(!checkFill(userInfo.password)){
    submit = false;
    error.push("Enter a password")
    form[2].style.border = "1px solid #E34234";
  }

  if(!checkFill(form[3].value)){
    submit = false;
    error.push("Confirm your password")
    form[3].style.border = "1px solid #E34234";
  }

  if(!checkPasswordConfirmation()){
    submit = false;
    error.push("The passwords didn't match"); 
  }
  

  if(!submit){
    swal("Watch out!", error.join(", "), "warning");
    return false;
  }

  ajaxRequest('POST', '/api/register', userInfo, (res, err) => {
    if(err){
      swal("Sorry!", err, "error");
    }
    getElement("close-login").click();
    swal("Great!", res, "success");
  })
}

function login() {
  let submit = true;
  const form = getElement("signin-form");
  const userInfo = {
    "username": form[0].value,
    "password": form[1].value
  }
  if(!checkFill(userInfo.username)){
    submit = false;
    form[0].style.border = "1px solid #E34234";
  }

  if(!checkFill(userInfo.password)){
    submit = false;
    form[1].style.border = "1px solid #E34234";
  }

  if(!submit){
    return false;
  }

  let httpRequest = new XMLHttpRequest();            
  httpRequest.open('POST', '/api/login', false);
  httpRequest.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      getElement("close-login").click();
      getElement("account").click();
    } else {
      if (this.status == 402) {
        swal({
          title: "Almost there!",
          text: JSON.parse(this.responseText).message, 
          icon: "success",
          buttons: {
            resend: {
              text: "Resend verification email",
              value: "resend",
            },
            Continue: true,
          }
      }).then((value) => {
          switch (value) {
            case "resend":
                resendVerificationEmail(form[0].value);
              break;         
            default:
              swal.close();
          }
        });
      } else{
        swal("Sorry!", JSON.parse(this.responseText).message, "error");
      }
      
    }
  };
  httpRequest.setRequestHeader("Content-type", "application/json");
  httpRequest.send(JSON.stringify(userInfo));
}

function resendVerificationEmail(username) {
  ajaxRequest('GET', '/api/resendVerificationEmail?username='+username, null, (res, err) => {
    if(err){
      swal("Sorry!", err, "error");
    }
    swal("Check your email", res, "success");
  })
}

function isLogged() {
  const session = checkSession();
  if(session.logged){
    if(window.location.pathname.slice(1)!='profile') {
      const profileObj = {title: "Icowall-Profile", url: "profile"};
      history.pushState(profileObj, profileObj.title, profileObj.url);
      const path = window.location.pathname.slice(1);
      
    }
    const blocks = getUserBlock();  
    getElement("profile-container").innerHTML = "<h1>"+session.user.username+"</h1>\
                                                        <h3>"+session.user.email+"</h3>";
    getElement("profile-table").innerHTML = "<tr>\
                                                        <th></th>\
                                                        <th>Name</th>\
                                                        <th>Date</th>\
                                                        <th>Blocks</th>\
                                                        <th>Cost</th>\
                                                        <th>Status</th>\
                                                      </tr>";
    populateTable(getElement("profile-table"), blocks, true);                                                   
    showSection(getElement("profile-section"));
    return;
  } 
  getElement("sign-modal").style.display="block";
}

function checkSession() {
  let status = {"logged": false, "user": {}};
  ajaxRequest('GET', '/api/logged', null, (res, err) => {
    if(res){
      status.logged = true;
      status.user = res;
    }
  })

  return status;
}

//get all block bought by user
function getUserBlock() {
  let blocks = {};
  ajaxRequest('GET', '/api/userblocks', null, (res, err) => {
    if(res){
      blocks = res;
    }
  })
  return blocks;
}

function signOut() {
  ajaxRequest('GET', '/api/signout', null, ()=>{})
  location.reload();  
}

function passwordReset() {
  if(!checkPasswordConfirmationReset()){
    return;
  }
  const resetInfo = {
    "password": getElement("password-recovery-form")[0].value
  }
  const queue = window.location.href.split("?")[1];
  ajaxRequest('POST', '/api/passwordreset?'+queue, resetInfo, (res, err) => {
    if(err){
      swal("Ooos!", err, "error");
      return;
    }
    swal("Great!", res, "success");
    getElement("close-password").click();
  })
}

function passwordResetEmail() {
  const email = {
    "email": getElement("password-reset-email-form")[0].value
  }
  ajaxRequest('POST', '/api/forgotpassword', email, (res, err) => {
    if(err){
      swal("Ooos!", err, "error");
      return;
    }
    swal("Good news!", res, "success");
    getElement("close-password").click();
  }) 
}

function blockCost() {
  let cost = 0;
  ajaxRequest('GET', '/api/blockcost', null, (res, err) => {
    if(err){
      swal("Sorry!", err, "error");
      getElement("home").click();
      return;
    }
    cost = res;
  }) 
  return cost;
}



// listeners (onclick, submit)
getElement("register-link").onclick = function(event) {
  getElement("login").style.display = "none";
  getElement("restore-password-email").style.display = "none";
  getElement("signup").style.display = "block";
}

getElement("logout").onclick = function(event) {
  signOut();
  getElement("home").click();
}

getElement("login-link").onclick = function(event) {
  getElement("signup").style.display = "none";
  getElement("restore-password-email").style.display = "none";
  getElement("login").style.display = "block";
}

getElement("forgot-password").onclick = function(event) {
  getElement("login").style.display = "none";
  getElement("signup").style.display = "none";
  getElement("restore-password-email").style.display = "block";
}

getElement("password-reset-email").onclick = function(event) {
  passwordResetEmail();
}

getElement("contact-submit").onclick = function(event) {
  submitContact();
}

getElement("contact").onclick = function(event) {
  getElement("contact-modal").style.display = "block";
}

getElement("grid-container").onmouseover = function() {
  getElement("hover-title").innerHTML = "";
  getElement("hover-title").style.display = "none";
}

getElement("icons-container").onmouseover = function() {
  getElement("hover-title").innerHTML = "<p>Rent block</p>";
  getElement("hover-title").style.display = "block";
}

getElement("icons-container").onmousemove = function(event) {
  getElement("hover-title").style.left = event.pageX + 5 + "px";
  getElement("hover-title").style.top = event.pageY + 5 + "px";
}

getElement("icons-container").onclick = function(event) {
  getElement("hover-title").style.display = "none";
  getElement("buy").click();
}

getElement("ratio").onclick = function(event) {
  getElement("ratio").className = "hide-scale-option";
  getElement("no-ratio").className = "";
}

getElement("no-ratio").onclick = function(event) {
  ratio = getElement("blocks-columns").value/getElement("blocks-rows").value;
  getElement("no-ratio").className = "hide-scale-option";
  getElement("ratio").className = "";
}

getElement("cancel-position").onclick = function(){
  getElement("buy-modal").style.display = "none";
}

getElement("accept-position").onclick = function(){
  getElement("position-confirmation").style.display = "none";
  getElement("icon-registration").style.display = "block";
}

getElement("ico-registration-next").onclick = function(){
  const formInfo = getElement("ico-registration-form");
  let error = [];
  let submit = true;
  
  if(!checkFill(formInfo[0].value)){
    submit = false;
    error.push("Enter an ICO name")
    formInfo[0].style.border = "1px solid #E34234";
  }

  if(!checkFill(formInfo[1].value)){
    submit = false;
    error.push("Enter an ICO description")
    formInfo[1].style.border = "1px solid #E34234";
  }

  if(!checkFill(formInfo[2].value)){
    submit = false;
    error.push("Enter an ICO website")
    formInfo[2].style.border = "1px solid #E34234";
  }

  if(formInfo[3].value=='0'){
    submit = false;
    error.push("Enter an ICO start month")
    formInfo[3].style.border = "1px solid #E34234";
  }

  if(formInfo[4].value=='0'){
    submit = false;
    error.push("Enter an ICO start day")
    formInfo[4].style.border = "1px solid #E34234";
  }

  if(formInfo[5].value=='0'){
    submit = false;
    error.push("Enter an ICO start year")
    formInfo[5].style.border = "1px solid #E34234";
  }

  if(!submit){
    swal("Watch out!", error.join(", "), "warning");
    return false;
  }
  getElement("icon-registration").style.display = "none";
  getElement("modal-content").className = "modal-content modal-accounts";
  getElement("icon-accounts").style.display = "block";
}

getElement("close-login").onclick = function(event) {
  getElement("sign-modal").style.display = "none";
  getElement("signup").style.display = "none";
  getElement("restore-password-email").style.display = "none";
  getElement("login").style.display = "block";
}

getElement("close-password").onclick = function(event) {
  getElement("password-recovery-modal").style.display = "none";
}

getElement("close-contact").onclick = function(event) {
  getElement("contact-modal").style.display = "none";
}

getElement("contact-modal").onclick = function(event) {
  getElement("contact-modal").style.display = "none";
} 

getElement("sign-modal").onclick = function(event) {
  getElement("sign-modal").style.display = "none";
  getElement("signup").style.display = "none";
  getElement("login").style.display = "block";
} 

getElement("close-buy").onclick = function(event) {
  getElement("buy-modal").style.display = "none";
  showSection(gridSection);
  getElement("icon-registration").style.display = "none";
  getElement("position-confirmation").style.display = "block";
  getElement("home").click();
}

getElement("close-accounts").onclick = function(event) {
  getElement("buy-modal").style.display = "none";
  showSection(gridSection);
  getElement("modal-content").className = "modal-content";
  getElement("icon-accounts").style.display = "none";
  getElement("position-confirmation").style.display = "block";
  getElement("home").click();
}

getElement("signup-submit").onclick = function(event) {
  const validUsername = checkUniqueFields("username")
  const validEmail = checkUniqueFields("email")
  if (validUsername && validEmail) {
    registerAccount();
  }
}

getElement("signin-submit").onclick = function(event) {
    login();
}

getElement("password-recovery-submit").onclick = function(event) {
    passwordReset();
}

getElement("blocks-columns").onchange = function (event) {
  updateImgPrevAttributes(getElement("blocks-columns").value);
}

getElement("blocks-rows").onchange = function (event) {
  updateImgPrevAttributes(null, getElement("blocks-rows").value);
}



//Initiate the application
window.onload = (function () {
  init();
  router(path);
})();