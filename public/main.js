

if(location.protocol==="http:"){
  window.location.replace("https://www.icowall.io");
}else{
   window.dataLayer = window.dataLayer || [];
   function gtag(){dataLayer.push(arguments);}
   gtag('js', new Date());
}

let path = window.location.pathname.slice(1);
let ratio = 1;

if(path == "emailverification") {
  const queue = window.location.href.split("?")[1];
  let httpRequest = new XMLHttpRequest();            
  httpRequest.open('PUT', '/api/emailverification?'+queue, false);
  httpRequest.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      swal("Awesome!", "You're email was verified. Now login to your account", "success");
    } else {
      swal("Ooos!", "Invalid URL", "error");
      history.replaceState({title:"IcoWall-Home", url:"home"}, "IcoWall-Home", "home");
    }
  };
  httpRequest.send();  
}

if(path == "passwordrecovery") {
  const queue = window.location.href.split("?")[1];
  let httpRequest = new XMLHttpRequest();            
  httpRequest.open('GET', '/api/passwordrecovery?'+queue, false);
  httpRequest.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById("password-recovery-modal").style.display = "block";
    } else {
      swal("Ooos!", "Invalid URL", "error");
      history.replaceState({title:"IcoWall-Home", url:"home"}, "IcoWall-Home", "home");
    }
  };
  httpRequest.send();  
}

const approvedIcons = {"icons": []};
const allIcons = {"icons": []}

function historySection(path) {
  if(path == "") {
    history.replaceState({title:"IcoWall-Home", url:"home"}, "IcoWall-Home", "home");
    gtag('config', 'UA-109487361-1');
  }else if(path == "home") {
    document.getElementById("home").click();
    gtag('config', 'UA-109487361-1');
  }else if(path == "list") {
    document.getElementById("list").click();
    gtag('config', 'UA-109487361-1');
  }else if(path == "profile") {
    document.getElementById("account").click();
    gtag('config', 'UA-109487361-1');
  }else if(path == "buy") {
    document.getElementById("buy").click();
    gtag('config', 'UA-109487361-1');
  }else if(path.split("_")[0] == "ico") {
    gtag('config', 'UA-109487361-1');
    let httpRequest = new XMLHttpRequest();            
    httpRequest.open('GET', '/api/getIcon?id='+path.split("_")[1], false);
    httpRequest.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        populateInfo (infoContainer, JSON.parse(this.responseText).icon);
        showSection(infoSection);
      }else{
        showSection(invalidSection);
      }
    };
    httpRequest.send();
  } else if(path == "emailverification" || path == "passwordrecovery") {
    gtag('config', 'UA-109487361-1');
    return;
  } else {
    showSection(invalidSection);
    gtag('config', 'UA-109487361-1');
  }
}

function getApprovedIcons() {
  let httpRequest = new XMLHttpRequest();            
  httpRequest.open('GET', '/api/getapprovedicons', false);
  httpRequest.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      approvedIcons.icons = JSON.parse(this.responseText).icons;
    } 
  };
  httpRequest.send();
}

function getAllIcons() {
  let httpRequest = new XMLHttpRequest();            
  httpRequest.open('GET', '/api/getallicons', false);
  httpRequest.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      allIcons.icons = JSON.parse(this.responseText).icons;
      allIcons.icons.forEach((icon, id, array) => {
        if(!icon.approved){
          array[id].filename = "img/reserved.png";
        }
      })
    } 
  };
  httpRequest.send();
}

const infoSection = document.getElementById("info-section"),
    listSection = document.getElementById("list-section"),
    feedSection = document.getElementById("feed"),
    subsSection = document.getElementById("subscribe-wrapper"),
    uploadSection = document.getElementById("upload-section"),
    invalidSection = document.getElementById("invalid-section"),
    gridSection = document.getElementById("grid-section"),
    listTable = document.getElementById("list-table"),
    infoContainer = document.getElementById("info-container"),
    unavailableBlocks = [], 
    iconsContainer = document.getElementById("icons-container"),
    imgPreviewContainer = document.getElementById("buy-grid"),
    gridContainer = document.getElementById("grid-container"),
    imgPreview = document.getElementById("icon-preview"),
    countdownIntervals = [],
    gridAttr = gridAttributes(),

    inputImg = document.getElementById("icon");
    display  = new FileReader(); 

// will wrap all functionality 
function init() {
  window.scrollTo(0, 0); //Always start at top of the page
  getApprovedIcons();
  getAllIcons();
  arrangeElement(iconsContainer, gridAttr);
  populateHome(null);
  arrangeImgPreviewGrid();
  const imgGridBlocks = getImgGridBlocks(imgPreviewContainer);
  addEvent(document.getElementById("list"), "click", populateTable.bind(null, listTable, approvedIcons["icons"], false), listSection);
  addEvent(document.getElementById("home"), "click", populateHome.bind(null, {title: "IcoWall-Home", url: "home"}), gridSection, feedSection, subsSection);
  addEvent(document.getElementById("account"), "click", isLogged, gridSection);
  addEvent(document.getElementById("buy"), "click", browseImage, gridSection, feedSection, subsSection);
  addEvent(document.getElementById("contact"), "click", contactUs.bind(null));
  addEvent(display, "loadend", () => imgPreview.src = display.result); 
  addEvent(inputImg, "change", loadImage);
  addEvent(imgPreview, "load", setImgPrevAttributes);
  addEvent(imgPreview, "click", unsetImgPreviewPosition);
  imgPreviewDragg(imgGridBlocks);  
  addEvent(imgPreviewContainer, "click", setImgPreviewPosition.bind(null, imgGridBlocks)); 
  addEvent(document.getElementById("ico-registration-submit"), "click", iconRegistration.bind(null, imgGridBlocks));
}

window.onload = (function () {
  init();
  historySection(path);
})();

window.onpopstate = function(event) {
  historySection(window.location.pathname.slice(1));
}

//helpers
function gridAttributes () {
  const grid = document.getElementById("grid").getBoundingClientRect();
  let width = grid.width,
      height = grid.height,
      top = grid.top,
      left = grid.left;
  if(window.innerWidth > 1150) {
    width = grid.height;
  } else {
    height = grid.width;
    top = 150;
  }
  if(grid.width == 0){
    left = grid.left - width/2;
  }
  return ({
        "width": width,
        "height": height,
        "top": top,
        "left": left
      });
}

function arrangeElement (element, attributes) {
  Object.keys(attributes).forEach((attr) => {
    element.style[attr] = attributes[attr] + "px";
  })
}   

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
    makeElementBlocksUnavailable(element); //later not her but when buy blocks
    addEvent(newIcon, "click", populateInfo.bind(null, infoContainer, element, id), infoSection);
    addEvent(newIcon, "mousemove", setTitlePosition.bind(null));
    addEvent(newIcon, "mouseover", showTitle.bind(null, element));
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
  unavailableBlocks.push({"columnBlocks": element.columns, "rowBlocks": element.rows})
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
    elements.forEach((element) => {
        element.style.display = "block";
        document.getElementById("tools").style.display = "none";
        if(window.innerWidth < 1150) {
          document.getElementById("feed").style.display = "none";
        }
    })
  }
}

function populateInfo (parentElement, data, id, event) {
  if(window.location.pathname.slice(1)!="ico_" + data._id) {
    const listObj = {title: "IcoWall-Icon", url: "ico_" + data._id};
    history.pushState(listObj, listObj.title, listObj.url);
    gtag('config', 'UA-109487361-1');
  }
  if(event){
    event.stopPropagation();
  }
  document.getElementById("hover-title").style.display = "none";
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
  refreshClock(counter(data.date));
  initializeClock(data.date);
}

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
  let clock = document.getElementById("countdown");
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
    gtag('config', 'UA-109487361-1');
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

function unsetImgPreviewPosition () {
  if(imgPreview.className){
    imgPreview.removeAttribute("class");
    imgPreview.style.zIndex = "unset";
  }
}

function browseImage() {
  if(!checkSession().logged){
    document.getElementById("account").click();
    return;
  }
  document.getElementById("ratio").className = "";
  document.getElementById("no-ratio").className = "hide-scale-option";
  cleanImgPreview(); 
  populateHome({title: "IcoWall-Buy", url: "buy"});
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
  uploadSection.style.height = window.innerWidth >= 1150? "100%" : window.getComputedStyle(gridSection, null).height;
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
    const period = document.getElementById("rent-weeks").value>1? " Weeks":" Week"; 
    const imgPrevBlocks = getImgPrevBlocks(imgGridBlocks);
    const cost = blockCost();
    if(validPosition(...imgPrevBlocks)){
      document.getElementById("buy-modal").style.display = "block";
      document.getElementById("position-info").innerHTML = "Position: X[" + imgPrevBlocks[0] + "-" + imgPrevBlocks[1] + "], Y[" + imgPrevBlocks[2] + "-" + imgPrevBlocks[3] + "]\
      <br>Total blocks: " + ((imgPrevBlocks[1] - imgPrevBlocks[0] + 1) * (imgPrevBlocks[3] - imgPrevBlocks[2] + 1)) 
      + "<br>Block cost per month: " + cost.btc + " BTC<br>"
      + cost.eth + " ETH"
      + "<br>Rent period: " + document.getElementById("rent-weeks").value + period 
      + "<br><br>Total cost<br>" + ((imgPrevBlocks[1] - imgPrevBlocks[0] + 1) * (imgPrevBlocks[3] - imgPrevBlocks[2] + 1)*parseInt(document.getElementById("rent-weeks").value)*cost.btc).toFixed(8) + " BTC"
      + "<br>" + ((imgPrevBlocks[1] - imgPrevBlocks[0] + 1) * (imgPrevBlocks[3] - imgPrevBlocks[2] + 1)*parseInt(document.getElementById("rent-weeks").value)*cost.eth).toFixed(8) + " ETH";
      // freezeImgPreview();
    }
  }
}

document.getElementById("cancel-position").onclick = function(){
  document.getElementById("buy-modal").style.display = "none";
}

document.getElementById("accept-position").onclick = function(){
  document.getElementById("position-confirmation").style.display = "none";
  document.getElementById("icon-registration").style.display = "block";
}

document.getElementById("ico-registration-next").onclick = function(){
  const formInfo = document.getElementById("ico-registration-form");
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
  document.getElementById("icon-registration").style.display = "none";
  document.getElementById("modal-content").className = "modal-content modal-accounts";
  document.getElementById("icon-accounts").style.display = "block";
}

function getImgPrevBlocks(imgGridBlocks) {
  const firstXblock = imgGridBlocks.X.indexOf(parseInt(imgPreview.style.left.split("px")[0])),
   lastXblock = firstXblock + Math.round(imgPreview.width/imgGridBlocks.size) - 1,
   firstYblock = imgGridBlocks.Y.indexOf(parseInt(imgPreview.style.top.split("px")[0])),
   lastYblock = firstYblock + Math.round(imgPreview.height/imgGridBlocks.size) - 1;

   return [firstXblock, lastXblock, firstYblock, lastYblock];
}

function blockCost() {
  let cost = 0;
  let httpRequest = new XMLHttpRequest();            
  httpRequest.open('GET', '/api/blockcost', false);
  httpRequest.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      cost = JSON.parse(this.responseText).message;
    } else {
      swal("Sorry!", JSON.parse(this.responseText).message, "error");
      document.getElementById("home").click();
    }
  };
  httpRequest.setRequestHeader("Content-type", "application/json");
  httpRequest.send();
  return cost;
}

function freezeImgPreview() {
  imgPreview.setAttribute("class", "no-drag");
  imgPreview.style.zIndex = 10;
}

function validPosition(firstXblock, lastXblock, firstYblock, lastYblock) {
  return unavailableBlocks.every((unavailable) => validBlockPosition(unavailable, firstXblock, lastXblock, firstYblock, lastYblock));
}

function validBlockPosition(unavailable, firstXblock, lastXblock, firstYblock, lastYblock) {
  if((firstXblock >= unavailable.columnBlocks[0] && firstXblock <= unavailable.columnBlocks[1]) || (lastXblock >= unavailable.columnBlocks[0] && lastXblock <= unavailable.columnBlocks[1]) || (firstXblock < unavailable.columnBlocks[0] && lastXblock > unavailable.columnBlocks[1])){
    if((firstYblock >= unavailable.rowBlocks[0] && firstYblock <= unavailable.rowBlocks[1]) || (lastYblock >= unavailable.rowBlocks[0] && lastYblock <= unavailable.rowBlocks[1]) || (firstYblock < unavailable.rowBlocks[0] && lastYblock > unavailable.rowBlocks[1])){
      return false;
    }
  }
  return true;
}

function setImgPrevAttributes() {
  const sizeProportion = getSizeProportion(),
   colBlocks = Math.round(imgPreview.width/10)<=100?Math.round(imgPreview.width/10):100;
   rowsBlocks = Math.round(imgPreview.height/10)<=100?Math.round(imgPreview.height/10):100;
   setSizeToolsValues(colBlocks, rowsBlocks);
   width = Math.round(colBlocks*10*sizeProportion),
   height = Math.round(rowsBlocks*10*sizeProportion);
  ratio = colBlocks/rowsBlocks;

  imgPreview.width = width <= 1000*sizeProportion? width : Math.round(1000*sizeProportion);
  imgPreview.height = height <= 1000*sizeProportion? height : Math.round(1000*sizeProportion);
}

function updateImgPrevAttributes(colBlocks, rowsBlocks) {
  const sizeProportion = getSizeProportion();
  if(colBlocks){
    imgPreview.width = Math.round(colBlocks*10*sizeProportion);
    if(document.getElementById("no-ratio").className){
      imgPreview.height = Math.round(Math.round(colBlocks/ratio)*10*sizeProportion);
      document.getElementById("blocks-rows").value = Math.round(colBlocks/ratio);
    }
  }

  if(rowsBlocks){
    imgPreview.height = Math.round(rowsBlocks*10*sizeProportion);
    if(document.getElementById("no-ratio").className){
      imgPreview.width = Math.round(Math.round(rowsBlocks*ratio)*10*sizeProportion);
      document.getElementById("blocks-columns").value = Math.round(rowsBlocks*ratio);
    }
  }
}

function loadImage() {
  const img = inputImg.files[0];
  if(img) {
    cleanElement(iconsContainer);
    showSection(gridSection, uploadSection)
    setIcons(iconsContainer, allIcons["icons"]); 
    display.readAsDataURL(img);
    document.getElementById("feed").style.display = "none";
    document.getElementById("tools").style.display = "block";
  }
}

function setSizeToolsValues(columns, rows){
  document.getElementById("blocks-columns").value = columns;
  document.getElementById("blocks-rows").value = rows;
}


document.getElementById("blocks-columns").onchange = function (event) {
  // console.log("new width" + document.getElementById("blocks-columns").value);
  updateImgPrevAttributes(document.getElementById("blocks-columns").value);
}

document.getElementById("blocks-rows").onchange = function (event) {
  // console.log("new width" + document.getElementById("blocks-columns").value);
  updateImgPrevAttributes(null, document.getElementById("blocks-rows").value);
}

function iconRegistration(imgGridBlocks) {
  const formInfo = document.getElementById("ico-registration-form");
  const formAccounts = document.getElementById("form-accounts");
  const imgBlocks = getImgPrevBlocks(imgGridBlocks);
  const imgInfo = {
    "name": formInfo[0].value,
    "description": formInfo[1].value,
    "web": formInfo[2].value,
    "date": new Date(parseInt(formInfo[5].value),parseInt(formInfo[3].value)-1,parseInt(formInfo[4].value)),
    "columnSize": document.getElementById("blocks-columns").value,
    "rowSize": document.getElementById("blocks-rows").value,
    "columns": [imgBlocks[0], imgBlocks[1]],
    "rows": [imgBlocks[2], imgBlocks[3]],
    "period": document.getElementById("rent-weeks").value,
    "image": imgPreview.src,
    "facebook": formAccounts[0].value,
    "twitter": formAccounts[1].value,
    "github": formAccounts[2].value,
    "telegram": formAccounts[3].value,
    "bitcoin": formAccounts[4].value,
    "reddit": formAccounts[5].value,
    "slack": formAccounts[6].value
  }

  let httpRequest = new XMLHttpRequest();            
  httpRequest.open('POST', '/api/upload', false);
  httpRequest.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById("close-accounts").click();
      swal("Well done!", JSON.parse(this.responseText).message, "success");
    } else {
      swal("Something went wrong!", JSON.parse(this.responseText).message, "error");
    }
  };
  httpRequest.setRequestHeader("Content-type", "application/json");
  httpRequest.withCredentials = true;
  httpRequest.send(JSON.stringify(imgInfo));
}





function modalOpen(modal) {
  modal.style.display = "block";
}

function modalClose(modal){
   modal.style.display = "none";
}

document.getElementById("close-login").onclick = function(event) {
  document.getElementById("sign-modal").style.display = "none";
  document.getElementById("signup").style.display = "none";
  document.getElementById("restore-password-email").style.display = "none";
  document.getElementById("login").style.display = "block";
}

document.getElementById("close-password").onclick = function(event) {
  document.getElementById("password-recovery-modal").style.display = "none";
}

document.getElementById("close-contact").onclick = function(event) {
  document.getElementById("contact-modal").style.display = "none";
}

document.getElementById("contact-modal").onclick = function(event) {
  document.getElementById("contact-modal").style.display = "none";
} 

document.getElementById("sign-modal").onclick = function(event) {
  document.getElementById("sign-modal").style.display = "none";
  document.getElementById("signup").style.display = "none";
  document.getElementById("login").style.display = "block";
} 

document.getElementById("close-buy").onclick = function(event) {
  document.getElementById("buy-modal").style.display = "none";
  showSection(gridSection);
  document.getElementById("icon-registration").style.display = "none";
  document.getElementById("position-confirmation").style.display = "block";
  document.getElementById("home").click();
}

document.getElementById("close-accounts").onclick = function(event) {
  document.getElementById("buy-modal").style.display = "none";
  showSection(gridSection);
  document.getElementById("modal-content").className = "modal-content";
  document.getElementById("icon-accounts").style.display = "none";
  document.getElementById("position-confirmation").style.display = "block";
  document.getElementById("home").click();
}

document.getElementById("signup-submit").onclick = function(event) {
  const validUsername = checkFields("username")
  const validEmail = checkFields("email")
  if (validUsername && validEmail) {
    registerAccount();
  }
}

document.getElementById("signin-submit").onclick = function(event) {
    login();
}

document.getElementById("password-recovery-submit").onclick = function(event) {
    passwordReset();
}

function checkFields(parameter) {
    const input = document.getElementById(parameter);
    if (checkUniqueness(parameter, input)) {
      return true;
    }
    return false;
}


function checkUniqueness(parameter, input) {
  let unique;
  let httpRequest = new XMLHttpRequest();            
  httpRequest.open('POST', '/api/uniqueness', false);
  httpRequest.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      input.style.border = "none";
      unique = true;
    } else {
      input.style.border = "1px solid #E34234";
      swal("Ooops!", JSON.parse(this.responseText).message, "warning");
      unique =  false;
    }
  };
  httpRequest.setRequestHeader("Content-type", "application/json");
  httpRequest.send(JSON.stringify({"parameter": parameter, "value": input.value}));
  return unique;
}

function checkPasswordConfirmation() {
  const password = document.getElementById("password"),
    passwordConfirmation = document.getElementById("password-confirmation");
    if(password.value != passwordConfirmation.value){
      passwordNotEqual(password, passwordConfirmation);
      return false;
    }
    return true;
}

function passwordNotEqual(field1, field2){
  // swal("Watch out!", "The password didn't match", "warning");
  field1.value = "";
  field2.value = "";
}

function registerAccount() {
  let submit = true;
  let error = [];
  const form = document.getElementById("signup-form");
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
    if(!checkEmail(userInfo.email)){
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

  let httpRequest = new XMLHttpRequest();            
  httpRequest.open('POST', '/api/register', false);
  httpRequest.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById("close-login").click();
      swal("Great!", JSON.parse(this.responseText).message, "success");
    } else {
      swal("Sorry!", JSON.parse(this.responseText).message, "error");
    }
  };
  httpRequest.setRequestHeader("Content-type", "application/json");
  httpRequest.send(JSON.stringify(userInfo));
}

function login() {
  let submit = true;
  const form = document.getElementById("signin-form");
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
      document.getElementById("close-login").click();
      document.getElementById("account").click();
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
  let httpRequest = new XMLHttpRequest();            
  httpRequest.open('GET', '/api/resendVerificationEmail?username='+username, false);
  httpRequest.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      swal("Check your email", "Your verification email was sent", "success");
    } else {
      swal("Sorry!", JSON.parse(this.responseText).message, "error");
    }
  };
  httpRequest.setRequestHeader("Content-type", "application/json");
  httpRequest.send();
}

function isLogged() {
  const session = checkSession();
  if(session.logged){
    if(window.location.pathname.slice(1)!='profile') {
      const profileObj = {title: "Icowall-Profile", url: "profile"};
      history.pushState(profileObj, profileObj.title, profileObj.url);
      gtag('config', 'UA-109487361-1');
    }
    const blocks = getUserBlock();  
    document.getElementById("profile-container").innerHTML = "<h1>"+session.user.username+"</h1>\
                                                        <h3>"+session.user.email+"</h3>";
    document.getElementById("profile-table").innerHTML = "<tr>\
                                                        <th></th>\
                                                        <th>Name</th>\
                                                        <th>Date</th>\
                                                        <th>Blocks</th>\
                                                        <th>Cost</th>\
                                                        <th>Status</th>\
                                                      </tr>";
    populateTable(document.getElementById("profile-table"), blocks, true);                                                   
    showSection(document.getElementById("profile-section"));
    return;
  } 
  document.getElementById("sign-modal").style.display="block";
}

function checkSession() {
  let status = {"logged": false, "user": {}};
  let httpRequest = new XMLHttpRequest();            
  httpRequest.open('GET', '/api/logged', false);
  httpRequest.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      status.logged = true;
      status.user = JSON.parse(this.responseText).user;
    } 
  };
  httpRequest.setRequestHeader("Content-type", "application/json");
  httpRequest.send();
  return status;
}

function getUserBlock() {
  let blocks = {};
  let httpRequest = new XMLHttpRequest();            
  httpRequest.open('GET', '/api/userblocks', false);
  httpRequest.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      blocks = JSON.parse(this.responseText).blocks;
    } 
  };
  httpRequest.setRequestHeader("Content-type", "application/json");
  httpRequest.send();
  return blocks;
}

function signOut() {
  let httpRequest = new XMLHttpRequest();            
  httpRequest.open('GET', '/api/signout', false);
  httpRequest.send();
  return status;
}

function passwordReset() {
  if(!checkPasswordConfirmationReset()){
    return;
  }
  const resetInfo = {
    "password": document.getElementById("password-recovery-form")[0].value
  }
  const queue = window.location.href.split("?")[1];
  let httpRequest = new XMLHttpRequest();            
  httpRequest.open('POST', '/api/passwordreset?'+queue, false);
  httpRequest.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      swal("Great!", "Your password was changed successfully", "success");
      document.getElementById("close-password").click();
    } else {
      swal("Ooos!", "Something went wrong", "error");
    }
  };
  httpRequest.setRequestHeader("Content-type", "application/json");
  httpRequest.send(JSON.stringify(resetInfo)); 
}

//check this one DRY
function checkPasswordConfirmationReset() {
  const password = document.getElementById("new-password-reset"),
    passwordConfirmation = document.getElementById("confirm-password-reset");
    if(password.value != passwordConfirmation.value){
      passwordNotEqual(password, passwordConfirmation);
      return false;
    }
    return true;
}

function populateHome(obj) {
  if(obj && window.location.pathname.slice(1)!=obj.url) {
    history.pushState(obj, obj.title, obj.url);
    gtag('config', 'UA-109487361-1');
  }
  cleanElement(iconsContainer);
  setIcons(iconsContainer, approvedIcons["icons"]);
}

document.getElementById("register-link").onclick = function(event) {
  document.getElementById("login").style.display = "none";
  document.getElementById("restore-password-email").style.display = "none";
  document.getElementById("signup").style.display = "block";
}

document.getElementById("logout").onclick = function(event) {
  signOut();
  document.getElementById("home").click();
}

document.getElementById("login-link").onclick = function(event) {
  document.getElementById("signup").style.display = "none";
  document.getElementById("restore-password-email").style.display = "none";
  document.getElementById("login").style.display = "block";
}

document.getElementById("forgot-password").onclick = function(event) {
  document.getElementById("login").style.display = "none";
  document.getElementById("signup").style.display = "none";
  document.getElementById("restore-password-email").style.display = "block";
}

document.getElementById("password-reset-email").onclick = function(event) {
  passwordResetEmail();
}

document.getElementById("contact-submit").onclick = function(event) {
  submitContact();
}

function passwordResetEmail() {
  const email = {
    "email": document.getElementById("password-reset-email-form")[0].value
  }
  let httpRequest = new XMLHttpRequest();            
  httpRequest.open('POST', '/api/forgotpassword', false);
  httpRequest.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      swal("Good news!", "Password reset link have been mailed", "success");
      document.getElementById("close-password").click();
    } else {
      swal("Ooos!", JSON.parse(this.responseText).message, "error");
    }
  };
  httpRequest.setRequestHeader("Content-type", "application/json");
  httpRequest.send(JSON.stringify(email)); 
}

function checkEmail(email) {
  const validEmail = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,63}$/.test(email.toLowerCase());
  return validEmail;
}

function checkFill(value) {
  if(value.length < 1) {
    return false;
  }
  return true;
}

function checkSpace(value) {
  const validEmail = /\s/.test(value);
  return validEmail;
}

function contactUs() {
  document.getElementById("contact-modal").style.display = "block";
}

function setTitlePosition(event) {
  document.getElementById("hover-title").style.left = event.pageX + 5 + "px";
  document.getElementById("hover-title").style.top = event.pageY + 5 + "px";
}

function showTitle(element, event) {
  event.stopPropagation();
  document.getElementById("hover-title").innerHTML = "<p>" + element.name + "</p>";
  document.getElementById("hover-title").style.display = "block";
}

document.getElementById("grid-container").onmouseover = function() {
  document.getElementById("hover-title").innerHTML = "";
  document.getElementById("hover-title").style.display = "none";
}

document.getElementById("icons-container").onmouseover = function() {
  document.getElementById("hover-title").innerHTML = "<p>Rent block</p>";
  document.getElementById("hover-title").style.display = "block";
}

document.getElementById("icons-container").onmousemove = function(event) {
  document.getElementById("hover-title").style.left = event.pageX + 5 + "px";
  document.getElementById("hover-title").style.top = event.pageY + 5 + "px";
}

document.getElementById("icons-container").onclick = function(event) {
  document.getElementById("hover-title").style.display = "none";
  document.getElementById("buy").click();
}

document.getElementById("ratio").onclick = function(event) {
  document.getElementById("ratio").className = "hide-scale-option";
  document.getElementById("no-ratio").className = "";
}

document.getElementById("no-ratio").onclick = function(event) {
  ratio = document.getElementById("blocks-columns").value/document.getElementById("blocks-rows").value;
  document.getElementById("no-ratio").className = "hide-scale-option";
  document.getElementById("ratio").className = "";
}