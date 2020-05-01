var DefaultStepSize=1;

var app=angular.module("app", ["chart.js"]);

app.controller("Controller", function ($scope, $interval) {
    $scope.ChartHeight = innerDimensions('ChartCon').height;
    $scope.ChartWidth = innerDimensions('ChartCon').width;
    $scope.i = 0;
    var x = 0
    $scope.labels = [];
    $scope.data = [];
    $scope.fill=false;
    $scope.update = function() {
        x+=getRandomArbitrary(-7,10);
        $scope.data.push(x);
        $scope.labels.push($scope.i++);
    }
    $scope.newData = function(data, steps) {
        var DataSteps = steps || DefaultStepSize;
        $scope.data.push(data);
        $scope.labels.push($scope.i++);
    }
    $scope.$watch(labels, watcherFunction, true);
    function watcherFunction(newData) {
        console.log(newData);
        // do sth if array was changed
    }
    //$interval(function (){$scope.newData(4,1);}, 100);
    $scope.options = {
        responsive: true,
        animation: {
            duration: 0},
        tooltips: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Time (s)'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Force'
                }
            }]
        },
        elements: {
            line: {
                backgroundColor: '#35FF83',
                borderColor: '#35FF83',
                borderWidth: 1,
                tension: 0.1,
                fill: false,
            },
            point:{
                radius:0
            }
        }
    };
});

function innerDimensions(id){
    var node= document.getElementById(id)
    var computedStyle = getComputedStyle(node);

    let width = node.clientWidth; // width with padding
    let height = node.clientHeight; // height with padding

    height -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    width -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    return { height, width };
}


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////Bluetooth Web Api////////////////////////////////////////////
////////Using Code from the Google Chrome Web Ble example////////////
var charackteristicsCache = null;
var serviceUuid = "0xFFE0";
var characteristicUuid = "0xFFE1";
let deviceCache = null;
let readBuffer = '';

var currentServiceUuid;
var currentCharacteristicUuid;

function onStartButtonClick() {
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
            charackteristicsCache.addEventListener('characteristicvaluechanged',
                                                   handleNotifications);
            send("C;");
        });
    })
        .catch(error => {
        console.log('Argh! ' + error);
    });
}

function handleDisconnection(event) {   //function that tries to reconnect if connection is suddenly lost
    let device = event.target;
    console.log('"' + device.name +
                '" bluetooth device disconnected, trying to reconnect...');
    connectDeviceAndCacheCharacteristic(device).
    then(characteristic => startNotifications(characteristic)).
    catch(error => log(error));
}

function onStopButtonClick() {    //function not working because only notification is stopped
    if (charackteristicsCache) {
        charackteristicsCache.stopNotifications()
            .then(_ => {
            console.log('> Notifications stopped');
            charackteristicsCache.removeEventListener('characteristicvaluechanged',
                                                      handleNotifications);
        })
            .catch(error => {
            console.log('Argh! ' + error);
        });
    }
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
        if (c === '\n') {
            let data = readBuffer.trim();
            readBuffer = '';
            if (data) {
                if(data=="E"){
                    console.log(("Error"));
                    OccuredErrors++;
                }
            }
            console.log(readBuffer);
        }
        else {
            readBuffer += c;
        }
    }
}

function send(data) {    //function that sends data and splits it up if to big
    data = String(data);

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

    log(data, 'out');
}

function writeToCharacteristic(characteristic, data) {
    characteristic.writeValue(new TextEncoder().encode(data));
}

