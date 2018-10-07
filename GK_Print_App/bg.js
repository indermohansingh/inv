// App Launched
var VENDOR_ID = 0x0456; //0x04b8;
var PRODUCT_ID = 0x0808; // 0x0202;
var DEVICE_INFO = {"vendorId": VENDOR_ID, "productId": PRODUCT_ID};

function AskFileToBePrinted() {
    
chrome.fileSystem.chooseEntry( {
    type: 'openFile',
    suggestedName: 'print.txt',
    accepts: [{extensions: ['txt']}]
  }, function(fileEntry){
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
      //chrome.app.window.get("print_app").close();
    }
    fileEntry.file(function(file) {
      var reader = new FileReader();
      reader.onloadend = function(e) {
        printData(e.target.result);
        //printData(convertStringToArrayBuffer(e.target.result));
      };
      reader.readAsArrayBuffer(file);
      //reader.readAsText(file);
    });
  });
}

function getEndPoint(device, data) {
        chrome.usb.getConfiguration(device, function (allConfigs) {
        console.log(allConfigs);
        var lenOfEndPts = 0;
        try {lenOfEndPts = allConfigs.interfaces[0].endpoints.length;} catch {}
        var endPointAdd = -1;
        if (lenOfEndPts > 0) {
            if (allConfigs.interfaces[0].endpoints[0].direction == "out")
                endPointAdd = allConfigs.interfaces[0].endpoints[0].address;
            else 
                endPointAdd = allConfigs.interfaces[0].endpoints[1].address;

            sendDataToInterface(device, endPointAdd, data);
        }
    } );
}

function sendDataToInterface(device, endPoint, data) {
      var info = {"direction": "out", "endpoint": endPoint, "data": data};
      
      chrome.usb.claimInterface(device, 0, function() {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
          //chrome.app.window.get("print_app").close();
        }
        chrome.usb.bulkTransfer(device, info, function(transferResult) {
          console.log("Send data", transferResult);
          chrome.usb.releaseInterface(device, 0, function() {
            if (chrome.runtime.lastError)
              console.error(chrome.runtime.lastError);
            //chrome.app.window.get("print_app").close();
          });
        });
      });
}

function printData(data) {
  var onDeviceFound = function(devices) {
    if (devices && devices.length>0) {
      device = devices[0];
      console.log("Device found: " + device.handle);

        getEndPoint(device, data);
        
    } else {
      console.log("Device not found");
      //chrome.app.window.get("print_app").close();
    }
  }
  chrome.usb.findDevices(DEVICE_INFO, onDeviceFound);
}

var convertStringToArrayBuffer=function(str) {
  str = str.replace(/\\x\w+/g, '');
  var tmp = "";
  for (var i=0; i<str.length; i++) {
    if (str[i].match(/\\/)) {
      if (str[i+1] == "n") tmp = tmp + "\n";
      if (str[i+1] == "t") tmp = tmp + "\t";
      i = i + 1;
    } else {
      tmp = tmp + str[i];
    }
  }
  tmp = tmp + "\n\n"; //\n\n\n\n\n";
  //console.log(tmp);

  var buf=new ArrayBuffer(tmp.length);
  var bufView = new Uint8Array(buf);
  for (var i=0; i<tmp.length; i++) {
    bufView[i]=tmp.charCodeAt(i);
  }
  return buf;
}

function printString(strData) {
    var arrBuf = convertStringToArrayBuffer(strData);
    printData (arrBuf);
}



chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
      printString(request.dataToPrint); 
  }
    );

