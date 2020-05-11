var AddingTest = false;
var BleAddTestSendArray = [];
var LastAddedData = "";
var BleSendDataIndex = 0;
//var BleSendDelay = 0;
var BleSendTestMode;

app.controller('AddTest', function($scope) {
    $scope.Name="";

    $scope.InfillTypeOptions = ["Rectilinear", "Grid", "Triangles", "Stars", "Cubic", "Line", "Concentric", "Honeycomb", "3d Honeycomb", "Gyroid", "Hilbert Curve", "Archimedean Chords", "Octagram Spiral"];
    $scope.InfillType = "Gyroid";

    $scope.MaterialTypeOptions = ["PLA", "PETG", "PET", "ABS", "TPU", "PC", "NYLON", "ASA"];
    $scope.MaterialType = "PLA";

    $scope.parameter = [
        {Name: "Infill", Value: 15, Unit: "%"},
        {Name: "Layer Height", Value: 0.3, Unit: "mm"},
        {Name: "First Layer Height", Value: 0.3, Unit: "mm"},
        {Name: "Nozzle Size", Value: 0.5, Unit: "mm"},
        {Name: "Bed Temperatur", Value: 70, Unit: "°"},
        {Name: "Nozzle Temperatur", Value: 200, Unit: "°"},
        {Name: "Vertical Shells", Value: 3, Unit: ""},
        {Name: "Top Layers", Value: 3, Unit: ""},
        {Name: "Bottom Layers", Value: 3, Unit: ""}
    ];

    $scope.TestModes = ["Slow Test (M10)", "Fast Test (M13)"];
    $scope.SelectedMode;


    $scope.Notes="";

    $scope.NewParameterField="";
    $scope.AddParameter = function() {
        if($scope.NewParameterField!=""){
            $scope.parameter.push({Name: $scope.NewParameterField, Value: 0, Unit: ""});
            $scope.NewParameterField="";
        }
    }

    $scope.RemoveParameter = function(index) {	
        $scope.parameter.splice(index, 1);
    }

    $scope.StartTest = function(){

        if($scope.Name!="" && $scope.SelectedMode!=null){
            var Mode;
            if($scope.SelectedMode==$scope.TestModes[0]){
                Mode="M10";
            } else if ($scope.SelectedMode==$scope.TestModes[1]){
                Mode="M13";
            }
            $scope.Sending=true;
            $scope.parameter.unshift({Name: "Infill Type", Value:'"'+$scope.InfillType+'"', Unit: ""});
            $scope.parameter.unshift({Name: "Material", Value:'"'+$scope.MaterialTypeType+'"', Unit: ""});

            BleStartNewTest($scope.Name, $scope.parameter, Mode, $scope.Notes);
        }else{
            alert("Please Select Test Mode and set Name")
        }
    }

    $scope.ExitStartTest =function(){
        BleSendDataIndex = 0
        $scope.Sending=false;
        $scope.$parent.ControllerInterface=true;
    }

    $scope.SendingStatus=0;
    $scope.Sending=false;
});  


function BleStartNewTest(Name, Parameter, TestMode, Notes){
    BleAddTestSendArray.push("{");
    BleAddTestSendArray.push('"MetaData": {');
    BleAddTestSendArray.push('"Name": "' + Name + '",');
    BleAddTestSendArray.push('"Date": "' + GetDateTime() + '",');
    BleAddTestSendArray.push('"Parameter": {');
    for(var x of Parameter){
        BleAddTestSendArray.push('"' + x.Name + '" : "' + x.Value + " " + x.Unit + '",');
    }
    BleAddTestSendArray.push('},');
    BleAddTestSendArray.push('"TestMode": "' + TestMode + '",');
    BleAddTestSendArray.push('"Notes": "' + Notes + '"');
    BleAddTestSendArray.push('},');
    // BleAddTestSendArray.push('}');

    BleSendTestMode = TestMode;
    AddingTest=true;
    BleSendTestData();
}

function BleSendTestData(respons){
    if(respons){
        if(respons=="OK NEW"){
            send(BleAddTestSendArray[BleSendDataIndex]);
        }else{
            if(respons==BleAddTestSendArray[BleSendDataIndex]){
                //   send("OK");
                BleSendDataIndex++;
                if(BleSendDataIndex==BleAddTestSendArray.length){
                    send("OKEND "+BleSendTestMode);
                    //setTimeout(function () {send("END "+BleSendTestMode)},BleSendDelay);
                    AddingTest=false;
                    var scope = angular.element(document.getElementById("NewTest")).scope();
                    scope.ExitStartTest();
                }else{
                    console.log("Delay");
                    send("OK"+BleAddTestSendArray[BleSendDataIndex]);
                    //setTimeout(function () {send(BleAddTestSendArray[BleSendDataIndex])},BleSendDelay);
                }
            }else{
                send("FALSE");
            }
        }
    }else{
        send("NEW");
    }
    SetSendStat((BleSendDataIndex*100)/ BleAddTestSendArray.length);
}

function GetDateTime() {
    var now     = new Date(); 
    var year    = now.getFullYear();
    var month   = now.getMonth()+1; 
    var day     = now.getDate();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds(); 
    if(month.toString().length == 1) {
        month = '0'+month;
    }
    if(day.toString().length == 1) {
        day = '0'+day;
    }   
    if(hour.toString().length == 1) {
        hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
        minute = '0'+minute;
    }
    if(second.toString().length == 1) {
        second = '0'+second;
    }   
    var dateTime = year+'/'+month+'/'+day+' '+hour+':'+minute+':'+second;   
    return dateTime;
}

function SetSendStat(Percent){
    var scope = angular.element(document.getElementById("NewTest")).scope();
    scope.$apply(function(){
        scope.SendingStatus = round(Percent);
    })
}