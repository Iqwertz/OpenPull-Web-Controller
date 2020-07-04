////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////Bluetooth Web Api////////////////////////////////////////////
////////Using Code from the Google Chrome Web Ble example////////////

var charackteristicsCache = null;
var serviceUuid = "0xFFE0";
var characteristicUuid = "0xFFE1";
var deviceCache = null;
var readBuffer = '';
var currentServiceUuid;
var currentCharacteristicUuid;

function onStartButtonClick() {  //Start Ble 
    if (serviceUuid.startsWith('0x')) {
        currentServiceUuid = parseInt(serviceUuid);
    }

    if (characteristicUuid.startsWith('0x')) {
        currentCharacteristicUuid = parseInt(characteristicUuid);
    }
    console.log('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice({filters: [{services: [currentServiceUuid]}]})
        .then(device => {
        console.log('Connecting to GATT Server...');
        console.log('Connected to '+ device.name)
        deviceCache = device;
        deviceCache.addEventListener('gattserverdisconnected', handleDisconnection);

        return device.gatt.connect();
    })
        .then(server => {
        console.log('Getting Service...');
        return server.getPrimaryService(currentServiceUuid);
    })
        .then(service => {
        console.log('Getting Characteristic...');
        return service.getCharacteristic(currentCharacteristicUuid);
    })
        .then(characteristic => {
        charackteristicsCache = characteristic;
        return charackteristicsCache.startNotifications().then(_ => {

            console.log('> Notifications started');
            charackteristicsCache.addEventListener('characteristicvaluechanged',     handleNotifications);
            SetBleVar(true); //Set the Ble var to activate the ble buttons
            send("SdStat"); //Send Sd stat to chek if sd cara is inserted
        });
    })
        .catch(error => {
        console.log('Argh! ' + error);
    });
}

function handleDisconnection(event) {   //function that trys to reconnect if connection is suddenly lost
    SetBleVar(false);  //Disable Ble Buttons because device maschine disconnected
    let device = event.target;
    console.log('"' + device.name +
                '" bluetooth device disconnected, trying to reconnect...');
    connectDeviceAndCacheCharacteristic(device).
    then(characteristic => {
        charackteristicsCache = characteristic;
        return charackteristicsCache.startNotifications().then(_ => {

            console.log('> Notifications started');
            charackteristicsCache.addEventListener('characteristicvaluechanged',     handleNotifications);
            SetBleVar(true);  //Set the Ble var to activate the ble buttons
            
        });
    }).
    catch(error => console.log(error));
}

function connectDeviceAndCacheCharacteristic(device) {
    if (device.gatt.connected && characteristicCache) {
        return Promise.resolve(characteristicCache);
    }

    console.log('Connecting to GATT server...');

    return device.gatt.connect().
    then(server => {
        console.log('GATT server connected, getting service...');

        return server.getPrimaryService(0xFFE0);
    }).
    then(service => {
        console.log('Service found, getting characteristic...');

        return service.getCharacteristic(0xFFE1);
    }).
    then(characteristic => {
        console.log('Characteristic found');
        characteristicCache = characteristic;

        return characteristicCache;
    });
}

function handleNotifications(event) {
    let value = event.target.value;
    let text = new TextDecoder().decode(event.target.value);
    for (let c of text) {
        if (c === '\n') {  //read text until ther is a line break
            let data = readBuffer.trim();
            readBuffer = '';
            if (data) {
                console.log(data); //log data
                if(!AddingTest){  //When there is currently no test added then the data is a new command
                    if(data.charAt(0)=="V"){  //New Value
                        addData(Number(data.substr(1)));  //Get Value and set it to the chart
                    }else if (data.charAt(0)=="C"){   //Log data
                        console.log(data.substr(1));   //Get the Value and log it
                    }else if (data.charAt(0)=="A"){  // If hte command starts with "A" it is an alert
                        console.log(data.substr(1));
                        alert(data.substr(1));
                    }else if (data=="SDfalse"){  // Alert that no sd is in the maschine
                        alert("Attention! No Sd Card!");
                    }else if (data.substr(0,7)=="FinTest"){  // Alert that no sd is in the maschine
                        console.log("Test Finished, Maximum: " + data.substr(data.indexOf("B")+1,data.indexOf(";")) + " / Breakpoint: " + data.substr(data.indexOf("M")+1));
                        alert("Test Finished, Maximum: " + data.substr(data.indexOf("M")+1) + " / Breakpoint: " + data.substring(data.indexOf("B")+1,data.indexOf(";")));
                        var scope = angular.element(document.getElementById("ControlsId")).scope();
                        scope.$apply(function(){
                            scope.MoveEnable = true;
                        })
                    }
                }else{
                    BleSendTestData(data); //When there is currently data added send the data to the "BleSendTestData()" function
                }
            }
        }
        else {
            readBuffer += c;
        }
    }
}

function send(data) {    //function that sends data and splits it up if to big
    data = String(data);

    console.log("Sending: "+ data)

    if (!data || !charackteristicsCache) {
        return;
    }

    if (data.length > 20) {
        let chunks = data.match(/(.|[\r\n]){1,20}/g);

        writeToCharacteristic(charackteristicsCache, chunks[0]);

        for (let i = 1; i < chunks.length; i++) {
            setTimeout(() => {
                writeToCharacteristic(charackteristicsCache, chunks[i]);
            }, i * 100);
        }
    }
    else {
        writeToCharacteristic(charackteristicsCache, data);
    }
}

function writeToCharacteristic(characteristic, data) {
    characteristic.writeValue(new TextEncoder().encode(data));
} 

function SetBleVar(state){
    if(state){
          // alert("Bluetooth Connected")
    }else{
           alert("Bluetooth Disconnected")
    }
    var scope = angular.element(document.getElementById("ControlsId")).scope();
    scope.$apply(function(){
        scope.BleStatus = state;
        scope.MoveEnable = state;
    })
}